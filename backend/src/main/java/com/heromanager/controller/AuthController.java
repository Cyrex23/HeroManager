package com.heromanager.controller;

import com.heromanager.dto.LoginRequest;
import com.heromanager.dto.LoginResponse;
import com.heromanager.dto.RegisterRequest;
import com.heromanager.service.AuthService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        try {
            authService.register(request);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(Map.of("message", "Registration successful. Please check your email to confirm your account."));
        } catch (AuthService.AuthException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getErrorCode(), "message", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "VALIDATION_ERROR", "message", e.getMessage()));
        }
    }

    @GetMapping("/confirm")
    public ResponseEntity<?> confirm(@RequestParam String token) {
        try {
            boolean alreadyConfirmed = authService.confirm(token);
            if (alreadyConfirmed) {
                return ResponseEntity.ok(Map.of(
                        "message", "Your email is already confirmed. You can log in.",
                        "alreadyConfirmed", true));
            }
            return ResponseEntity.ok(Map.of(
                    "message", "Email confirmed successfully! You can now log in.",
                    "alreadyConfirmed", false));
        } catch (AuthService.AuthException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getErrorCode(), "message", e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        try {
            LoginResponse response = authService.login(request);
            return ResponseEntity.ok(response);
        } catch (AuthService.AuthException e) {
            HttpStatus status = "EMAIL_NOT_CONFIRMED".equals(e.getErrorCode())
                    ? HttpStatus.FORBIDDEN
                    : HttpStatus.UNAUTHORIZED;
            return ResponseEntity.status(status)
                    .body(Map.of("error", e.getErrorCode(), "message", e.getMessage()));
        }
    }

    @PostMapping("/resend-confirmation")
    public ResponseEntity<?> resendConfirmation(@RequestBody Map<String, String> request) {
        authService.resendConfirmation(request.get("email"));
        return ResponseEntity.ok(Map.of("message",
                "If an unconfirmed account exists for this email, a new confirmation link has been sent."));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> request) {
        authService.forgotPassword(request.get("email"));
        return ResponseEntity.ok(Map.of("message",
                "If an account exists for this email, a password reset link has been sent."));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> request) {
        try {
            authService.resetPassword(request.get("token"), request.get("newPassword"));
            return ResponseEntity.ok(Map.of("message", "Password reset successfully. You can now log in."));
        } catch (AuthService.AuthException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getErrorCode(), "message", e.getMessage()));
        }
    }
}
