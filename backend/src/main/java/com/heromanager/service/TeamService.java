package com.heromanager.service;

import com.heromanager.dto.TeamResponse;
import com.heromanager.dto.TeamSetupResponse;
import com.heromanager.entity.*;
import com.heromanager.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
public class TeamService {

    private final TeamSlotRepository teamSlotRepository;
    private final HeroRepository heroRepository;
    private final SummonRepository summonRepository;
    private final EquippedItemRepository equippedItemRepository;
    private final EquippedAbilityRepository equippedAbilityRepository;
    private final TeamSetupRepository teamSetupRepository;
    private final TeamSetupSlotRepository teamSetupSlotRepository;
    private final TeamSetupHeroEquipmentRepository heroEquipmentRepository;
    private final PlayerService playerService;
    private final PlayerRepository playerRepository;

    public TeamService(TeamSlotRepository teamSlotRepository,
                       HeroRepository heroRepository,
                       SummonRepository summonRepository,
                       EquippedItemRepository equippedItemRepository,
                       EquippedAbilityRepository equippedAbilityRepository,
                       TeamSetupRepository teamSetupRepository,
                       TeamSetupSlotRepository teamSetupSlotRepository,
                       TeamSetupHeroEquipmentRepository heroEquipmentRepository,
                       PlayerService playerService,
                       PlayerRepository playerRepository) {
        this.teamSlotRepository = teamSlotRepository;
        this.heroRepository = heroRepository;
        this.summonRepository = summonRepository;
        this.equippedItemRepository = equippedItemRepository;
        this.equippedAbilityRepository = equippedAbilityRepository;
        this.teamSetupRepository = teamSetupRepository;
        this.teamSetupSlotRepository = teamSetupSlotRepository;
        this.heroEquipmentRepository = heroEquipmentRepository;
        this.playerService = playerService;
        this.playerRepository = playerRepository;
    }

    private int getMaxSetups(Long playerId) {
        return playerRepository.findById(playerId)
                .map(p -> 2 + (p.isExtraLineupGoldPurchased() ? 1 : 0) + (p.isExtraLineupDiamondsPurchased() ? 1 : 0))
                .orElse(2);
    }

    private int getTeamCapacityMax(Long playerId) {
        return playerRepository.findById(playerId)
                .map(p -> 100 + p.getCapacityPlusCount() * 10)
                .orElse(100);
    }

