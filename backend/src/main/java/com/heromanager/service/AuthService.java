package com.heromanager.service;

import com.heromanager.dto.*;
import com.heromanager.entity.*;
import com.heromanager.repository.*;
import com.heromanager.util.JwtUtil;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class AuthService {

    private final PlayerRepository playerRepository;
    private final ConfirmationTokenRepository tokenRepository;
    private final HeroRepository heroRepository;
    private final HeroTemplateRepository heroTemplateRepository;
    private final TeamSlotRepository teamSlotRepository;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthService(PlayerRepository playerRepository,
                       ConfirmationTokenRepository tokenRepository,
                       HeroRepository heroRepository,
                       HeroTemplateRepository heroTemplateRepository,
                       TeamSlotRepository teamSlotRepository,
                       EmailService emailService,
                       PasswordEncoder passwordEncoder,
                       JwtUtil jwtUtil) {
        this.playerRepository = playerRepository;
        this.tokenRepository = tokenRepository;
        this.heroRepository = heroRepository;
        this.heroTemplateRepository = heroTemplateRepository;
        this.teamSlotRepository = teamSlotRepository;
        this.emailService = emailService;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    @Transactional
    public Map<String, Object> register(RegisterRequest request) {
        if (playerRepository.existsByEmail(request.getEmail())) {
            return Map.of("error", "EMAIL_TAKEN", "message", "An account with this email already exists.");
        }
        if (playerRepository.existsByUsername(request.getUsername())) {
            return Map.of("error", "USERNAME_TAKEN", "message", "This username is already in use.");
        }

        Player player = Player.builder()
                .email(request.getEmail())
                .username(request.getUsername())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .build();
        player = playerRepository.save(player);

        String tokenValue = UUID.randomUUID().toString();
        ConfirmationToken token = ConfirmationToken.builder()
                .token(tokenValue)
                .playerId(player.getId())
                .expiresAt(LocalDateTime.now().plusHours(24))
                .build();
        tokenRepository.save(token);

        emailService.sendConfirmationEmail(player.getEmail(), player.getUsername(), tokenValue);

        return Map.of("message", "Registration successful. Please check your email to confirm your account.");
    }

    @Transactional
    public Map<String, Object> confirm(String tokenValue) {
        Optional<ConfirmationToken> optToken = tokenRepository.findByToken(tokenValue);
        if (optToken.isEmpty()) {
            return Map.of("error", "INVALID_TOKEN", "message", "This confirmation link is invalid or has expired. Please request a new one.");
        }

        ConfirmationToken token = optToken.get();
        if (token.getConfirmedAt() != null) {
            return Map.of("error", "INVALID_TOKEN", "message", "This confirmation link has already been used.");
        }
        if (token.getExpiresAt().isBefore(LocalDateTime.now())) {
            return Map.of("error", "INVALID_TOKEN", "message", "This confirmation link is invalid or has expired. Please request a new one.");
        }

        token.setConfirmedAt(LocalDateTime.now());
        tokenRepository.save(token);

        Player player = playerRepository.findById(token.getPlayerId()).orElseThrow();
        player.setEmailConfirmed(true);
        playerRepository.save(player);

        // Create starter hero (Konohamaru-Genin) and equip to slot 1
        HeroTemplate starter = heroTemplateRepository.findByIsStarterTrue()
                .orElseThrow(() -> new RuntimeException("Starter hero template not found"));

        Hero hero = Hero.builder()
                .playerId(player.getId())
                .templateId(starter.getId())
                .build();
        hero = heroRepository.save(hero);

        TeamSlot slot = TeamSlot.builder()
                .playerId(player.getId())
                .slotNumber(1)
                .heroId(hero.getId())
                .build();
        teamSlotRepository.save(slot);

        return Map.of("message", "Email confirmed successfully. You can now log in.");
    }

    public Object login(LoginRequest request) {
        Optional<Player> optPlayer = playerRepository.findByEmailOrUsername(request.getLogin(), request.getLogin());

        if (optPlayer.isEmpty() || !passwordEncoder.matches(request.getPassword(), optPlayer.get().getPasswordHash())) {
            return Map.of("error", "INVALID_CREDENTIALS", "message", "Invalid email/username or password.");
        }

        Player player = optPlayer.get();
        if (!player.getEmailConfirmed()) {
            return Map.of("error", "EMAIL_NOT_CONFIRMED", "message", "Please confirm your email before logging in.");
        }

        String token = jwtUtil.generateToken(player.getId(), player.getUsername());
        return new LoginResponse(token, player.getId(), player.getUsername());
    }

    @Transactional
    public Map<String, String> resendConfirmation(String email) {
        Optional<Player> optPlayer = playerRepository.findByEmail(email);
        if (optPlayer.isPresent() && !optPlayer.get().getEmailConfirmed()) {
            Player player = optPlayer.get();

            // Delete old token if exists
            tokenRepository.findByPlayerId(player.getId()).ifPresent(tokenRepository::delete);

            String tokenValue = UUID.randomUUID().toString();
            ConfirmationToken token = ConfirmationToken.builder()
                    .token(tokenValue)
                    .playerId(player.getId())
                    .expiresAt(LocalDateTime.now().plusHours(24))
                    .build();
            tokenRepository.save(token);

            emailService.sendConfirmationEmail(player.getEmail(), player.getUsername(), tokenValue);
        }

        return Map.of("message", "If an unconfirmed account exists for this email, a new confirmation link has been sent.");
    }
}
