package com.heromanager.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.heromanager.dto.ArenaOpponentResponse;
import com.heromanager.dto.BattleResultResponse;
import com.heromanager.entity.BattleLog;
import com.heromanager.entity.Player;
import com.heromanager.entity.TeamSlot;
import com.heromanager.repository.BattleLogRepository;
import com.heromanager.repository.PlayerRepository;
import com.heromanager.repository.TeamSlotRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class ArenaService {

    private final PlayerRepository playerRepository;
    private final TeamSlotRepository teamSlotRepository;
    private final BattleLogRepository battleLogRepository;
    private final BattleService battleService;
    private final EnergyService energyService;
    private final ObjectMapper objectMapper;

    public ArenaService(PlayerRepository playerRepository,
                        TeamSlotRepository teamSlotRepository,
                        BattleLogRepository battleLogRepository,
                        BattleService battleService,
                        EnergyService energyService,
                        ObjectMapper objectMapper) {
        this.playerRepository = playerRepository;
        this.teamSlotRepository = teamSlotRepository;
        this.battleLogRepository = battleLogRepository;
        this.battleService = battleService;
        this.energyService = energyService;
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> listOpponents(Long playerId, int page, int size) {
        List<Player> allPlayers = playerRepository.findAll();

        List<ArenaOpponentResponse> opponents = new ArrayList<>();
        for (Player p : allPlayers) {
            if (!p.isEmailConfirmed()) continue;

            List<TeamSlot> slots = teamSlotRepository.findByPlayerId(p.getId());
            long heroCount = slots.stream().filter(s -> s.getHeroId() != null).count();
            if (heroCount == 0) continue;

            boolean isOnline = energyService.isOnline(p);
            boolean isSelf = p.getId().equals(playerId);

            // Skip self if offline (only show self when online)
            if (isSelf && !isOnline) continue;

            // Check for pending return challenge (not applicable for self)
            boolean hasPendingReturn = !isSelf && battleLogRepository
                    .findPendingReturnChallenge(p.getId(), playerId).isPresent();

            int energyCost;
            if (isSelf) {
                energyCost = 0;
            } else if (hasPendingReturn) {
                energyCost = 4;
            } else if (isOnline) {
                energyCost = 5;
            } else {
                energyCost = 7;
            }

            // Calculate team power
            double teamPower = 0;
            var teamData = battleService.loadTeam(p.getId(), p.getUsername());
            for (var heroSlot : teamData.heroSlots()) {
                var stats = PlayerService.buildHeroStats(heroSlot.hero().getTemplate(), heroSlot.hero().getLevel());
                teamPower += stats.values().stream().mapToDouble(Double::doubleValue).sum();
            }

            opponents.add(ArenaOpponentResponse.builder()
                    .playerId(p.getId())
                    .username(p.getUsername())
                    .teamPower(teamPower)
                    .isOnline(isOnline)
                    .heroCount((int) heroCount)
                    .hasPendingReturn(hasPendingReturn)
                    .energyCost(energyCost)
                    .profileImagePath(p.getProfileImagePath())
                    .teamName(p.getTeamName() != null ? p.getTeamName() : p.getUsername())
                    .build());
        }

        // Sort by team power descending
        opponents.sort((a, b) -> Double.compare(b.getTeamPower(), a.getTeamPower()));

        // Paginate
        int start = page * size;
        int end = Math.min(start + size, opponents.size());
        List<ArenaOpponentResponse> pageContent = start < opponents.size()
                ? opponents.subList(start, end) : List.of();

        return Map.of(
                "opponents", pageContent,
                "totalPlayers", opponents.size(),
                "page", page,
                "size", size
        );
    }

    @Transactional
    public BattleResultResponse initiateChallenge(Long challengerId, Long defenderId) {
        if (challengerId.equals(defenderId)) {
            throw new ArenaException("SELF_CHALLENGE", "You cannot challenge your own team.");
        }

        Player challenger = playerRepository.findById(challengerId)
                .orElseThrow(() -> new ArenaException("PLAYER_NOT_FOUND", "Player not found."));
        Player defender = playerRepository.findById(defenderId)
                .orElseThrow(() -> new ArenaException("PLAYER_NOT_FOUND", "Defender not found."));

        // Check challenger has heroes
        var challengerTeam = battleService.loadTeam(challengerId, challenger.getUsername());
        if (challengerTeam.heroSlots().isEmpty()) {
            throw new ArenaException("EMPTY_TEAM", "You need at least 1 hero in your team to battle.");
        }

        // Check return challenge
        boolean isReturn = battleLogRepository
                .findPendingReturnChallenge(defenderId, challengerId).isPresent();

        boolean defenderOnline = energyService.isOnline(defender);
        int energyCost;
        if (isReturn) {
            energyCost = 4;
        } else if (defenderOnline) {
            energyCost = 5;
        } else {
            energyCost = 7;
        }

        // Deduct energy
        energyService.refreshEnergy(challenger);
        if (challenger.getArenaEnergy() < energyCost) {
            Long nextTick = energyService.getNextTickSeconds(challenger);
            String tickMsg = nextTick != null ? " Next energy in " + (nextTick / 60) + "m " + (nextTick % 60) + "s." : "";
            throw new ArenaException("INSUFFICIENT_ENERGY",
                    "You need " + energyCost + " Arena Energy but only have " + challenger.getArenaEnergy() + "." + tickMsg);
        }

        challenger.setArenaEnergy(challenger.getArenaEnergy() - energyCost);
        playerRepository.save(challenger);

        // Set online
        energyService.setOnline(challenger);

        // Run battle
        var defenderTeam = battleService.loadTeam(defenderId, defender.getUsername());
        Map<String, Object> battleLog = battleService.simulateBattle(challengerTeam, defenderTeam);

        String winner = (String) battleLog.get("winner");
        boolean challengerWon = "challenger".equals(winner);
        int challengerGold = challengerWon ? 2 : 1;
        int defenderGold = challengerWon ? 1 : 2;

        // Award gold
        challenger.setGold(challenger.getGold() + challengerGold);
        playerRepository.save(challenger);
        defender.setGold(defender.getGold() + defenderGold);
        playerRepository.save(defender);

        // Save battle log
        BattleLog log = new BattleLog();
        log.setChallengerId(challengerId);
        log.setDefenderId(defenderId);
        log.setWinnerId(challengerWon ? challengerId : defenderId);
        log.setChallengerGoldEarned(challengerGold);
        log.setDefenderGoldEarned(defenderGold);
        log.setEnergyCost(energyCost);
        log.setReturnChallenge(isReturn);

        try {
            log.setBattleLog(objectMapper.writeValueAsString(battleLog));
        } catch (Exception e) {
            log.setBattleLog("{}");
        }
        battleLogRepository.save(log);

        // Mark return challenge as used
        if (isReturn) {
            battleLogRepository.findPendingReturnChallenge(defenderId, challengerId)
                    .ifPresent(original -> {
                        original.setReturnChallengeUsed(true);
                        battleLogRepository.save(original);
                    });
        }

        return BattleResultResponse.builder()
                .battleId(log.getId())
                .result(challengerWon ? "WIN" : "LOSS")
                .goldEarned(challengerGold)
                .energyCost(energyCost)
                .arenaEnergyRemaining(challenger.getArenaEnergy())
                .battleLog(battleLog)
                .build();
    }

    public Map<String, Object> getBattleLog(Long playerId, int page, int size) {
        Page<BattleLog> logs = battleLogRepository.findByPlayerInvolved(
                playerId, PageRequest.of(page, size));

        List<Map<String, Object>> battles = new ArrayList<>();
        for (BattleLog log : logs.getContent()) {
            boolean wasChallenger = log.getChallengerId().equals(playerId);
            Long opponentId = wasChallenger ? log.getDefenderId() : log.getChallengerId();
            String opponentName = playerRepository.findById(opponentId)
                    .map(Player::getUsername).orElse("Unknown");

            boolean won = log.getWinnerId().equals(playerId);
            int goldEarned = wasChallenger ? log.getChallengerGoldEarned() : log.getDefenderGoldEarned();

            boolean canReturn = !wasChallenger && !log.isReturnChallengeUsed();

            battles.add(Map.of(
                    "battleId", log.getId(),
                    "opponentUsername", opponentName,
                    "opponentId", opponentId,
                    "result", won ? "WIN" : "LOSS",
                    "goldEarned", goldEarned,
                    "wasChallenger", wasChallenger,
                    "canReturnChallenge", canReturn,
                    "returnEnergyCost", canReturn ? 4 : 0,
                    "createdAt", log.getCreatedAt().toString()
            ));
        }

        return Map.of("battles", battles, "page", page, "size", size);
    }

    public Object getBattle(Long playerId, Long battleId) {
        BattleLog log = battleLogRepository.findById(battleId)
                .orElseThrow(() -> new ArenaException("BATTLE_NOT_FOUND", "Battle not found."));

        if (!log.getChallengerId().equals(playerId) && !log.getDefenderId().equals(playerId)) {
            throw new ArenaException("BATTLE_NOT_FOUND", "Battle not found.");
        }

        try {
            return objectMapper.readValue(log.getBattleLog(), Map.class);
        } catch (Exception e) {
            return Map.of();
        }
    }

    public static class ArenaException extends RuntimeException {
        private final String errorCode;

        public ArenaException(String errorCode, String message) {
            super(message);
            this.errorCode = errorCode;
        }

        public String getErrorCode() {
            return errorCode;
        }
    }
}