    @Transactional(readOnly = true)
    public TeamResponse getTeamLineup(Long playerId) {
        List<TeamSlot> slots = teamSlotRepository.findByPlayerId(playerId);

        // Find equipped summon bonuses
        Map<String, Double> summonBonuses = new LinkedHashMap<>();
        Summon equippedSummon = null;
        for (TeamSlot slot : slots) {
            if (slot.getSummonId() != null) {
                equippedSummon = summonRepository.findById(slot.getSummonId()).orElse(null);
                if (equippedSummon != null && equippedSummon.getTemplate() != null) {
                    summonBonuses = PlayerService.buildSummonStats(equippedSummon.getTemplate(), equippedSummon.getLevel());
                }
            }
        }

        List<TeamResponse.SlotInfo> slotInfos = new ArrayList<>();
        int capacityUsed = 0;
        double teamPower = 0;

        // Build hero slots 1-6
        for (int i = 1; i <= 6; i++) {
            final int slotNum = i;
            TeamSlot slot = slots.stream()
                    .filter(s -> s.getSlotNumber() == slotNum)
                    .findFirst().orElse(null);

            TeamResponse.HeroSlotInfo heroInfo = null;
            if (slot != null && slot.getHeroId() != null) {
                Hero hero = heroRepository.findById(slot.getHeroId()).orElse(null);
                if (hero != null && hero.getTemplate() != null) {
                    HeroTemplate t = hero.getTemplate();
                    Map<String, Double> totalStats = new HashMap<>(PlayerService.buildHeroStats(t, hero.getLevel()));
                    playerService.buildEquipmentBonuses(hero.getId())
                            .forEach((k, v) -> totalStats.merge(k, v, Double::sum));

                    // Add additive summon bonuses to hero display stats
                    for (String key : new String[]{"magicPower", "mana", "dexterity", "physicalAttack", "stamina", "attack"}) {
                        if (summonBonuses.containsKey(key) && summonBonuses.get(key) != 0) {
                            totalStats.merge(key, summonBonuses.get(key), Double::sum);
                        }
                    }

                    double statSum = totalStats.values().stream().mapToDouble(Double::doubleValue).sum();
                    teamPower += statSum;
                    int heroCap = hero.getCapacityOverride() != null ? hero.getCapacityOverride() : t.getCapacity();
                    capacityUsed += heroCap;

                    // Build combined 3 equipment slots for display
                    List<Map<String, Object>> eqSlots = new ArrayList<>();
                    for (int s = 1; s <= 3; s++) {
                        final Integer sn = s;
                        Optional<EquippedItem> eItem = equippedItemRepository.findByHeroIdAndSlotNumber(hero.getId(), sn);
                        if (eItem.isPresent()) {
                            ItemTemplate it = eItem.get().getItemTemplate();
                            if (it == null) {
                                Map<String, Object> empty = new LinkedHashMap<>();
                                empty.put("slotNumber", s); empty.put("type", null); empty.put("name", null);
                                eqSlots.add(empty); continue;
                            }
                            Map<String, Object> slotEntry = new LinkedHashMap<>();
                            slotEntry.put("slotNumber", s);
                            slotEntry.put("type", "item");
                            slotEntry.put("name", it.getName());
                            slotEntry.put("bonuses", buildBonuses(it.getBonusPa(), it.getBonusMp(), it.getBonusDex(), it.getBonusElem(), it.getBonusMana(), it.getBonusStam()));
                            slotEntry.put("tier", null);
                            slotEntry.put("cost", it.getCost());
                            slotEntry.put("copies", equippedItemRepository.countByPlayerAndItemTemplate(playerId, it.getId()));
                            eqSlots.add(slotEntry);
                            continue;
                        }
                        Optional<EquippedAbility> eAbility = equippedAbilityRepository.findByHeroIdAndSlotNumber(hero.getId(), sn);
                        if (eAbility.isPresent()) {
                            AbilityTemplate at = eAbility.get().getAbilityTemplate();
                            if (at == null) {
                                Map<String, Object> empty = new LinkedHashMap<>();
                                empty.put("slotNumber", s); empty.put("type", null); empty.put("name", null);
                                eqSlots.add(empty); continue;
                            }
                            Map<String, Object> slotEntry = new LinkedHashMap<>();
                            slotEntry.put("slotNumber", s);
                            slotEntry.put("type", "ability");
                            slotEntry.put("name", at.getName());
                            slotEntry.put("bonuses", buildBonuses(at.getBonusPa(), at.getBonusMp(), at.getBonusDex(), at.getBonusElem(), at.getBonusMana(), at.getBonusStam()));
                            slotEntry.put("tier", at.getTier());
                            slotEntry.put("copies", equippedAbilityRepository.countByPlayerAndAbilityTemplate(playerId, at.getId()));
                            eqSlots.add(slotEntry);
                            continue;
                        }
                        Map<String, Object> emptySlot = new LinkedHashMap<>();
                        emptySlot.put("slotNumber", s);
                        emptySlot.put("type", null);
                        emptySlot.put("name", null);
                        eqSlots.add(emptySlot);
                    }

                    heroInfo = TeamResponse.HeroSlotInfo.builder()
                            .id(hero.getId())
                            .name(t.getDisplayName())
                            .imagePath(t.getImagePath())
                            .level(hero.getLevel())
                            .capacity(hero.getCapacityOverride() != null ? hero.getCapacityOverride() : t.getCapacity())
                            .totalStats(totalStats)
                            .currentXp(hero.getCurrentXp())
                            .xpToNextLevel(hero.getLevel() * hero.getLevel() * 10)
                            .tier(t.getTier() != null ? t.getTier().name() : null)
                            .element(hero.getElementOverride() != null ? hero.getElementOverride() : (t.getElement() != null ? t.getElement().name() : null))
                            .equippedSlots(eqSlots)
                            .build();
                }
            }

            slotInfos.add(TeamResponse.SlotInfo.builder()
                    .slotNumber(slotNum)
                    .type("hero")
                    .slotTier(getSlotTier(slotNum))
                    .hero(heroInfo)
                    .summon(null)
                    .build());
        }

        // Build slot 7 (summon slot)
        TeamResponse.SummonSlotInfo summonInfo = null;
        if (equippedSummon != null && equippedSummon.getTemplate() != null) {
            SummonTemplate st = equippedSummon.getTemplate();
            capacityUsed += st.getCapacity();
            Map<String, Double> summonStats = new LinkedHashMap<>(summonBonuses);

            summonInfo = TeamResponse.SummonSlotInfo.builder()
                    .id(equippedSummon.getId())
                    .name(st.getDisplayName())
                    .imagePath(st.getImagePath())
                    .level(equippedSummon.getLevel())
                    .capacity(st.getCapacity())
                    .teamBonus(PlayerService.buildSummonTeamBonusString(summonStats))
                    .stats(summonStats)
                    .currentXp(equippedSummon.getCurrentXp())
                    .xpToNextLevel(equippedSummon.getLevel() * equippedSummon.getLevel() * 10)
                    .build();
        }
        slotInfos.add(TeamResponse.SlotInfo.builder()
                .slotNumber(7)
                .type("summon")
                .hero(null)
                .summon(summonInfo)
                .build());

        return TeamResponse.builder()
                .capacity(TeamResponse.CapacityInfo.builder().used(capacityUsed).max(getTeamCapacityMax(playerId)).build())
                .teamPower(teamPower)
                .slots(slotInfos)
                .build();
    }

