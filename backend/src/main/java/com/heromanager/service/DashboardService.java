package com.heromanager.service;

import com.heromanager.dto.DashboardResponse;
import com.heromanager.entity.Hero;
import com.heromanager.entity.HeroTemplate;
import com.heromanager.repository.BattleLogRepository;
import com.heromanager.repository.HeroRepository;
import com.heromanager.repository.HeroXpLogRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.WeekFields;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Service
public class DashboardService {

    private final BattleLogRepository battleLogRepository;
    private final HeroRepository heroRepository;
    private final HeroXpLogRepository heroXpLogRepository;

    public DashboardService(BattleLogRepository battleLogRepository, HeroRepository heroRepository,
                            HeroXpLogRepository heroXpLogRepository) {
        this.battleLogRepository = battleLogRepository;
        this.heroRepository = heroRepository;
        this.heroXpLogRepository = heroXpLogRepository;
    }

    @Transactional(readOnly = true)
    public DashboardResponse getDashboard(Long playerId) {
        LocalDateTime startOfToday = LocalDate.now().atStartOfDay();
        LocalDateTime startOfWeek  = LocalDate.now()
                .with(WeekFields.of(Locale.getDefault()).dayOfWeek(), 1)
                .atStartOfDay();
        LocalDateTime startOfMonth = LocalDate.now().withDayOfMonth(1).atStartOfDay();

        return DashboardResponse.builder()
                .today(buildPeriod(playerId, startOfToday))
                .week(buildPeriod(playerId, startOfWeek))
                .month(buildPeriod(playerId, startOfMonth))
                .allTime(buildAllTime(playerId))
                .heroes(buildHeroes(playerId, startOfToday, startOfWeek, startOfMonth))
                .build();
    }

    private DashboardResponse.PeriodStats buildPeriod(Long playerId, LocalDateTime since) {
        long battles    = battleLogRepository.countBattlesSince(playerId, since);
        long wins       = battleLogRepository.countWinsSince(playerId, since);
        long losses     = battles - wins;
        long goldEarned = battleLogRepository.sumChallengerGoldSince(playerId, since)
                        + battleLogRepository.sumDefenderGoldSince(playerId, since);
        int  winRate    = battles > 0 ? (int) Math.round(wins * 100.0 / battles) : 0;
        return DashboardResponse.PeriodStats.builder()
                .battles(battles).wins(wins).losses(losses)
                .goldEarned(goldEarned).winRate(winRate)
                .build();
    }

    private DashboardResponse.PeriodStats buildAllTime(Long playerId) {
        long battles    = battleLogRepository.countBattles(playerId);
        long wins       = battleLogRepository.countWins(playerId);
        long losses     = battles - wins;
        long goldEarned = battleLogRepository.sumChallengerGoldAllTime(playerId)
                        + battleLogRepository.sumDefenderGoldAllTime(playerId);
        int  winRate    = battles > 0 ? (int) Math.round(wins * 100.0 / battles) : 0;
        return DashboardResponse.PeriodStats.builder()
                .battles(battles).wins(wins).losses(losses)
                .goldEarned(goldEarned).winRate(winRate)
                .build();
    }

    private List<DashboardResponse.HeroSummary> buildHeroes(Long playerId,
            LocalDateTime startOfToday, LocalDateTime startOfWeek, LocalDateTime startOfMonth) {
        List<Hero> heroes = heroRepository.findByPlayerId(playerId);
        List<DashboardResponse.HeroSummary> result = new ArrayList<>();
        for (Hero h : heroes) {
            HeroTemplate t = h.getTemplate();
            if (t == null) continue;
            int level = h.getLevel();
            String element = h.getElementOverride() != null ? h.getElementOverride()
                    : (t.getElement() != null ? t.getElement().name() : null);
            result.add(DashboardResponse.HeroSummary.builder()
                    .id(h.getId())
                    .name(t.getDisplayName())
                    .imagePath(t.getImagePath())
                    .level(level)
                    .currentXp(h.getCurrentXp())
                    .xpToNextLevel(level * level * 10.0)
                    .tier(t.getTier() != null ? t.getTier().name() : null)
                    .element(element)
                    .clashesWon(h.getClashesWon())
                    .clashesLost(h.getClashesLost())
                    .currentWinStreak(h.getCurrentWinStreak())
                    .maxDamageDealt(h.getMaxDamageDealt())
                    .xpGainedToday(heroXpLogRepository.sumXpSince(h.getId(), startOfToday))
                    .xpGainedWeek(heroXpLogRepository.sumXpSince(h.getId(), startOfWeek))
                    .xpGainedMonth(heroXpLogRepository.sumXpSince(h.getId(), startOfMonth))
                    .xpGainedAllTime(heroXpLogRepository.sumXpAllTime(h.getId()))
                    .build());
        }
        return result;
    }
}
