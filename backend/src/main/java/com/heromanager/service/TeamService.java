package com.heromanager.service;

import com.heromanager.dto.TeamResponse;
import com.heromanager.entity.*;
import com.heromanager.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
public class TeamService {

    private final PlayerRepository playerRepository;
    private final HeroRepository heroRepository;
    private final SummonRepository summonRepository;
    private final TeamSlotRepository teamSlotRepository;
    private final EquippedItemRepository equippedItemRepository;
    private final EquippedAbilityRepository equippedAbilityRepository;

    public TeamService(PlayerRepository playerRepository,
                       HeroRepository heroRepository,
                       SummonRepository summonRepository,
                       TeamSlotRepository teamSlotRepository,
                       EquippedItemRepository equippedItemRepository,
                       EquippedAbilityRepository equippedAbilityRepository) {
        this.playerRepository = playerRepository;
        this.heroRepository = heroRepository;
        this.summonRepository = summonRepository;
        this.teamSlotRepository = teamSlotRepository;
        this.equippedItemRepository = equippedItemRepository;
        this.equippedAbilityRepository = equippedAbilityRepository;
    }

    public TeamResponse getTeamLineup(Long playerId) {
        List<TeamSlot> teamSlots = teamSlotRepository.findByPlayerId(playerId);

        int usedCapacity = 0;
        List<Map<String, Object>> slots = new ArrayList<>();
        double teamPower = 0.0;

        // Find equipped summon for MP bonus calculation
        Summon equippedSummon = null;
        for (TeamSlot slot : teamSlots) {
            if (slot.getSlotNumber() == 7 && slot.getSummonId() != null) {
                equippedSummon = summonRepository.findById(slot.getSummonId()).orElse(null);
            }
        }

        double summonMpBonus = 0.0;
        if (equippedSummon != null) {
            SummonTemplate st = equippedSummon.getTemplate();
            summonMpBonus = st.getBaseMp() + st.getGrowthMp() * (equippedSummon.getLevel() - 1);
        }

        // Build slots 1-6 (heroes)
        for (int i = 1; i <= 6; i++) {
            Map<String, Object> slotData = new LinkedHashMap<>();
            slotData.put("slotNumber", i);
            slotData.put("type", "hero");

            TeamSlot slot = findSlot(teamSlots, i);
            if (slot != null && slot.getHeroId() != null) {
                Hero hero = heroRepository.findById(slot.getHeroId()).orElse(null);
                if (hero != null) {
                    HeroTemplate t = hero.getTemplate();
                    int level = hero.getLevel();
                    usedCapacity += t.getCapacity();

                    // Compute total stats (base + growth + item bonuses + ability bonuses)
                    Map<String, Double> totalStats = new LinkedHashMap<>();
                    totalStats.put("pa", t.getBasePa() + t.getGrowthPa() * (level - 1));
                    totalStats.put("mp", t.getBaseMp() + t.getGrowthMp() * (level - 1));
                    totalStats.put("dex", t.getBaseDex() + t.getGrowthDex() * (level - 1));
                    totalStats.put("elem", t.getBaseElem() + t.getGrowthElem() * (level - 1));
                    totalStats.put("mana", t.getBaseMana() + t.getGrowthMana() * (level - 1));
                    totalStats.put("stam", t.getBaseStam() + t.getGrowthStam() * (level - 1));

                    // Add item bonuses
                    List<EquippedItem> items = equippedItemRepository.findByHeroId(hero.getId());
                    for (EquippedItem ei : items) {
                        ItemTemplate it = ei.getItemTemplate();
                        totalStats.merge("pa", it.getBonusPa(), Double::sum);
                        totalStats.merge("mp", it.getBonusMp(), Double::sum);
                        totalStats.merge("dex", it.getBonusDex(), Double::sum);
                        totalStats.merge("elem", it.getBonusElem(), Double::sum);
                        totalStats.merge("mana", it.getBonusMana(), Double::sum);
                        totalStats.merge("stam", it.getBonusStam(), Double::sum);
                    }

                    // Add ability bonuses
                    List<EquippedAbility> abilities = equippedAbilityRepository.findByHeroId(hero.getId());
                    for (EquippedAbility ea : abilities) {
                        AbilityTemplate at = ea.getAbilityTemplate();
                        totalStats.merge("pa", at.getBonusPa(), Double::sum);
                        totalStats.merge("mp", at.getBonusMp(), Double::sum);
                        totalStats.merge("dex", at.getBonusDex(), Double::sum);
                        totalStats.merge("elem", at.getBonusElem(), Double::sum);
                        totalStats.merge("mana", at.getBonusMana(), Double::sum);
                        totalStats.merge("stam", at.getBonusStam(), Double::sum);
                    }

                    // Add summon MP bonus to each equipped hero
                    totalStats.merge("mp", summonMpBonus, Double::sum);

                    // Sum all stats for team power
                    for (Double val : totalStats.values()) {
                        teamPower += val;
                    }

                    slotData.put("heroId", hero.getId());
                    slotData.put("templateId", hero.getTemplateId());
                    slotData.put("name", t.getDisplayName());
                    slotData.put("imagePath", t.getImagePath());
                    slotData.put("level", level);
                    slotData.put("capacity", t.getCapacity());
                    slotData.put("totalStats", totalStats);
                    slotData.put("empty", false);
                } else {
                    slotData.put("empty", true);
                }
            } else {
                slotData.put("empty", true);
            }

            slots.add(slotData);
        }

        // Build slot 7 (summon)
        Map<String, Object> summonSlotData = new LinkedHashMap<>();
        summonSlotData.put("slotNumber", 7);
        summonSlotData.put("type", "summon");
        if (equippedSummon != null) {
            SummonTemplate st = equippedSummon.getTemplate();
            usedCapacity += st.getCapacity();

            Map<String, Double> summonStats = new LinkedHashMap<>();
            summonStats.put("mana", st.getBaseMana() + st.getGrowthMana() * (equippedSummon.getLevel() - 1));
            summonStats.put("mp", st.getBaseMp() + st.getGrowthMp() * (equippedSummon.getLevel() - 1));

            summonSlotData.put("summonId", equippedSummon.getId());
            summonSlotData.put("templateId", equippedSummon.getTemplateId());
            summonSlotData.put("name", st.getDisplayName());
            summonSlotData.put("imagePath", st.getImagePath());
            summonSlotData.put("level", equippedSummon.getLevel());
            summonSlotData.put("capacity", st.getCapacity());
            summonSlotData.put("stats", summonStats);
            summonSlotData.put("empty", false);
        } else {
            summonSlotData.put("empty", true);
        }
        slots.add(summonSlotData);

        Map<String, Integer> capacity = new LinkedHashMap<>();
        capacity.put("used", usedCapacity);
        capacity.put("max", 100);

        return TeamResponse.builder()
                .capacity(capacity)
                .teamPower(teamPower)
                .slots(slots)
                .build();
    }

