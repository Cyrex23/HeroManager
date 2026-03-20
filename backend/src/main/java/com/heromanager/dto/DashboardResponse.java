package com.heromanager.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class DashboardResponse {

    private PeriodStats today;
    private PeriodStats week;
    private PeriodStats month;
    private PeriodStats allTime;
    private List<HeroSummary> heroes;

    @Getter
    @Builder
    public static class PeriodStats {
        private long battles;
        private long wins;
        private long losses;
        private long goldEarned;
        private int winRate; // 0-100
    }

    @Getter
    @Builder
    public static class HeroSummary {
        private Long id;
        private String name;
        private String imagePath;
        private int level;
        private double currentXp;
        private double xpToNextLevel;
        private String tier;
        private String element;
        private int clashesWon;
        private int clashesLost;
        private int currentWinStreak;
        private double maxDamageDealt;
        private long xpGainedToday;
        private long xpGainedWeek;
        private long xpGainedMonth;
        private long xpGainedAllTime;
    }
}
