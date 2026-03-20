package com.heromanager.service;

import com.heromanager.dto.ShopHeroResponse;
import com.heromanager.entity.*;
import com.heromanager.repository.*;
import com.heromanager.util.AbilitySpellBuilder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
public class ShopService {

    private final HeroTemplateRepository heroTemplateRepository;
    private final SummonTemplateRepository summonTemplateRepository;
    private final HeroRepository heroRepository;
    private final SummonRepository summonRepository;
    private final PlayerRepository playerRepository;
    private final ItemTemplateRepository itemTemplateRepository;
    private final AbilityTemplateRepository abilityTemplateRepository;
    private final EquippedItemRepository equippedItemRepository;
    private final EquippedAbilityRepository equippedAbilityRepository;
    private final AbilitySpellBuilder abilitySpellBuilder;

    public ShopService(HeroTemplateRepository heroTemplateRepository,
                       SummonTemplateRepository summonTemplateRepository,
                       HeroRepository heroRepository,
                       SummonRepository summonRepository,
                       PlayerRepository playerRepository,
                       ItemTemplateRepository itemTemplateRepository,
                       AbilityTemplateRepository abilityTemplateRepository,
                       EquippedItemRepository equippedItemRepository,
                       EquippedAbilityRepository equippedAbilityRepository,
                       AbilitySpellBuilder abilitySpellBuilder) {
        this.heroTemplateRepository = heroTemplateRepository;
        this.summonTemplateRepository = summonTemplateRepository;
        this.heroRepository = heroRepository;
        this.summonRepository = summonRepository;
        this.playerRepository = playerRepository;
        this.itemTemplateRepository = itemTemplateRepository;
        this.abilityTemplateRepository = abilityTemplateRepository;
        this.equippedItemRepository = equippedItemRepository;
        this.equippedAbilityRepository = equippedAbilityRepository;
        this.abilitySpellBuilder = abilitySpellBuilder;
    }

    public Map<String, Object> listHeroes(Long playerId) {
        List<HeroTemplate> templates = heroTemplateRepository.findAll();
        List<SummonTemplate> summonTemplates = summonTemplateRepository.findAll();

        List<ShopHeroResponse> heroes = new ArrayList<>();
        for (HeroTemplate t : templates) {
            if (t.isStarter()) continue; // Don't show starter in shop

            boolean owned = heroRepository.existsByPlayerIdAndTemplateId(playerId, t.getId());
            heroes.add(ShopHeroResponse.builder()
                    .templateId(t.getId())
                    .name(t.getName())
                    .displayName(t.getDisplayName())
                    .imagePath(t.getImagePath())
                    .cost(t.getCost())
                    .capacity(t.getCapacity())
                    .baseStats(Map.of(
                            "physicalAttack", t.getBasePa(),
                            "magicPower", t.getBaseMp(),
                            "dexterity", t.getBaseDex(),
                            "element", t.getBaseElem(),
                            "mana", t.getBaseMana(),
                            "stamina", t.getBaseStam()))
                    .growthStats(Map.of(
                            "physicalAttack", t.getGrowthPa(),
                            "magicPower", t.getGrowthMp(),
                            "dexterity", t.getGrowthDex(),
                            "element", t.getGrowthElem(),
                            "mana", t.getGrowthMana(),
                            "stamina", t.getGrowthStam()))
                    .owned(owned)
                    .tier(t.getTier() != null ? t.getTier().name() : null)
                    .element(t.getElement() != null ? t.getElement().name() : null)
                    .build());
        }

        List<Map<String, Object>> summons = new ArrayList<>();
        for (SummonTemplate st : summonTemplates) {
            boolean owned = summonRepository.existsByPlayerIdAndTemplateId(playerId, st.getId());
            summons.add(Map.of(
                    "templateId", st.getId(),
                    "name", st.getDisplayName(),
                    "imagePath", st.getImagePath(),
                    "cost", st.getCost(),
                    "capacity", st.getCapacity(),
                    "baseStats",   buildSummonStatsMap(st, false),
                    "growthStats", buildSummonStatsMap(st, true),
                    "owned", owned
            ));
        }

        return Map.of("heroes", heroes, "summons", summons);
    }

