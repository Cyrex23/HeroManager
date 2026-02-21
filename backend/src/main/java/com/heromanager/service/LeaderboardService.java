package com.heromanager.service;

import com.heromanager.entity.*;
import com.heromanager.repository.*;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
public class LeaderboardService {

    private final HeroRepository heroRepository;
    private final SummonRepository summonRepository;
    private final PlayerRepository playerRepository;
    private final TeamSlotRepository teamSlotRepository;
    private final BattleService battleService;

    public LeaderboardService(HeroRepository heroRepository,
                              SummonRepository summonRepository,
                              PlayerRepository playerRepository,
                              TeamSlotRepository teamSlotRepository,
                              BattleService battleService) {
        this.heroRepository = heroRepository;
        this.summonRepository = summonRepository;
        this.playerRepository = playerRepository;
        this.teamSlotRepository = teamSlotRepository;
        this.battleService = battleService;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getTopHeroes() {
        List<Hero> heroes = heroRepository.findTopByLevel(PageRequest.of(0, 100));
        List<Map<String, Object>> result = new ArrayList<>();
        int rank = 1;
        for (Hero hero : heroes) {
            HeroTemplate t = hero.getTemplate();
            Player owner = playerRepository.findById(hero.getPlayerId()).orElse(null);
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("rank", rank++);
            entry.put("heroId", hero.getId());
            entry.put("name", t.getDisplayName());
            entry.put("imagePath", t.getImagePath());
            entry.put("tier", t.getTier() != null ? t.getTier().name() : null);
            entry.put("element", t.getElement() != null ? t.getElement().name() : null);
            entry.put("level", hero.getLevel());
            entry.put("clashesWon", hero.getClashesWon());
            entry.put("clashesLost", hero.getClashesLost());
            entry.put("ownerPlayerId", owner != null ? owner.getId() : null);
            entry.put("ownerUsername", owner != null ? owner.getUsername() : "—");
            entry.put("ownerTeamName", owner != null
                    ? (owner.getTeamName() != null ? owner.getTeamName() : owner.getUsername()) : "—");
            entry.put("ownerProfileImagePath", owner != null ? owner.getProfileImagePath() : null);
            result.add(entry);
        }
        return result;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getTopSummons() {
        List<Summon> summons = summonRepository.findTopByLevel(PageRequest.of(0, 100));
        List<Map<String, Object>> result = new ArrayList<>();
        int rank = 1;
        for (Summon summon : summons) {
            SummonTemplate t = summon.getTemplate();
            Player owner = playerRepository.findById(summon.getPlayerId()).orElse(null);
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("rank", rank++);
            entry.put("summonId", summon.getId());
            entry.put("name", t.getDisplayName());
            entry.put("imagePath", t.getImagePath());
            entry.put("level", summon.getLevel());
            entry.put("ownerPlayerId", owner != null ? owner.getId() : null);
            entry.put("ownerUsername", owner != null ? owner.getUsername() : "—");
            entry.put("ownerTeamName", owner != null
                    ? (owner.getTeamName() != null ? owner.getTeamName() : owner.getUsername()) : "—");
            entry.put("ownerProfileImagePath", owner != null ? owner.getProfileImagePath() : null);
            result.add(entry);
        }
        return result;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getTopTeams() {
        List<Player> players = playerRepository.findAll();
        List<Map<String, Object>> teams = new ArrayList<>();

        for (Player player : players) {
            if (!player.isEmailConfirmed()) continue;
            List<TeamSlot> slots = teamSlotRepository.findByPlayerId(player.getId());
            long heroCount = slots.stream().filter(s -> s.getHeroId() != null).count();
            if (heroCount == 0) continue;

            double teamPower = 0;
            try {
                var teamData = battleService.loadTeam(player.getId(), player.getUsername());
                for (var heroSlot : teamData.heroSlots()) {
                    var stats = PlayerService.buildHeroStats(
                            heroSlot.hero().getTemplate(), heroSlot.hero().getLevel());
                    teamPower += stats.values().stream().mapToDouble(Double::doubleValue).sum();
                }
            } catch (Exception e) {
                continue;
            }

            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("playerId", player.getId());
            entry.put("username", player.getUsername());
            entry.put("teamName", player.getTeamName() != null ? player.getTeamName() : player.getUsername());
            entry.put("profileImagePath", player.getProfileImagePath());
            entry.put("teamPower", teamPower);
            entry.put("heroCount", (int) heroCount);
            teams.add(entry);
        }

        teams.sort((a, b) -> Double.compare((double) b.get("teamPower"), (double) a.get("teamPower")));

        int rank = 1;
        List<Map<String, Object>> result = new ArrayList<>();
        for (Map<String, Object> team : teams.subList(0, Math.min(100, teams.size()))) {
            team.put("rank", rank++);
            result.add(team);
        }
        return result;
    }
}
