package com.heromanager.controller;

import com.heromanager.service.AccountService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/account")
public class AccountController {

    private final AccountService accountService;

    public AccountController(AccountService accountService) {
        this.accountService = accountService;
    }

    @GetMapping
    public ResponseEntity<?> getAccount(Authentication auth) {
        Long playerId = (Long) auth.getPrincipal();
        return ResponseEntity.ok(accountService.getAccountData(playerId));
    }

    @PutMapping("/profile-image")
    public ResponseEntity<?> setProfileImage(Authentication auth, @RequestBody Map<String, String> body) {
        Long playerId = (Long) auth.getPrincipal();
        try {
            accountService.setProfileImage(playerId, body.get("imagePath"));
            return ResponseEntity.ok(Map.of("message", "Profile image updated."));
        } catch (AccountService.AccountException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getErrorCode(), "message", e.getMessage()));
        }
    }

    @PutMapping("/team-name")
    public ResponseEntity<?> changeTeamName(Authentication auth, @RequestBody Map<String, String> body) {
        Long playerId = (Long) auth.getPrincipal();
        try {
            accountService.changeTeamName(playerId, body.get("teamName"));
            return ResponseEntity.ok(Map.of("message", "Team name updated."));
        } catch (AccountService.AccountException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getErrorCode(), "message", e.getMessage()));
        }
    }

    @PutMapping("/chat-sound")
    public ResponseEntity<?> setChatSound(Authentication auth, @RequestBody Map<String, Object> body) {
        Long playerId = (Long) auth.getPrincipal();
        try {
            boolean enabled = Boolean.TRUE.equals(body.get("enabled"));
            accountService.setChatSoundEnabled(playerId, enabled);
            return ResponseEntity.ok(Map.of("message", "Chat sound setting updated."));
        } catch (AccountService.AccountException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getErrorCode(), "message", e.getMessage()));
        }
    }

    @PutMapping("/password")
    public ResponseEntity<?> changePassword(Authentication auth, @RequestBody Map<String, String> body) {
        Long playerId = (Long) auth.getPrincipal();
        try {
            accountService.changePassword(playerId, body.get("currentPassword"), body.get("newPassword"));
            return ResponseEntity.ok(Map.of("message", "Password changed successfully."));
        } catch (AccountService.AccountException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getErrorCode(), "message", e.getMessage()));
        }
    }
}