    @Transactional
    public TeamResponse.CapacityInfo equipHero(Long playerId, Long heroId, int slotNumber) {
        if (slotNumber < 1 || slotNumber > 6) {
            throw new TeamException("INVALID_SLOT", "Hero slot must be between 1 and 6.");
        }

        Hero hero = heroRepository.findByIdAndPlayerId(heroId, playerId)
                .orElseThrow(() -> new TeamException("HERO_NOT_FOUND", "Hero not found in your roster."));

        // Check not already equipped
        teamSlotRepository.findByPlayerIdAndHeroId(playerId, heroId).ifPresent(s -> {
            throw new TeamException("HERO_ALREADY_EQUIPPED", "This hero is already in your team lineup.");
        });

        // Check slot empty
        teamSlotRepository.findByPlayerIdAndSlotNumber(playerId, slotNumber).ifPresent(s -> {
            if (s.getHeroId() != null) {
                throw new TeamException("SLOT_OCCUPIED",
                        "Slot " + slotNumber + " already has a hero. Unequip first.");
            }
        });

        // Check capacity
        int currentCapacity = calculateCapacity(playerId);
        HeroTemplate ht = hero.getTemplate();
        int heroCapacity = hero.getCapacityOverride() != null ? hero.getCapacityOverride() : ht.getCapacity();
        if (currentCapacity + heroCapacity > 100) {
            throw new TeamException("CAPACITY_EXCEEDED",
                    "Not enough team capacity. Hero requires " + heroCapacity
                            + " but only " + (100 - currentCapacity) + " available.");
        }

        // Create or update slot
        TeamSlot slot = teamSlotRepository.findByPlayerIdAndSlotNumber(playerId, slotNumber)
                .orElseGet(() -> {
                    TeamSlot newSlot = new TeamSlot();
                    newSlot.setPlayerId(playerId);
                    newSlot.setSlotNumber(slotNumber);
                    return newSlot;
                });
        slot.setHeroId(heroId);
        teamSlotRepository.save(slot);

        int newCapacity = currentCapacity + heroCapacity;
        return TeamResponse.CapacityInfo.builder().used(newCapacity).max(getTeamCapacityMax(playerId)).build();
    }

