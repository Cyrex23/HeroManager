package com.heromanager.service;

import com.heromanager.dto.DailySpinResult;
import com.heromanager.dto.MaterialRecipeResponse;
import com.heromanager.dto.MaterialRecipeResponse.MaterialIngredient;
import com.heromanager.dto.MaterialResponse;
import com.heromanager.dto.WeaponRecipeResponse;
import com.heromanager.dto.WeaponRecipeResponse.WeaponIngredient;
import com.heromanager.entity.*;
import com.heromanager.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BlacksmithService {

    private final MaterialTemplateRepository materialTemplateRepo;
    private final PlayerMaterialRepository playerMaterialRepo;
    private final WeaponRecipeRepository weaponRecipeRepo;
    private final MaterialRecipeRepository materialRecipeRepo;
    private final PlayerRepository playerRepo;
    private final EquippedItemRepository equippedItemRepo;
    private final WeaponSpellRepository weaponSpellRepo;

    private static final int[] SEED_QTY = {0, 30, 15, 8, 3, 1}; // index = tier
    private static final Random RNG = new Random();

    @Transactional
    public List<MaterialResponse> getMaterials(Long playerId) {
        if (playerMaterialRepo.countByPlayerId(playerId) == 0) {
            seedMaterials(playerId);
        }
        List<MaterialTemplate> templates = materialTemplateRepo.findAllByOrderByTierAscNameAsc();
        Map<Long, Integer> qtys = playerMaterialRepo.findByPlayerId(playerId).stream()
            .collect(Collectors.toMap(pm -> pm.getMaterialTemplate().getId(), PlayerMaterial::getQuantity));
        return templates.stream()
            .map(t -> new MaterialResponse(t.getId(), t.getName(), t.getIconKey(), t.getTier(), t.getCategory(), qtys.getOrDefault(t.getId(), 0)))
            .toList();
    }

    private void seedMaterials(Long playerId) {
        Player player = playerRepo.findById(playerId).orElseThrow();
        List<MaterialTemplate> all = materialTemplateRepo.findAll();
        for (MaterialTemplate t : all) {
            int qty = SEED_QTY[Math.min(t.getTier(), 5)];
            PlayerMaterial pm = new PlayerMaterial();
            pm.setPlayer(player);
            pm.setMaterialTemplate(t);
            pm.setQuantity(qty);
            playerMaterialRepo.save(pm);
        }
    }

    @Transactional(readOnly = true)
    public List<WeaponRecipeResponse> getWeaponRecipes(Long playerId) {
        Map<Long, Integer> qtys = playerMaterialRepo.findByPlayerId(playerId).stream()
            .collect(Collectors.toMap(pm -> pm.getMaterialTemplate().getId(), PlayerMaterial::getQuantity));
        return weaponRecipeRepo.findAllWithIngredients().stream()
            .map(r -> toWeaponRecipeResponse(r, qtys))
            .toList();
    }

    private WeaponRecipeResponse toWeaponRecipeResponse(WeaponRecipe r, Map<Long, Integer> qtys) {
        ItemTemplate it = r.getItemTemplate();
        List<WeaponIngredient> ings = r.getIngredients().stream()
            .map(i -> new WeaponIngredient(
                i.getMaterialTemplate().getId(),
                i.getMaterialTemplate().getName(),
                i.getMaterialTemplate().getIconKey(),
                i.getQuantity(),
                qtys.getOrDefault(i.getMaterialTemplate().getId(), 0)
            )).toList();
        List<WeaponRecipeResponse.SpellInfo> spells = weaponSpellRepo.findByItemTemplateId(it.getId()).stream()
            .map(s -> new WeaponRecipeResponse.SpellInfo(
                s.getSpellName(), s.getSpellManaCost(), s.getSpellTrigger(), s.getSpellChance(),
                // Base stats
                s.getSpellBonusPa(), s.getSpellBonusMp(), s.getSpellBonusDex(),
                s.getSpellBonusElem(), s.getSpellBonusMana(), s.getSpellBonusStam(),
                // Combat modifiers
                s.getSpellBonusAttack(), s.getSpellBonusMagicProficiency(),
                s.getSpellBonusSpellMastery(), s.getSpellBonusSpellActivation(),
                s.getSpellBonusDexProficiency(), s.getSpellBonusDexPosture(),
                s.getSpellBonusCritChance(), s.getSpellBonusCritDamage(),
                // Progression
                s.getSpellBonusExpBonus(), s.getSpellBonusGoldBonus(), s.getSpellBonusItemDiscovery(),
                // Immunities
                s.getSpellBonusPhysicalImmunity(), s.getSpellBonusMagicImmunity(), s.getSpellBonusDexEvasiveness(),
                // Meta
                s.getMaxUsages(), s.getLastsTurns(), s.isAffectsOpponent(), s.getTurnThreshold()
            )).toList();
        return new WeaponRecipeResponse(
            r.getId(), it.getId(), it.getName(), it.getIconKey(), it.getWeaponTier(), it.getCost(),
            // base stats
            it.getBonusPa(), it.getBonusMp(), it.getBonusDex(), it.getBonusElem(), it.getBonusMana(), it.getBonusStam(),
            // combat modifiers
            it.getBonusAttack(), it.getBonusMagicProficiency(), it.getBonusSpellMastery(), it.getBonusSpellActivation(),
            it.getBonusDexProficiency(), it.getBonusDexPosture(), it.getBonusCritChance(), it.getBonusCritDamage(),
            // progression
            it.getBonusExpBonus(), it.getBonusGoldBonus(), it.getBonusItemDiscovery(),
            // defenses
            it.getBonusPhysicalImmunity(), it.getBonusMagicImmunity(), it.getBonusDexEvasiveness(),
            // spells list
            spells,
            r.getCraftHours(),
            ings
        );
    }

    @Transactional(readOnly = true)
    public List<MaterialRecipeResponse> getMaterialRecipes(Long playerId) {
        Map<Long, Integer> qtys = playerMaterialRepo.findByPlayerId(playerId).stream()
            .collect(Collectors.toMap(pm -> pm.getMaterialTemplate().getId(), PlayerMaterial::getQuantity));
        return materialRecipeRepo.findAllWithIngredients().stream()
            .map(r -> toMaterialRecipeResponse(r, qtys))
            .toList();
    }

    private MaterialRecipeResponse toMaterialRecipeResponse(MaterialRecipe r, Map<Long, Integer> qtys) {
        MaterialTemplate out = r.getOutputMaterial();
        List<MaterialIngredient> ings = r.getIngredients().stream()
            .map(i -> new MaterialIngredient(
                i.getMaterialTemplate().getId(),
                i.getMaterialTemplate().getName(),
                i.getMaterialTemplate().getIconKey(),
                i.getQuantity(),
                qtys.getOrDefault(i.getMaterialTemplate().getId(), 0)
            )).toList();
        return new MaterialRecipeResponse(
            r.getId(), out.getId(), out.getName(), out.getIconKey(), out.getTier(),
            r.getOutputQuantity(), qtys.getOrDefault(out.getId(), 0), r.getCraftHours(), ings
        );
    }

    @Transactional
    public int finishNow(Long playerId, String tier) {
        int cost = switch (tier.toUpperCase()) {
            case "LEGENDARY" -> 30;
            case "EPIC"      -> 20;
            default          -> 10;
        };
        Player player = playerRepo.findById(playerId).orElseThrow();
        if (player.getDiamonds() < cost) {
            throw new IllegalStateException(
                "Not enough diamonds. Need " + cost + ", have " + player.getDiamonds() + ".");
        }
        player.setDiamonds(player.getDiamonds() - cost);
        playerRepo.save(player);
        return player.getDiamonds();
    }

    @Transactional
    public void craftWeapon(Long playerId, Long itemTemplateId) {
        WeaponRecipe recipe = weaponRecipeRepo.findByItemTemplateId(itemTemplateId)
            .orElseThrow(() -> new IllegalArgumentException("No recipe for item " + itemTemplateId));
        deductIngredients(playerId, recipe.getIngredients().stream()
            .collect(Collectors.toMap(i -> i.getMaterialTemplate().getId(), WeaponRecipeIngredient::getQuantity)));
        EquippedItem weapon = new EquippedItem();
        weapon.setPlayerId(playerId);
        weapon.setItemTemplateId(itemTemplateId);
        equippedItemRepo.save(weapon);
    }

    @Transactional
    public void craftMaterial(Long playerId, Long materialRecipeId) {
        MaterialRecipe recipe = materialRecipeRepo.findById(materialRecipeId)
            .orElseThrow(() -> new IllegalArgumentException("Recipe not found: " + materialRecipeId));
        deductIngredients(playerId, recipe.getIngredients().stream()
            .collect(Collectors.toMap(i -> i.getMaterialTemplate().getId(), MaterialRecipeIngredient::getQuantity)));
        Player player = playerRepo.findById(playerId).orElseThrow();
        PlayerMaterial pm = playerMaterialRepo
            .findByPlayerIdAndMaterialTemplateId(playerId, recipe.getOutputMaterial().getId())
            .orElseGet(() -> {
                PlayerMaterial n = new PlayerMaterial();
                n.setPlayer(player);
                n.setMaterialTemplate(recipe.getOutputMaterial());
                n.setQuantity(0);
                return n;
            });
        pm.setQuantity(pm.getQuantity() + recipe.getOutputQuantity());
        playerMaterialRepo.save(pm);
    }

    public Map<String, Object> getSpinStatus(Long playerId) {
        Player player = playerRepo.findById(playerId).orElseThrow();
        LocalDateTime lastSpin = player.getLastBlacksmithSpin();
        boolean spin1Available = lastSpin == null || !lastSpin.toLocalDate().equals(LocalDate.now());
        boolean spin2Available = player.isDoubleSpinPurchased() &&
            (player.getLastBlacksmithSpin2() == null || !player.getLastBlacksmithSpin2().toLocalDate().equals(LocalDate.now()));
        boolean canSpin = spin1Available || spin2Available;
        int spinsRemaining = (spin1Available ? 1 : 0) + (spin2Available ? 1 : 0);
        long nextResetMs = LocalDate.now().plusDays(1).atStartOfDay()
            .atZone(ZoneId.systemDefault()).toInstant().toEpochMilli();
        return Map.of("canSpin", canSpin, "nextResetMs", nextResetMs, "spinsRemaining", spinsRemaining);
    }

    @Transactional
    public DailySpinResult claimDailySpin(Long playerId) {
        Player player = playerRepo.findById(playerId).orElseThrow();
        LocalDateTime lastSpin = player.getLastBlacksmithSpin();
        boolean spin1UsedToday = lastSpin != null && lastSpin.toLocalDate().equals(LocalDate.now());
        // Use spin 2 slot if spin 1 already used today and player owns double spin
        boolean useSlot2 = spin1UsedToday && player.isDoubleSpinPurchased() &&
            (player.getLastBlacksmithSpin2() == null || !player.getLastBlacksmithSpin2().toLocalDate().equals(LocalDate.now()));
        if (spin1UsedToday && !useSlot2) {
            throw new IllegalStateException("Already spun today");
        }
        List<MaterialTemplate> pool = materialTemplateRepo.findByTierLessThanEqual(2);
        if (pool.isEmpty()) throw new IllegalStateException("No materials available");
        MaterialTemplate won = pool.get(RNG.nextInt(pool.size()));
        int qty = 1;
        // Store pending — don't award yet; player must choose
        player.setPendingSpinMaterialId(won.getId());
        player.setPendingSpinQty(qty);
        if (useSlot2) {
            player.setLastBlacksmithSpin2(LocalDateTime.now());
        } else {
            player.setLastBlacksmithSpin(LocalDateTime.now());
        }
        playerRepo.save(player);
        long nextResetMs = LocalDate.now().plusDays(1).atStartOfDay()
            .atZone(ZoneId.systemDefault()).toInstant().toEpochMilli();
        return new DailySpinResult(won.getId(), won.getName(), won.getIconKey(), won.getTier(), qty, nextResetMs);
    }

    @Transactional
    public void claimSpinReward(Long playerId, String choice) {
        Player player = playerRepo.findById(playerId).orElseThrow();
        Long matId = player.getPendingSpinMaterialId();
        if (matId == null) throw new IllegalStateException("No pending spin reward");
        final long resolvedMatId = matId;
        int qty = player.getPendingSpinQty();
        switch (choice) {
            case "material" -> {
                MaterialTemplate mat = materialTemplateRepo.findById(resolvedMatId).orElseThrow();
                PlayerMaterial pm = playerMaterialRepo
                    .findByPlayerIdAndMaterialTemplateId(playerId, resolvedMatId)
                    .orElseGet(() -> {
                        PlayerMaterial n = new PlayerMaterial();
                        n.setPlayer(player);
                        n.setMaterialTemplate(mat);
                        n.setQuantity(0);
                        return n;
                    });
                pm.setQuantity(pm.getQuantity() + qty);
                playerMaterialRepo.save(pm);
            }
            case "gold"    -> player.setGold(player.getGold() + 20);
            case "diamond" -> player.setDiamonds(player.getDiamonds() + 1);
            default        -> throw new IllegalArgumentException("Invalid choice: " + choice);
        }
        player.setPendingSpinMaterialId(null);
        player.setPendingSpinQty(0);
        playerRepo.save(player);
    }

    private void deductIngredients(Long playerId, Map<Long, Integer> required) {
        for (Map.Entry<Long, Integer> e : required.entrySet()) {
            PlayerMaterial pm = playerMaterialRepo
                .findByPlayerIdAndMaterialTemplateId(playerId, e.getKey())
                .orElseThrow(() -> new IllegalStateException("Missing material " + e.getKey()));
            if (pm.getQuantity() < e.getValue()) {
                throw new IllegalStateException("Insufficient quantity for material " + e.getKey());
            }
            pm.setQuantity(pm.getQuantity() - e.getValue());
            playerMaterialRepo.save(pm);
        }
    }
}
