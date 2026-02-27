package com.heromanager.service;

import com.heromanager.dto.LoginRequest;
import com.heromanager.dto.LoginResponse;
import com.heromanager.dto.RegisterRequest;
import com.heromanager.entity.ConfirmationToken;
import com.heromanager.entity.Hero;
import com.heromanager.entity.HeroTemplate;
import com.heromanager.entity.PasswordResetToken;
import com.heromanager.entity.Player;
import com.heromanager.entity.TeamSlot;
import com.heromanager.repository.ConfirmationTokenRepository;
import com.heromanager.repository.HeroRepository;
import com.heromanager.repository.HeroTemplateRepository;
import com.heromanager.repository.PasswordResetTokenRepository;
import com.heromanager.repository.PlayerRepository;
import com.heromanager.repository.TeamSlotRepository;
import com.heromanager.util.JwtUtil;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class AuthService {

    private final PlayerRepository playerRepository;
    private final ConfirmationTokenRepository tokenRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final HeroRepository heroRepository;
    private final HeroTemplateRepository heroTemplateRepository;
    private final TeamSlotRepository teamSlotRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final EmailService emailService;

    public AuthService(PlayerRepository playerRepository,
                       ConfirmationTokenRepository tokenRepository,
                       PasswordResetTokenRepository passwordResetTokenRepository,
                       HeroRepository heroRepository,
                       HeroTemplateRepository heroTemplateRepository,
                       TeamSlotRepository teamSlotRepository,
                       PasswordEncoder passwordEncoder,
                       JwtUtil jwtUtil,
                       EmailService emailService) {
        this.playerRepository = playerRepository;
        this.tokenRepository = tokenRepository;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.heroRepository = heroRepository;
        this.heroTemplateRepository = heroTemplateRepository;
        this.teamSlotRepository = teamSlotRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.emailService = emailService;
    }

    @Transactional
    public void register(RegisterRequest request) {
        // Validate
        if (request.getEmail() == null || request.getEmail().isBlank()) {
            throw new IllegalArgumentException("Email is required.");
        }
        if (request.getUsername() == null || request.getUsername().length() < 3 || request.getUsername().length() > 30) {
            throw new IllegalArgumentException("Username must be between 3 and 30 characters.");
        }
        if (request.getPassword() == null || request.getPassword().length() < 6) {
            throw new IllegalArgumentException("Password must be at least 6 characters.");
        }
        if (playerRepository.existsByEmail(request.getEmail())) {
            throw new AuthException("EMAIL_TAKEN", "An account with this email already exists.");
        }
        if (playerRepository.existsByUsername(request.getUsername())) {
            throw new AuthException("USERNAME_TAKEN", "This username is already in use.");
        }

        // Create player
        Player player = new Player();
        player.setEmail(request.getEmail());
        player.setUsername(request.getUsername());
        player.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        playerRepository.save(player);

        // Create confirmation token
        String tokenValue = UUID.randomUUID().toString();
        ConfirmationToken token = new ConfirmationToken();
        token.setToken(tokenValue);
        token.setPlayerId(player.getId());
        token.setExpiresAt(LocalDateTime.now().plusHours(24));
        tokenRepository.save(token);

        // Send email
        emailService.sendConfirmationEmail(player.getEmail(), player.getUsername(), tokenValue);
    }

    @Transactional
    public boolean confirm(String tokenValue) {
        ConfirmationToken token = tokenRepository.findByToken(tokenValue)
                .orElseThrow(() -> new AuthException("INVALID_TOKEN",
                        "This confirmation link is invalid or has expired. Please request a new one."));

        // Idempotent: if already confirmed, return success
        if (token.getConfirmedAt() != null) {
            Player player = playerRepository.findById(token.getPlayerId()).orElse(null);
            if (player != null && player.isEmailConfirmed()) {
                return true;
            }
            throw new AuthException("INVALID_TOKEN",
                    "This confirmation link has already been used.");
        }

        if (token.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new AuthException("INVALID_TOKEN",
                    "This confirmation link is invalid or has expired. Please request a new one.");
        }

        // Mark token as used
        token.setConfirmedAt(LocalDateTime.now());
        tokenRepository.save(token);

        // Confirm player
        Player player = playerRepository.findById(token.getPlayerId())
                .orElseThrow(() -> new AuthException("INVALID_TOKEN", "Player not found."));
        player.setEmailConfirmed(true);
        playerRepository.save(player);

        // Create starter hero (Konohamaru-Genin)
        HeroTemplate starterTemplate = heroTemplateRepository.findByIsStarterTrue()
                .orElseThrow(() -> new RuntimeException("Starter hero template not found in database."));

        if (starterTemplate.getImagePath() != null) {
            player.getUnlockedAvatars().add(starterTemplate.getImagePath());
            playerRepository.save(player);
        }

        Hero starterHero = new Hero();
        starterHero.setPlayerId(player.getId());
        starterHero.setTemplateId(starterTemplate.getId());
        starterHero.setLevel(1);
        starterHero.setCurrentXp(0);
        heroRepository.save(starterHero);

        // Equip starter hero to team slot 1
        TeamSlot slot = new TeamSlot();
        slot.setPlayerId(player.getId());
        slot.setSlotNumber(1);
        slot.setHeroId(starterHero.getId());
        teamSlotRepository.save(slot);

        return false;
    }

    @Transactional
    public LoginResponse login(LoginRequest request) {
        Player player = playerRepository.findByEmailOrUsername(request.getLogin(), request.getLogin())
                .orElseThrow(() -> new AuthException("INVALID_CREDENTIALS",
                        "Invalid email/username or password."));

        if (!passwordEncoder.matches(request.getPassword(), player.getPasswordHash())) {
            throw new AuthException("INVALID_CREDENTIALS",
                    "Invalid email/username or password.");
        }

        if (!player.isEmailConfirmed()) {
            throw new AuthException("EMAIL_NOT_CONFIRMED",
                    "Please confirm your email before logging in.");
        }

        if (player.isBanned()) {
            throw new AuthException("BANNED",
                    "Your account has been banned.");
        }

        // Grant 20 minutes of online status if inactive for 3+ hours
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime onlineUntil = player.getOnlineUntil();
        if (onlineUntil == null || onlineUntil.isBefore(now.minusHours(3))) {
            player.setOnlineUntil(now.plusMinutes(20));
            playerRepository.save(player);
        }

        String token = jwtUtil.generateToken(player.getId(), player.getUsername());
        return new LoginResponse(token, player.getId(), player.getUsername());
    }

    @Transactional
    public void resendConfirmation(String email) {
        playerRepository.findByEmail(email).ifPresent(player -> {
            if (!player.isEmailConfirmed()) {
                // Delete old token
                tokenRepository.deleteByPlayerId(player.getId());

                // Create new token
                String tokenValue = UUID.randomUUID().toString();
                ConfirmationToken token = new ConfirmationToken();
                token.setToken(tokenValue);
                token.setPlayerId(player.getId());
                token.setExpiresAt(LocalDateTime.now().plusHours(24));
                tokenRepository.save(token);

                emailService.sendConfirmationEmail(player.getEmail(), player.getUsername(), tokenValue);
            }
        });
        // Always silently succeed to prevent email enumeration
    }

    @Transactional
    public void forgotPassword(String email) {
        playerRepository.findByEmail(email).ifPresent(player -> {
            if (!player.isEmailConfirmed()) return;

            // Invalidate any existing reset token
            passwordResetTokenRepository.deleteByPlayerId(player.getId());

            String tokenValue = UUID.randomUUID().toString();
            PasswordResetToken resetToken = new PasswordResetToken();
            resetToken.setToken(tokenValue);
            resetToken.setPlayerId(player.getId());
            resetToken.setExpiresAt(LocalDateTime.now().plusHours(1));
            passwordResetTokenRepository.save(resetToken);

            emailService.sendPasswordResetEmail(player.getEmail(), player.getUsername(), tokenValue);
        });
        // Always silently succeed to prevent email enumeration
    }

    @Transactional
    public void resetPassword(String tokenValue, String newPassword) {
        if (newPassword == null || newPassword.length() < 6) {
            throw new AuthException("INVALID_PASSWORD", "Password must be at least 6 characters.");
        }

        PasswordResetToken resetToken = passwordResetTokenRepository.findByToken(tokenValue)
                .orElseThrow(() -> new AuthException("INVALID_TOKEN",
                        "This reset link is invalid or has already been used."));

        if (resetToken.getUsedAt() != null) {
            throw new AuthException("INVALID_TOKEN", "This reset link has already been used.");
        }
        if (resetToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new AuthException("INVALID_TOKEN", "This reset link has expired. Please request a new one.");
        }

        Player player = playerRepository.findById(resetToken.getPlayerId())
                .orElseThrow(() -> new AuthException("INVALID_TOKEN", "Player not found."));

        player.setPasswordHash(passwordEncoder.encode(newPassword));
        playerRepository.save(player);

        resetToken.setUsedAt(LocalDateTime.now());
        passwordResetTokenRepository.save(resetToken);
    }

    // Custom exception for auth errors
    public static class AuthException extends RuntimeException {
        private final String errorCode;

        public AuthException(String errorCode, String message) {
            super(message);
            this.errorCode = errorCode;
        }

        public String getErrorCode() {
            return errorCode;
        }
    }
}