    @Transactional
    public Map<String, Object> buyHero(Long playerId, Long templateId) {
        Player player = playerRepository.findById(playerId)
                .orElseThrow(() -> new ShopException("PLAYER_NOT_FOUND", "Player not found."));

        HeroTemplate template = heroTemplateRepository.findById(templateId)
                .orElseThrow(() -> new ShopException("TEMPLATE_NOT_FOUND", "Hero template not found."));

        if (heroRepository.existsByPlayerIdAndTemplateId(playerId, templateId)) {
            throw new ShopException("ALREADY_OWNED", "You already own " + template.getDisplayName() + ".");
        }

        int heroRosterMax = player.isHeroPlusCapacityPurchased() ? 40 : 20;
        if (heroRepository.findByPlayerId(playerId).size() >= heroRosterMax) {
            throw new ShopException("ROSTER_FULL",
                    "Hero roster is full (" + heroRosterMax + "/" + heroRosterMax + "). Purchase Hero Capacity Plus to expand.");
        }

        if (player.getGold() < template.getCost()) {
            throw new ShopException("INSUFFICIENT_GOLD",
                    "You need " + template.getCost() + " gold but only have " + player.getGold() + ".");
        }

        player.setGold(player.getGold() - template.getCost());
        if (template.getImagePath() != null) {
            player.getUnlockedAvatars().add(template.getImagePath());
        }
        playerRepository.save(player);

        Hero hero = new Hero();
        hero.setPlayerId(playerId);
        hero.setTemplateId(templateId);
        hero.setLevel(1);
        hero.setCurrentXp(0);
        heroRepository.save(hero);

        return Map.of(
                "message", template.getDisplayName() + " purchased successfully!",
                "heroId", hero.getId(),
                "goldRemaining", player.getGold()
        );
    }

    @Transactional
    public Map<String, Object> buySummon(Long playerId, Long templateId) {
        Player player = playerRepository.findById(playerId)
                .orElseThrow(() -> new ShopException("PLAYER_NOT_FOUND", "Player not found."));

        SummonTemplate template = summonTemplateRepository.findById(templateId)
                .orElseThrow(() -> new ShopException("TEMPLATE_NOT_FOUND", "Summon template not found."));

        if (summonRepository.existsByPlayerIdAndTemplateId(playerId, templateId)) {
            throw new ShopException("ALREADY_OWNED", "You already own " + template.getDisplayName() + ".");
        }

        if (player.getGold() < template.getCost()) {
            throw new ShopException("INSUFFICIENT_GOLD",
                    "You need " + template.getCost() + " gold but only have " + player.getGold() + ".");
        }

        player.setGold(player.getGold() - template.getCost());
        playerRepository.save(player);

        Summon summon = new Summon();
        summon.setPlayerId(playerId);
        summon.setTemplateId(templateId);
        summon.setLevel(1);
        summon.setCurrentXp(0);
        summonRepository.save(summon);

        return Map.of(
                "message", template.getDisplayName() + " purchased!",
                "summonId", summon.getId(),
                "goldRemaining", player.getGold()
        );
    }

    public Map<String, Object> listItems() {
        List<ItemTemplate> templates = itemTemplateRepository.findAll();
        List<Map<String, Object>> items = new ArrayList<>();
        for (ItemTemplate t : templates) {
            Map<String, Object> bonuses = new LinkedHashMap<>();
            if (t.getBonusPa() != 0) bonuses.put("physicalAttack", t.getBonusPa());
            if (t.getBonusMp() != 0) bonuses.put("magicPower", t.getBonusMp());
            if (t.getBonusDex() != 0) bonuses.put("dexterity", t.getBonusDex());
            if (t.getBonusElem() != 0) bonuses.put("element", t.getBonusElem());
            if (t.getBonusMana() != 0) bonuses.put("mana", t.getBonusMana());
            if (t.getBonusStam() != 0) bonuses.put("stamina", t.getBonusStam());

            items.add(Map.of(
                    "templateId", t.getId(),
                    "name", t.getName(),
                    "cost", t.getCost(),
                    "bonuses", bonuses
            ));
        }
        return Map.of("items", items);
    }

    @Transactional
    public Map<String, Object> buyItem(Long playerId, Long itemTemplateId) {
        Player player = playerRepository.findById(playerId)
                .orElseThrow(() -> new ShopException("PLAYER_NOT_FOUND", "Player not found."));
        ItemTemplate template = itemTemplateRepository.findById(itemTemplateId)
                .orElseThrow(() -> new ShopException("ITEM_NOT_FOUND", "Item not found."));

        if (player.getGold() < template.getCost()) {
            throw new ShopException("INSUFFICIENT_GOLD",
                    "You need " + template.getCost() + " gold but only have " + player.getGold() + ".");
        }

        player.setGold(player.getGold() - template.getCost());
        playerRepository.save(player);

        EquippedItem ei = new EquippedItem();
        ei.setPlayerId(playerId);
        ei.setItemTemplateId(itemTemplateId);
        equippedItemRepository.save(ei);

        return Map.of(
                "message", template.getName() + " added to team inventory!",
                "goldRemaining", player.getGold()
        );
    }

