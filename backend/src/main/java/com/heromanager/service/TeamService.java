package com.heromanager.service;

import com.heromanager.dto.TeamResponse;
import com.heromanager.entity.*;
import com.heromanager.repository.HeroRepository;
import com.heromanager.repository.SummonRepository;
import com.heromanager.repository.TeamSlotRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
public class TeamService {

    private final TeamSlotRepository teamSlotRepository;
    private final HeroRepository heroRepository;
    private final SummonRepository summonRepository;

    public TeamService(TeamSlotRepository teamSlotRepository,
                       HeroRepository heroRepository,
                       SummonRepository summonRepository) {
        this.teamSlotRepository = teamSlotRepository;
        this.heroRepository = heroRepository;
        this.summonRepository = summonRepository;
    }

    @Transactional(readOnly = true)
    public TeamResponse getTeamLineup(Long playerId) {
        List<TeamSlot> slots = teamSlotRepository.findByPlayerId(playerId);

        // Find equipped summon for MP bonus
        double summonMpBonus = 0;
        Summon equippedSummon = null;
        for (TeamSlot slot : slots) {
            if (slot.getSummonId() != null) {
                equippedSummon = summonRepository.findById(slot.getSummonId()).orElse(null);
                if (equippedSummon != null && equippedSummon.getTemplate() != null) {
                    SummonTemplate st = equippedSummon.getTemplate();
                    summonMpBonus = st.getBaseMp() + st.getGrowthMp() * (equippedSummon.getLevel() - 1);
                }
            }
        }

        List<TeamResponse.SlotInfo> slotInfos = new ArrayList<>();
        int capacityUsed = 0;
        double teamPower = 0;

        // Build slots 1-6 (hero slots)
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
                    Map<String, Double> totalStats = PlayerService.buildHeroStats(t, hero.getLevel());

                    // Add summon MP bonus
                    if (summonMpBonus > 0) {
                        totalStats = new HashMap<>(totalStats);
                        totalStats.put("magicPower", totalStats.get("magicPower") + summonMpBonus);
                    }

                    double statSum = totalStats.values().stream().mapToDouble(Double::doubleValue).sum();
                    teamPower += statSum;
                    capacityUsed += t.getCapacity();

                    heroInfo = TeamResponse.HeroSlotInfo.builder()
                            .id(hero.getId())
                            .name(t.getDisplayName())
                            .imagePath(t.getImagePath())
                            .level(hero.getLevel())
                            .capacity(t.getCapacity())
                            .totalStats(totalStats)
                            .currentXp(hero.getCurrentXp())
                            .xpToNextLevel(hero.getLevel() * hero.getLevel() * 10)
                            .tier(t.getTier() != null ? t.getTier().name() : null)
                            .element(t.getElement() != null ? t.getElement().name() : null)
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
            summonInfo = TeamResponse.SummonSlotInfo.builder()
                    .id(equippedSummon.getId())
                    .name(st.getDisplayName())
                    .imagePath(st.getImagePath())
                    .level(equippedSummon.getLevel())
                    .capacity(st.getCapacity())
                    .teamBonus("+" + (int) summonMpBonus + " Magic Power")
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
                .capacity(TeamResponse.CapacityInfo.builder().used(capacityUsed).max(100).build())
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
        int heroCapacity = hero.getTemplate().getCapacity();
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
        return TeamResponse.CapacityInfo.builder().used(newCapacity).max(100).build();
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
        return TeamResponse.CapacityInfo.builder().used(newCapacity).max(100).build();
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
        return TeamResponse.CapacityInfo.builder().used(newCapacity).max(100).build();
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
        return TeamResponse.CapacityInfo.builder().used(newCapacity).max(100).build();
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
                if (hero != null) {
                    total += hero.getTemplate().getCapacity();
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

    public static String getSlotTier(int slotNumber) {
        if (slotNumber <= 3) return "COMMONER";
        if (slotNumber <= 5) return "ELITE";
        return "LEGENDARY";
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