    @Transactional
    public Map<String, Object> equipHero(Long playerId, Long heroId, Integer slotNumber) {
        if (slotNumber < 1 || slotNumber > 6) {
            return Map.of("error", "INVALID_SLOT", "message", "Hero slot must be between 1 and 6.");
        }

        Hero hero = heroRepository.findById(heroId)
                .orElseThrow(() -> new RuntimeException("Hero not found"));
        if (!hero.getPlayerId().equals(playerId)) {
            return Map.of("error", "NOT_YOUR_HERO", "message", "Hero does not belong to you.");
        }

        Optional<TeamSlot> existingSlot = teamSlotRepository.findByPlayerIdAndHeroId(playerId, heroId);
        if (existingSlot.isPresent()) {
            return Map.of("error", "HERO_ALREADY_EQUIPPED", "message", "This hero is already in your team lineup.");
        }

        Optional<TeamSlot> targetSlot = teamSlotRepository.findByPlayerIdAndSlotNumber(playerId, slotNumber);
        if (targetSlot.isPresent() && targetSlot.get().getHeroId() != null) {
            return Map.of("error", "SLOT_OCCUPIED", "message", "Slot " + slotNumber + " already has a hero. Unequip first.");
        }

        int currentCapacity = calculateUsedCapacity(playerId);
        int heroCapacity = hero.getTemplate().getCapacity();
        if (currentCapacity + heroCapacity > 100) {
            int available = 100 - currentCapacity;
            return Map.of("error", "CAPACITY_EXCEEDED", "message", "Not enough team capacity. Hero requires " + heroCapacity + " but only " + available + " available.");
        }

        TeamSlot slot = targetSlot.orElse(TeamSlot.builder()
                .playerId(playerId)
                .slotNumber(slotNumber)
                .build());
        slot.setHeroId(heroId);
        teamSlotRepository.save(slot);

        int newCapacity = currentCapacity + heroCapacity;
        return Map.of("message", "Hero equipped successfully.", "capacity", Map.of("used", newCapacity, "max", 100));
    }

    @Transactional
    public Map<String, Object> unequipHero(Long playerId, Integer slotNumber) {
        if (slotNumber < 1 || slotNumber > 6) {
            return Map.of("error", "INVALID_SLOT", "message", "Hero slot must be between 1 and 6.");
        }

        Optional<TeamSlot> opt = teamSlotRepository.findByPlayerIdAndSlotNumber(playerId, slotNumber);
        if (opt.isEmpty() || opt.get().getHeroId() == null) {
            return Map.of("error", "SLOT_EMPTY", "message", "No hero in slot " + slotNumber + " to unequip.");
        }

        TeamSlot slot = opt.get();
        slot.setHeroId(null);
        teamSlotRepository.save(slot);

        int newCapacity = calculateUsedCapacity(playerId);
        return Map.of("message", "Hero unequipped.", "capacity", Map.of("used", newCapacity, "max", 100));
    }