    @Transactional
    public TeamResponse.CapacityInfo unequipHero(Long playerId, int slotNumber) {
        TeamSlot slot = teamSlotRepository.findByPlayerIdAndSlotNumber(playerId, slotNumber)
                .orElseThrow(() -> new TeamException("SLOT_EMPTY",
                        "No hero in slot " + slotNumber + " to unequip."));

        if (slot.getHeroId() == null) {
            throw new TeamException("SLOT_EMPTY",
                    "No hero in slot " + slotNumber + " to unequip.");
        }

        slot.setHeroId(null);
        teamSlotRepository.save(slot);

        int newCapacity = calculateCapacity(playerId);
        return TeamResponse.CapacityInfo.builder().used(newCapacity).max(getTeamCapacityMax(playerId)).build();
    }

    @Transactional
    public TeamResponse.CapacityInfo equipSummon(Long playerId, Long summonId) {
        Summon summon = summonRepository.findByIdAndPlayerId(summonId, playerId)
                .orElseThrow(() -> new TeamException("SUMMON_NOT_FOUND", "Summon not found in your roster."));

        // Check summon not already equipped
        teamSlotRepository.findByPlayerIdAndSummonId(playerId, summonId).ifPresent(s -> {
            throw new TeamException("SUMMON_ALREADY_EQUIPPED", "This summon is already in your team.");
        });

        // Check slot 7
        Optional<TeamSlot> existing = teamSlotRepository.findByPlayerIdAndSlotNumber(playerId, 7);
        if (existing.isPresent() && existing.get().getSummonId() != null) {
            throw new TeamException("SLOT_OCCUPIED", "Summon slot already occupied. Unequip first.");
        }

        // Check capacity
        int currentCapacity = calculateCapacity(playerId);
        int summonCapacity = summon.getTemplate().getCapacity();
        if (currentCapacity + summonCapacity > 100) {
            throw new TeamException("CAPACITY_EXCEEDED",
                    "Not enough team capacity. Summon requires " + summonCapacity
                            + " but only " + (100 - currentCapacity) + " available.");
        }

        TeamSlot slot = existing.orElseGet(() -> {
            TeamSlot newSlot = new TeamSlot();
            newSlot.setPlayerId(playerId);
            newSlot.setSlotNumber(7);
            return newSlot;
        });
        slot.setSummonId(summonId);
        teamSlotRepository.save(slot);

        int newCapacity = currentCapacity + summonCapacity;
        return TeamResponse.CapacityInfo.builder().used(newCapacity).max(getTeamCapacityMax(playerId)).build();
    }

    @Transactional
    public TeamResponse.CapacityInfo unequipSummon(Long playerId) {
        TeamSlot slot = teamSlotRepository.findByPlayerIdAndSlotNumber(playerId, 7)
                .orElseThrow(() -> new TeamException("SLOT_EMPTY", "No summon to unequip."));

        if (slot.getSummonId() == null) {
            throw new TeamException("SLOT_EMPTY", "No summon to unequip.");
        }

        slot.setSummonId(null);
        teamSlotRepository.save(slot);

        int newCapacity = calculateCapacity(playerId);
        return TeamResponse.CapacityInfo.builder().used(newCapacity).max(getTeamCapacityMax(playerId)).build();
    }

