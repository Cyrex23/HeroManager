package com.heromanager.service;

import com.heromanager.entity.BattleLog;
import com.heromanager.entity.HeroTemplate;
import com.heromanager.entity.Player;
import com.heromanager.repository.BattleLogRepository;
import com.heromanager.repository.HeroRepository;
import com.heromanager.repository.HeroTemplateRepository;
import com.heromanager.repository.PlayerRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
public class AccountService {

    private final PlayerRepository playerRepository;
    private final HeroRepository heroRepository;
    private final HeroTemplateRepository heroTemplateRepository;
    private final BattleLogRepository battleLogRepository;
    private final PasswordEncoder passwordEncoder;

    private static final String PLAYER_NOT_FOUND_CODE = "PLAYER_NOT_FOUND";
    private static final String PLAYER_NOT_FOUND_MSG = "Player not found.";

    public AccountService(PlayerRepository playerRepository,
                          HeroRepository heroRepository,
                          HeroTemplateRepository heroTemplateRepository,
                          BattleLogRepository battleLogRepository,
                          PasswordEncoder passwordEncoder) {
        this.playerRepository = playerRepository;
        this.heroRepository = heroRepository;
        this.heroTemplateRepository = heroTemplateRepository;
        this.battleLogRepository = battleLogRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getAccountData(Long playerId) {
        Player player = playerRepository.findById(playerId)
                .orElseThrow(() -> new AccountException(PLAYER_NOT_FOUND_CODE, PLAYER_NOT_FOUND_MSG));

        long totalBattles = battleLogRepository.countBattles(playerId);
        long wins = battleLogRepository.countWins(playerId);
        long losses = totalBattles - wins;

        // Compute current win/loss streak from recent battle history
        List<BattleLog> recentBattles = battleLogRepository
                .findByPlayerInvolved(playerId, PageRequest.of(0, 100)).getContent();
        int winStreak = 0;
        int lossStreak = 0;
        if (!recentBattles.isEmpty()) {
            boolean latestIsWin = playerId.equals(recentBattles.get(0).getWinnerId());
            for (BattleLog b : recentBattles) {
                boolean isWin = playerId.equals(b.getWinnerId());
                if (latestIsWin && isWin) winStreak++;
                else if (!latestIsWin && !isWin) lossStreak++;
                else break;
            }
        }

        // Build unlocked avatar list: stored set + any currently owned heroes not yet in the set
        Set<String> unlocked = new HashSet<>(player.getUnlockedAvatars());
        heroRepository.findByPlayerId(playerId).forEach(h -> {
            if (h.getTemplate() != null && h.getTemplate().getImagePath() != null) {
                unlocked.add(h.getTemplate().getImagePath());
            }
        });

        // Build avatar options: imagePath + heroName
        List<Map<String, String>> avatarOptions = new ArrayList<>();
        for (String imagePath : unlocked) {
            // Find a matching template for the display name
            String heroName = heroTemplateRepository.findAll().stream()
                    .filter(t -> imagePath.equals(t.getImagePath()))
                    .findFirst()
                    .map(HeroTemplate::getDisplayName)
                    .orElse("");
            avatarOptions.add(Map.of("imagePath", imagePath, "heroName", heroName));
        }
        avatarOptions.sort(Comparator.comparing(m -> m.get("heroName")));

        long daysUntilTeamNameChange = 0;
        if (player.getTeamNameLastChanged() != null) {
            long daysSince = ChronoUnit.DAYS.between(player.getTeamNameLastChanged(), LocalDateTime.now());
            daysUntilTeamNameChange = Math.max(0, 30 - daysSince);
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("username", player.getUsername());
        result.put("teamName", player.getTeamName() != null ? player.getTeamName() : player.getUsername());
        result.put("profileImagePath", player.getProfileImagePath());
        result.put("memberSince", player.getCreatedAt().toString());
        result.put("totalBattles", totalBattles);
        result.put("wins", wins);
        result.put("losses", losses);
        result.put("winStreak", winStreak);
        result.put("lossStreak", lossStreak);
        result.put("avatarOptions", avatarOptions);
        result.put("canChangeTeamName", daysUntilTeamNameChange == 0);
        result.put("daysUntilTeamNameChange", daysUntilTeamNameChange);
        result.put("chatSoundEnabled", player.isChatSoundEnabled());
        return result;
    }

    @Transactional
    public void setProfileImage(Long playerId, String imagePath) {
        Player player = playerRepository.findById(playerId)
                .orElseThrow(() -> new AccountException(PLAYER_NOT_FOUND_CODE, PLAYER_NOT_FOUND_MSG));

        Set<String> unlocked = new HashSet<>(player.getUnlockedAvatars());
        heroRepository.findByPlayerId(playerId).forEach(h -> {
            if (h.getTemplate() != null && h.getTemplate().getImagePath() != null) {
                unlocked.add(h.getTemplate().getImagePath());
            }
        });

        if (!unlocked.contains(imagePath)) {
            throw new AccountException("INVALID_AVATAR", "You have not unlocked this avatar.");
        }
        player.setProfileImagePath(imagePath);
        playerRepository.save(player);
    }

    @Transactional
    public void changeTeamName(Long playerId, String newName) {
        if (newName == null || newName.isBlank() || newName.length() < 3 || newName.length() > 30) {
            throw new AccountException("INVALID_NAME", "Team name must be between 3 and 30 characters.");
        }
        Player player = playerRepository.findById(playerId)
                .orElseThrow(() -> new AccountException(PLAYER_NOT_FOUND_CODE, PLAYER_NOT_FOUND_MSG));

        if (player.getTeamNameLastChanged() != null) {
            long daysSince = ChronoUnit.DAYS.between(player.getTeamNameLastChanged(), LocalDateTime.now());
            if (daysSince < 30) {
                throw new AccountException("COOLDOWN", "You can change your team name again in " + (30 - daysSince) + " days.");
            }
        }
        player.setTeamName(newName);
        player.setTeamNameLastChanged(LocalDateTime.now());
        playerRepository.save(player);
    }

    @Transactional
    public void setChatSoundEnabled(Long playerId, boolean enabled) {
        Player player = playerRepository.findById(playerId)
                .orElseThrow(() -> new AccountException(PLAYER_NOT_FOUND_CODE, PLAYER_NOT_FOUND_MSG));
        player.setChatSoundEnabled(enabled);
        playerRepository.save(player);
    }

    @Transactional
    public void changePassword(Long playerId, String currentPassword, String newPassword) {
        if (newPassword == null || newPassword.length() < 6) {
            throw new AccountException("INVALID_PASSWORD", "New password must be at least 6 characters.");
        }
        Player player = playerRepository.findById(playerId)
                .orElseThrow(() -> new AccountException(PLAYER_NOT_FOUND_CODE, PLAYER_NOT_FOUND_MSG));

        if (!passwordEncoder.matches(currentPassword, player.getPasswordHash())) {
            throw new AccountException("WRONG_PASSWORD", "Current password is incorrect.");
        }
        player.setPasswordHash(passwordEncoder.encode(newPassword));
        playerRepository.save(player);
    }

    public static class AccountException extends RuntimeException {
        private final String errorCode;
        public AccountException(String errorCode, String message) {
            super(message);
            this.errorCode = errorCode;
        }
        public String getErrorCode() { return errorCode; }
    }
}