    @Transactional(readOnly = true)
    public Map<String, Object> listAbilities(Long playerId, Long heroId) {
        Hero hero = heroRepository.findById(heroId)
                .orElseThrow(() -> new ShopException("HERO_NOT_FOUND", "Hero not found."));
        if (!hero.getPlayerId().equals(playerId)) {
            throw new ShopException("HERO_NOT_FOUND", "Hero not found.");
        }

        List<AbilityTemplate> templates = abilityTemplateRepository.findByHeroTemplateId(hero.getTemplateId());
        List<EquippedAbility> equipped = equippedAbilityRepository.findByHeroId(heroId);
        Set<Long> ownedIds = new HashSet<>();
        for (EquippedAbility ea : equipped) {
            ownedIds.add(ea.getAbilityTemplateId());
        }

        List<Map<String, Object>> abilities = new ArrayList<>();
        for (AbilityTemplate t : templates) {
            Map<String, Object> bonuses = new LinkedHashMap<>();
            if (t.getBonusPa() != 0) bonuses.put("physicalAttack", t.getBonusPa());
            if (t.getBonusMp() != 0) bonuses.put("magicPower", t.getBonusMp());
            if (t.getBonusDex() != 0) bonuses.put("dexterity", t.getBonusDex());
            if (t.getBonusElem() != 0) bonuses.put("element", t.getBonusElem());
            if (t.getBonusMana() != 0) bonuses.put("mana", t.getBonusMana());
            if (t.getBonusStam() != 0) bonuses.put("stamina", t.getBonusStam());

            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("templateId", t.getId());
            entry.put("name", t.getName());
            entry.put("cost", t.getCost());
            entry.put("tier", t.getTier());
            entry.put("bonuses", bonuses);
            entry.put("owned", ownedIds.contains(t.getId()));

            List<Map<String, Object>> spellList = abilitySpellBuilder.buildSpellList(t);
            if (spellList != null) entry.put("spells", spellList);

            abilities.add(entry);
        }

        return Map.of(
                "heroName", hero.getTemplate().getDisplayName(),
                "abilities", abilities
        );
    }

    @Transactional
    public Map<String, Object> buyAbility(Long playerId, Long abilityTemplateId, Long heroId) {
        Player player = playerRepository.findById(playerId)
                .orElseThrow(() -> new ShopException("PLAYER_NOT_FOUND", "Player not found."));
        Hero hero = heroRepository.findById(heroId)
                .orElseThrow(() -> new ShopException("HERO_NOT_FOUND", "Hero not found."));
        if (!hero.getPlayerId().equals(playerId)) {
            throw new ShopException("HERO_NOT_FOUND", "Hero not found.");
        }

        AbilityTemplate template = abilityTemplateRepository.findById(abilityTemplateId)
                .orElseThrow(() -> new ShopException("ABILITY_NOT_FOUND", "Ability not found."));

        if (!template.getHeroTemplateId().equals(hero.getTemplateId())) {
            throw new ShopException("WRONG_HERO",
                    template.getName() + " is not available for " + hero.getTemplate().getDisplayName() + ".");
        }
        if (equippedAbilityRepository.findByHeroIdAndAbilityTemplateId(heroId, abilityTemplateId).isPresent()) {
            throw new ShopException("DUPLICATE_ABILITY",
                    hero.getTemplate().getDisplayName() + " already knows " + template.getName() + ".");
        }
        if (player.getGold() < template.getCost()) {
            throw new ShopException("INSUFFICIENT_GOLD",
                    "You need " + template.getCost() + " gold but only have " + player.getGold() + ".");
        }

        player.setGold(player.getGold() - template.getCost());
        playerRepository.save(player);

        EquippedAbility ea = new EquippedAbility();
        ea.setPlayerId(playerId);
        ea.setHeroId(heroId);
        ea.setAbilityTemplateId(abilityTemplateId);
        equippedAbilityRepository.save(ea);

        return Map.of(
                "message", template.getName() + " added to " + hero.getTemplate().getDisplayName() + "'s abilities!",
                "goldRemaining", player.getGold()
        );
    }