    @Transactional
    public void reorderTeam(Long playerId, List<Long> order) {
        // order is array of heroIds for slots 1-6, null for empty
        List<TeamSlot> existingSlots = teamSlotRepository.findByPlayerId(playerId);

        for (int i = 0; i < 6; i++) {
            int slotNum = i + 1;
            Long heroId = (i < order.size()) ? order.get(i) : null;

            TeamSlot slot = existingSlots.stream()
                    .filter(s -> s.getSlotNumber() == slotNum)
                    .findFirst().orElse(null);

            if (heroId != null) {
                if (slot == null) {
                    slot = new TeamSlot();
                    slot.setPlayerId(playerId);
                    slot.setSlotNumber(slotNum);
                }
                slot.setHeroId(heroId);
                teamSlotRepository.save(slot);
            } else if (slot != null) {
                slot.setHeroId(null);
                teamSlotRepository.save(slot);
            }
        }
    }

    private int calculateCapacity(Long playerId) {
        List<TeamSlot> slots = teamSlotRepository.findByPlayerId(playerId);
        int total = 0;
        for (TeamSlot slot : slots) {
            if (slot.getHeroId() != null) {
                Hero hero = heroRepository.findById(slot.getHeroId()).orElse(null);
                if (hero != null && hero.getTemplate() != null) {
                    int cap = hero.getCapacityOverride() != null ? hero.getCapacityOverride() : hero.getTemplate().getCapacity();
                    total += cap;
                }
            }
            if (slot.getSummonId() != null) {
                Summon summon = summonRepository.findById(slot.getSummonId()).orElse(null);
                if (summon != null) {
                    total += summon.getTemplate().getCapacity();
                }
            }
        }
        return total;
    }

    private Map<String, Object> buildBonuses(double pa, double mp, double dex, double elem, double mana, double stam) {
        Map<String, Object> bonuses = new LinkedHashMap<>();
        if (pa   != 0) bonuses.put("physicalAttack", pa);
        if (mp   != 0) bonuses.put("magicPower",     mp);
        if (dex  != 0) bonuses.put("dexterity",      dex);
        if (elem != 0) bonuses.put("element",         elem);
        if (mana != 0) bonuses.put("mana",            mana);
        if (stam != 0) bonuses.put("stamina",         stam);
        return bonuses;
    }

    public static String getSlotTier(int slotNumber) {
        if (slotNumber <= 3) return "COMMONER";
        if (slotNumber <= 5) return "ELITE";
        return "LEGENDARY";
    }

    @Transactional
    public List<TeamSetupResponse> getSetups(Long playerId) {
        List<TeamSetup> existing = teamSetupRepository.findByPlayerIdOrderBySetupIndex(playerId);
        int maxSetups = getMaxSetups(playerId);

        if (existing.isEmpty()) {
            // Lazy-init: snapshot current TeamSlot into Setup 1 (active), create empty Setup 2
            TeamSetup setup1 = new TeamSetup();
            setup1.setPlayerId(playerId);
            setup1.setSetupIndex(1);
            setup1.setName("Team Setup 1");
            setup1.setActive(true);
            setup1 = teamSetupRepository.save(setup1);
            snapshotCurrentTeamIntoSetup(playerId, setup1.getId());

            TeamSetup setup2 = new TeamSetup();
            setup2.setPlayerId(playerId);
            setup2.setSetupIndex(2);
            setup2.setName("Team Setup 2");
            setup2.setActive(false);
            teamSetupRepository.save(setup2);

            existing = teamSetupRepository.findByPlayerIdOrderBySetupIndex(playerId);
        }

        // Lazy-create any newly unlocked setup slots
        int currentMax = existing.stream().mapToInt(TeamSetup::getSetupIndex).max().orElse(0);
        for (int idx = currentMax + 1; idx <= maxSetups; idx++) {
            TeamSetup newSetup = new TeamSetup();
            newSetup.setPlayerId(playerId);
            newSetup.setSetupIndex(idx);
            newSetup.setName("Team Setup " + idx);
            newSetup.setActive(false);
            teamSetupRepository.save(newSetup);
        }
        if (currentMax < maxSetups) {
            existing = teamSetupRepository.findByPlayerIdOrderBySetupIndex(playerId);
        }

        return existing.stream()
                .map(s -> TeamSetupResponse.builder()
                        .id(s.getId())
                        .setupIndex(s.getSetupIndex())
                        .name(s.getName())
                        .active(s.isActive())
                        .build())
                .toList();
    }

