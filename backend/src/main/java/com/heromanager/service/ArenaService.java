package com.heromanager.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.heromanager.dto.ArenaOpponentResponse;
import com.heromanager.dto.BattleResultResponse;
import com.heromanager.entity.*;
import com.heromanager.repository.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class ArenaService {

    private final PlayerRepository playerRepository;
    private final TeamSlotRepository teamSlotRepository;
    private final HeroRepository heroRepository;
    private final BattleLogRepository battleLogRepository;
    private final BattleService battleService;
    private final EnergyService energyService;
    private final ObjectMapper objectMapper;

    public ArenaService(PlayerRepository playerRepository,
                        TeamSlotRepository teamSlotRepository,
                        HeroRepository heroRepository,
                        BattleLogRepository battleLogRepository,
                        BattleService battleService,
                        EnergyService energyService) {
        this.playerRepository = playerRepository;
        this.teamSlotRepository = teamSlotRepository;
        this.heroRepository = heroRepository;
        this.battleLogRepository = battleLogRepository;
        this.battleService = battleService;
        this.energyService = energyService;
        this.objectMapper = new ObjectMapper();
    }

    public Map<String, Object> listOpponents(Long playerId, int page, int size) {
        List<Player> allPlayers = playerRepository.findAll();

        List<ArenaOpponentResponse> opponents = new ArrayList<>();
        for (Player p : allPlayers) {
            if (p.getId().equals(playerId)) continue;
            if (!p.getEmailConfirmed()) continue;

            List<TeamSlot> slots = teamSlotRepository.findByPlayerId(p.getId());
            long heroCount = slots.stream().filter(s -> s.getHeroId() != null && s.getSlotNumber() <= 6).count();
            if (heroCount == 0) continue;

            double teamPower = calculateTeamPower(p.getId());
            boolean isOnline = energyService.isOnline(p);

            // Check for return challenge opportunity
            List<BattleLog> returnOpps = battleLogRepository.findReturnChallengeOpportunities(p.getId(), playerId);
            boolean hasPendingReturn = !returnOpps.isEmpty();

            int energyCost;
            if (hasPendingReturn) {
                energyCost = 4;
            } else if (isOnline) {
                energyCost = 5;
            } else {
                energyCost = 7;
            }

            opponents.add(ArenaOpponentResponse.builder()
                    .playerId(p.getId())
                    .username(p.getUsername())
                    .teamPower(teamPower)
                    .isOnline(isOnline)
                    .heroCount((int) heroCount)
                    .hasPendingReturn(hasPendingReturn)
                    .energyCost(energyCost)
                    .build());
        }

        opponents.sort((a, b) -> Double.compare(b.getTeamPower(), a.getTeamPower()));

        int start = page * size;
        int end = Math.min(start + size, opponents.size());
        List<ArenaOpponentResponse> pageContent = start < opponents.size()
                ? opponents.subList(start, end) : Collections.emptyList();

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("opponents", pageContent);
        result.put("totalPlayers", opponents.size());
        result.put("page", page);
        result.put("size", size);
        return result;
    }

    @Transactional
    public Object initiateChallenge(Long challengerId, Long defenderId) {
        if (challengerId.equals(defenderId)) {
            return Map.of("error", "SELF_CHALLENGE", "message", "You cannot challenge your own team.");
        }

        Player challenger = playerRepository.findById(challengerId).orElseThrow();
        Player defender = playerRepository.findById(defenderId).orElseThrow();

        List<BattleService.TeamFighter> challengerTeam = battleService.buildTeamFighters(challengerId);
        if (challengerTeam.isEmpty()) {
            return Map.of("error", "EMPTY_TEAM", "message", "You need at least 1 hero in your team to battle.");
        }

        // Determine energy cost
        List<BattleLog> returnOpps = battleLogRepository.findReturnChallengeOpportunities(defenderId, challengerId);
        boolean isReturn = !returnOpps.isEmpty();
        boolean defenderOnline = energyService.isOnline(defender);
        int energyCost = isReturn ? 4 : (defenderOnline ? 5 : 7);

        // Deduct energy
        energyService.recalculateEnergy(challenger);
        if (challenger.getArenaEnergy() < energyCost) {
            Long nextTick = energyService.getNextTickSeconds(challenger);
            String tickMsg = nextTick != null ? " Next energy in " + (nextTick / 60) + "m " + (nextTick % 60) + "s." : "";
            return Map.of("error", "INSUFFICIENT_ENERGY",
                    "message", "You need " + energyCost + " Arena Energy but only have " + challenger.getArenaEnergy() + "." + tickMsg);
        }

        challenger.setArenaEnergy(challenger.getArenaEnergy() - energyCost);
        energyService.setOnline(challenger);
        playerRepository.save(challenger);

        // Build defender team and simulate
        List<BattleService.TeamFighter> defenderTeam = battleService.buildTeamFighters(defenderId);
        if (defenderTeam.isEmpty()) {
            defenderTeam = List.of(); // empty team = auto-loss for defender
        }

        Map<String, Object> battleLog = battleService.simulateBattle(challengerId, defenderId, challengerTeam, defenderTeam);

        // Add username info
        ((Map<String, Object>) battleLog.get("challenger")).put("username", challenger.getUsername());
        ((Map<String, Object>) battleLog.get("defender")).put("username", defender.getUsername());

        String winner = (String) battleLog.get("winner");
        int challengerGold = "challenger".equals(winner) ? 2 : 1;
        int defenderGold = "defender".equals(winner) ? 2 : 1;

        challenger.setGold(challenger.getGold() + challengerGold);
        playerRepository.save(challenger);
        defender.setGold(defender.getGold() + defenderGold);
        playerRepository.save(defender);

        // Apply XP rewards
        battleService.applyBattleRewards(challengerId, defenderId, battleLog);

        // Save battle log
        String battleLogJson;
        try {
            battleLogJson = objectMapper.writeValueAsString(battleLog);
        } catch (Exception e) {
            battleLogJson = "{}";
        }

        BattleLog log = BattleLog.builder()
                .challengerId(challengerId)
                .defenderId(defenderId)
                .winnerId("challenger".equals(winner) ? challengerId : defenderId)
                .challengerGoldEarned(challengerGold)
                .defenderGoldEarned(defenderGold)
                .battleLogJson(battleLogJson)
                .energyCost(energyCost)
                .isReturnChallenge(isReturn)
                .build();
        log = battleLogRepository.save(log);

        // Mark return challenge as used
        if (isReturn && !returnOpps.isEmpty()) {
            BattleLog original = returnOpps.get(0);
            original.setReturnChallengeUsed(true);
            battleLogRepository.save(original);
        }

        return BattleResultResponse.builder()
                .battleId(log.getId())
                .result("challenger".equals(winner) ? "WIN" : "LOSS")
                .goldEarned(challengerGold)
                .energyCost(energyCost)
                .arenaEnergyRemaining(challenger.getArenaEnergy())
                .battleLog(battleLog)
                .build();
    }

    public Map<String, Object> getBattleLog(Long playerId, int page, int size) {
        Page<BattleLog> logs = battleLogRepository.findByPlayerIdOrderByCreatedAtDesc(playerId, PageRequest.of(page, size));

        List<Map<String, Object>> battles = new ArrayList<>();
        for (BattleLog log : logs.getContent()) {
            boolean wasChallenger = log.getChallengerId().equals(playerId);
            Long opponentId = wasChallenger ? log.getDefenderId() : log.getChallengerId();
            Player opponent = playerRepository.findById(opponentId).orElse(null);

            String result = log.getWinnerId().equals(playerId) ? "WIN" : "LOSS";
            int goldEarned = wasChallenger ? log.getChallengerGoldEarned() : log.getDefenderGoldEarned();

            boolean canReturn = !wasChallenger && !log.getReturnChallengeUsed();

            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("battleId", log.getId());
            entry.put("opponentUsername", opponent != null ? opponent.getUsername() : "Unknown");
            entry.put("opponentId", opponentId);
            entry.put("result", result);
            entry.put("goldEarned", goldEarned);
            entry.put("wasChallenger", wasChallenger);
            entry.put("canReturnChallenge", canReturn);
            entry.put("returnEnergyCost", canReturn ? 4 : null);
            entry.put("createdAt", log.getCreatedAt().toString());
            battles.add(entry);
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("battles", battles);
        result.put("page", page);
        result.put("size", size);
        return result;
    }

    public Object getBattle(Long playerId, Long battleId) {
        Optional<BattleLog> opt = battleLogRepository.findById(battleId);
        if (opt.isEmpty()) {
            return Map.of("error", "NOT_FOUND", "message", "Battle not found.");
        }
        BattleLog log = opt.get();
        if (!log.getChallengerId().equals(playerId) && !log.getDefenderId().equals(playerId)) {
            return Map.of("error", "NOT_FOUND", "message", "Battle not found.");
        }

        try {
            Map<String, Object> battleLog = objectMapper.readValue(log.getBattleLogJson(), Map.class);

            boolean wasChallenger = log.getChallengerId().equals(playerId);
            String playerResult = log.getWinnerId().equals(playerId) ? "WIN" : "LOSS";
            int goldEarned = wasChallenger ? log.getChallengerGoldEarned() : log.getDefenderGoldEarned();

            return BattleResultResponse.builder()
                    .battleId(log.getId())
                    .result(playerResult)
                    .goldEarned(goldEarned)
                    .energyCost(log.getEnergyCost())
                    .arenaEnergyRemaining(null)
                    .battleLog(battleLog)
                    .build();
        } catch (Exception e) {
            return Map.of("error", "PARSE_ERROR", "message", "Could not parse battle log.");
        }
    }

    private double calculateTeamPower(Long playerId) {
        List<BattleService.TeamFighter> fighters = battleService.buildTeamFighters(playerId);
        double total = 0;
        for (BattleService.TeamFighter f : fighters) {
            for (double stat : f.totalStats.values()) {
                total += stat;
            }
        }
        return Math.round(total * 100.0) / 100.0;
    }
}