    private static Map<String, Object> buildSummonStatsMap(SummonTemplate st, boolean useGrowth) {
        Map<String, Object> map = new LinkedHashMap<>();
        double mana         = useGrowth ? st.getGrowthMana()             : st.getBaseMana();
        double mp           = useGrowth ? st.getGrowthMp()              : st.getBaseMp();
        double magicProf    = useGrowth ? st.getGrowthMagicProficiency() : st.getBaseMagicProficiency();
        double spellMastery = useGrowth ? st.getGrowthSpellMastery()     : st.getBaseSpellMastery();
        double critChance   = useGrowth ? st.getGrowthCritChance()       : st.getBaseCritChance();
        double critDamage   = useGrowth ? st.getGrowthCritDamage()       : st.getBaseCritDamage();
        double dex          = useGrowth ? st.getGrowthDex()              : st.getBaseDex();
        double dexProf      = useGrowth ? st.getGrowthDexProficiency()   : st.getBaseDexProficiency();
        double dexPosture   = useGrowth ? st.getGrowthDexPosture()       : st.getBaseDexPosture();
        double goldBonus    = useGrowth ? st.getGrowthGoldBonus()        : st.getBaseGoldBonus();
        double itemFind     = useGrowth ? st.getGrowthItemFind()         : st.getBaseItemFind();
        double xpBonus      = useGrowth ? st.getGrowthXpBonus()          : st.getBaseXpBonus();
        if (mana         != 0) map.put("mana",              mana);
        if (mp           != 0) map.put("magicPower",       mp);
        if (magicProf    != 0) map.put("magicProficiency", magicProf);
        if (spellMastery != 0) map.put("spellMastery",     spellMastery);
        if (critChance   != 0) map.put("critChance",       critChance);
        if (critDamage   != 0) map.put("critDamage",       critDamage);
        if (dex          != 0) map.put("dexterity",        dex);
        if (dexProf      != 0) map.put("dexProficiency",   dexProf);
        if (dexPosture   != 0) map.put("dexPosture",       dexPosture);
        double attack            = useGrowth ? st.getGrowthAttack()            : st.getBaseAttack();
        double spellActivation   = useGrowth ? st.getGrowthSpellActivation()   : st.getBaseSpellActivation();
        double stamina           = useGrowth ? st.getGrowthStamina()           : st.getBaseStamina();
        double physicalAttack    = useGrowth ? st.getGrowthPhysicalAttack()    : st.getBasePhysicalAttack();
        double physicalImmunity  = useGrowth ? st.getGrowthPhysicalImmunity()  : st.getBasePhysicalImmunity();
        double magicImmunity     = useGrowth ? st.getGrowthMagicImmunity()     : st.getBaseMagicImmunity();
        double dexEvasiveness    = useGrowth ? st.getGrowthDexEvasiveness()    : st.getBaseDexEvasiveness();
        double manaRecharge      = useGrowth ? st.getGrowthManaRecharge()      : st.getBaseManaRecharge();
        double spellLearn        = useGrowth ? st.getGrowthSpellLearn()        : st.getBaseSpellLearn();
        double spellCopy         = useGrowth ? st.getGrowthSpellCopy()         : st.getBaseSpellCopy();
        double spellAbsorb       = useGrowth ? st.getGrowthSpellAbsorb()       : st.getBaseSpellAbsorb();
        double rot               = useGrowth ? st.getGrowthRot()               : st.getBaseRot();
        if (goldBonus          != 0) map.put("goldBonus",         goldBonus);
        if (itemFind           != 0) map.put("itemFind",          itemFind);
        if (xpBonus            != 0) map.put("xpBonus",           xpBonus);
        if (attack             != 0) map.put("attack",            attack);
        if (spellActivation    != 0) map.put("spellActivation",   spellActivation);
        if (stamina            != 0) map.put("stamina",           stamina);
        if (physicalAttack     != 0) map.put("physicalAttack",    physicalAttack);
        if (physicalImmunity   != 0) map.put("physicalImmunity",  physicalImmunity);
        if (magicImmunity      != 0) map.put("magicImmunity",     magicImmunity);
        if (dexEvasiveness     != 0) map.put("dexEvasiveness",    dexEvasiveness);
        if (manaRecharge       != 0) map.put("manaRecharge",      manaRecharge);
        if (spellLearn         != 0) map.put("spellLearn",        spellLearn);
        if (spellCopy          != 0) map.put("spellCopy",         spellCopy);
        if (spellAbsorb        != 0) map.put("spellAbsorb",       spellAbsorb);
        if (rot                != 0) map.put("rot",               rot);
        return map;
    }

    public static class ShopException extends RuntimeException {
        private final String errorCode;

        public ShopException(String errorCode, String message) {
            super(message);
            this.errorCode = errorCode;
        }

        public String getErrorCode() {
            return errorCode;
        }
    }
}