    @Transactional
    public TeamResponse switchSetup(Long playerId, int targetIndex) {
        TeamSetup current = teamSetupRepository.findByPlayerIdAndActiveTrue(playerId).orElse(null);
        if (current != null && current.getSetupIndex() == targetIndex) {
            return getTeamLineup(playerId);
        }

        // 1. Snapshot current team into the departing setup
        if (current != null) {
            snapshotCurrentTeamIntoSetup(playerId, current.getId());
            current.setActive(false);
            teamSetupRepository.save(current);
        }

        // 2. Clear equipment for ALL player heroes (lineup + bench).
        //    Presets own the full equipment state of every hero, so every switch
        //    does a complete reset before restoring the target preset's snapshot.
        for (Hero hero : heroRepository.findByPlayerId(playerId)) {
            Long heroId = hero.getId();
            equippedItemRepository.findByHeroIdAndSlotNumberIsNotNull(heroId).forEach(item -> {
                item.setHeroId(null);
                item.setSlotNumber(null);
                equippedItemRepository.save(item);
            });
            equippedAbilityRepository.findByHeroId(heroId)
                    .stream().filter(a -> a.getSlotNumber() != null)
                    .forEach(a -> {
                        a.setSlotNumber(null);
                        equippedAbilityRepository.save(a);
                    });
        }

        // 3. Clear TeamSlots
        List<TeamSlot> currentSlots = teamSlotRepository.findByPlayerId(playerId);
        for (TeamSlot slot : currentSlots) {
            slot.setHeroId(null);
            slot.setSummonId(null);
            teamSlotRepository.save(slot);
        }

        // 4. Load target setup
        TeamSetup target = teamSetupRepository.findByPlayerIdAndSetupIndex(playerId, targetIndex)
                .orElseThrow(() -> new TeamException("SETUP_NOT_FOUND", "Team setup not found."));
        List<TeamSetupSlot> setupSlots = teamSetupSlotRepository.findBySetupId(target.getId());
        List<TeamSetupHeroEquipment> targetEquipment = heroEquipmentRepository.findBySetupId(target.getId());

        // 4a. Restore lineup slots
        for (TeamSetupSlot ss : setupSlots) {
            TeamSlot slot = currentSlots.stream()
                    .filter(s -> s.getSlotNumber() == ss.getSlotNumber())
                    .findFirst()
                    .orElseGet(() -> {
                        TeamSlot newSlot = new TeamSlot();
                        newSlot.setPlayerId(playerId);
                        newSlot.setSlotNumber(ss.getSlotNumber());
                        return newSlot;
                    });
            slot.setHeroId(ss.getHeroId());
            slot.setSummonId(ss.getSummonId());
            teamSlotRepository.save(slot);
        }

        // 4b. Restore equipment for ALL heroes in the snapshot (lineup + bench).
        //     Step 2 set all items to heroId=null and all ability slotNumbers to null,
        //     so the finders below will locate them correctly.
        for (TeamSetupHeroEquipment eq : targetEquipment) {
            Long heroId = eq.getHeroId();
            if (eq.getItemTemplateId() != null) {
                equippedItemRepository
                        .findFirstByPlayerIdAndHeroIdIsNullAndItemTemplateId(playerId, eq.getItemTemplateId())
                        .ifPresent(item -> {
                            item.setHeroId(heroId);
                            item.setSlotNumber(eq.getSlotNumber());
                            equippedItemRepository.save(item);
                        });
            } else if (eq.getAbilityTemplateId() != null) {
                equippedAbilityRepository
                        .findFirstByHeroIdAndAbilityTemplateIdAndSlotNumberIsNull(heroId, eq.getAbilityTemplateId())
                        .ifPresent(ability -> {
                            ability.setSlotNumber(eq.getSlotNumber());
                            equippedAbilityRepository.save(ability);
                        });
            }
        }

        target.setActive(true);
        teamSetupRepository.save(target);

        return getTeamLineup(playerId);
    }