    @Transactional
    public Map<String, Object> equipSummon(Long playerId, Long summonId) {
        Summon summon = summonRepository.findById(summonId)
                .orElseThrow(() -> new RuntimeException("Summon not found"));
        if (!summon.getPlayerId().equals(playerId)) {
            return Map.of("error", "NOT_YOUR_SUMMON", "message", "Summon does not belong to you.");
        }

        int currentCapacity = calculateUsedCapacity(playerId);
        int summonCapacity = summon.getTemplate().getCapacity();

        Optional<TeamSlot> existingSlot7 = teamSlotRepository.findByPlayerIdAndSlotNumber(playerId, 7);
        if (existingSlot7.isPresent() && existingSlot7.get().getSummonId() != null) {
            Summon oldSummon = summonRepository.findById(existingSlot7.get().getSummonId()).orElse(null);
            if (oldSummon != null) {
                currentCapacity -= oldSummon.getTemplate().getCapacity();
            }
        }

        if (currentCapacity + summonCapacity > 100) {
            return Map.of("error", "CAPACITY_EXCEEDED", "message", "Not enough team capacity.");
        }

        TeamSlot slot = existingSlot7.orElse(TeamSlot.builder()
                .playerId(playerId)
                .slotNumber(7)
                .build());
        slot.setSummonId(summonId);
        teamSlotRepository.save(slot);

        int newCapacity = currentCapacity + summonCapacity;
        return Map.of("message", "Summon equipped successfully.", "capacity", Map.of("used", newCapacity, "max", 100));
    }

    @Transactional
    public Map<String, Object> unequipSummon(Long playerId) {
        Optional<TeamSlot> opt = teamSlotRepository.findByPlayerIdAndSlotNumber(playerId, 7);
        if (opt.isEmpty() || opt.get().getSummonId() == null) {
            return Map.of("error", "NO_SUMMON", "message", "No summon equipped.");
        }

        TeamSlot slot = opt.get();
        slot.setSummonId(null);
        teamSlotRepository.save(slot);

        int newCapacity = calculateUsedCapacity(playerId);
        return Map.of("message", "Summon unequipped.", "capacity", Map.of("used", newCapacity, "max", 100));
    }

    @Transactional
    public Map<String, Object> reorderTeam(Long playerId, List<Long> heroIds) {
        if (heroIds.size() > 6) {
            return Map.of("error", "TOO_MANY", "message", "Maximum 6 heroes in team.");
        }

        List<TeamSlot> currentSlots = teamSlotRepository.findByPlayerId(playerId);
        for (TeamSlot slot : currentSlots) {
            if (slot.getSlotNumber() >= 1 && slot.getSlotNumber() <= 6) {
                slot.setHeroId(null);
                teamSlotRepository.save(slot);
            }
        }

        for (int i = 0; i < heroIds.size(); i++) {
            Long heroId = heroIds.get(i);
            if (heroId == null) continue;

            Hero hero = heroRepository.findById(heroId)
                    .orElseThrow(() -> new RuntimeException("Hero not found"));
            if (!hero.getPlayerId().equals(playerId)) {
                return Map.of("error", "NOT_YOUR_HERO", "message", "Hero does not belong to you.");
            }

            int slotNumber = i + 1;
            Optional<TeamSlot> existingSlot = teamSlotRepository.findByPlayerIdAndSlotNumber(playerId, slotNumber);
            TeamSlot slot = existingSlot.orElse(TeamSlot.builder()
                    .playerId(playerId)
                    .slotNumber(slotNumber)
                    .build());
            slot.setHeroId(heroId);
            teamSlotRepository.save(slot);
        }

        return Map.of("message", "Team order updated.");
    }

    private int calculateUsedCapacity(Long playerId) {
        List<TeamSlot> slots = teamSlotRepository.findByPlayerId(playerId);
        int capacity = 0;
        for (TeamSlot slot : slots) {
            if (slot.getHeroId() != null) {
                Hero hero = heroRepository.findById(slot.getHeroId()).orElse(null);
                if (hero != null) {
                    capacity += hero.getTemplate().getCapacity();
                }
            }
            if (slot.getSummonId() != null) {
                Summon summon = summonRepository.findById(slot.getSummonId()).orElse(null);
                if (summon != null) {
                    capacity += summon.getTemplate().getCapacity();
                }
            }
        }
        return capacity;
    }

    private TeamSlot findSlot(List<TeamSlot> slots, int slotNumber) {
        for (TeamSlot slot : slots) {
            if (slot.getSlotNumber() == slotNumber) {
                return slot;
            }
        }
        return null;
    }
}