    @Transactional
    public void renameSetup(Long playerId, int setupIndex, String name) {
        if (name == null || name.isBlank() || name.length() > 30) {
            throw new TeamException("INVALID_NAME", "Setup name must be 1–30 characters.");
        }
        TeamSetup setup = teamSetupRepository.findByPlayerIdAndSetupIndex(playerId, setupIndex)
                .orElseThrow(() -> new TeamException("SETUP_NOT_FOUND", "Team setup not found."));
        setup.setName(name.trim());
        teamSetupRepository.save(setup);
    }

    private void snapshotCurrentTeamIntoSetup(Long playerId, Long setupId) {
        // Use entity-level deletes so JPA L1 cache marks entities as REMOVED,
        // preventing phantom re-inserts on flush.
        List<TeamSetupHeroEquipment> oldEquipment = heroEquipmentRepository.findBySetupId(setupId);
        heroEquipmentRepository.deleteAll(oldEquipment);
        List<TeamSetupSlot> oldSlots = teamSetupSlotRepository.findBySetupId(setupId);
        teamSetupSlotRepository.deleteAll(oldSlots);

        // Snapshot lineup slots
        List<TeamSlot> slots = teamSlotRepository.findByPlayerId(playerId);
        for (TeamSlot slot : slots) {
            if (slot.getHeroId() != null || slot.getSummonId() != null) {
                TeamSetupSlot ss = new TeamSetupSlot();
                ss.setSetupId(setupId);
                ss.setSlotNumber(slot.getSlotNumber());
                ss.setHeroId(slot.getHeroId());
                ss.setSummonId(slot.getSummonId());
                teamSetupSlotRepository.save(ss);
            }
        }

        // Snapshot equipment for ALL player heroes (lineup + bench).
        // Presets manage the full equipment state, so bench heroes' items/abilities
        // must also be captured and restored on each switch.
        for (Hero hero : heroRepository.findByPlayerId(playerId)) {
            Long heroId = hero.getId();
            for (int eqSlot = 1; eqSlot <= 3; eqSlot++) {
                final int sn = eqSlot;
                Optional<EquippedItem> item = equippedItemRepository.findByHeroIdAndSlotNumber(heroId, sn);
                if (item.isPresent()) {
                    TeamSetupHeroEquipment eq = new TeamSetupHeroEquipment();
                    eq.setSetupId(setupId);
                    eq.setHeroId(heroId);
                    eq.setSlotNumber(sn);
                    eq.setItemTemplateId(item.get().getItemTemplateId());
                    heroEquipmentRepository.save(eq);
                    continue;
                }
                Optional<EquippedAbility> ability = equippedAbilityRepository.findByHeroIdAndSlotNumber(heroId, sn);
                if (ability.isPresent()) {
                    TeamSetupHeroEquipment eq = new TeamSetupHeroEquipment();
                    eq.setSetupId(setupId);
                    eq.setHeroId(heroId);
                    eq.setSlotNumber(sn);
                    eq.setAbilityTemplateId(ability.get().getAbilityTemplateId());
                    heroEquipmentRepository.save(eq);
                }
            }
        }
    }

    public static class TeamException extends RuntimeException {
        private final String errorCode;

        public TeamException(String errorCode, String message) {
            super(message);
            this.errorCode = errorCode;
        }

        public String getErrorCode() {
            return errorCode;
        }
    }
}
