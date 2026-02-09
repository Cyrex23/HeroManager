package com.heromanager.controller;

import com.heromanager.dto.LoginRequest;
import com.heromanager.dto.LoginResponse;
import com.heromanager.dto.RegisterRequest;
import com.heromanager.service.AuthService;
import jakarta.validation.Valid;
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
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        Map<String, Object> result = authService.register(request);
        if (result.containsKey("error")) {
            return ResponseEntity.badRequest().body(result);
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }

    @GetMapping("/confirm")
    public ResponseEntity<?> confirm(@RequestParam String token) {
        Map<String, Object> result = authService.confirm(token);
        if (result.containsKey("error")) {
            return ResponseEntity.badRequest().body(result);
        }
        return ResponseEntity.ok(result);
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        Object result = authService.login(request);
        if (result instanceof LoginResponse) {
            return ResponseEntity.ok(result);
        }
        Map<String, Object> errorMap = (Map<String, Object>) result;
        if ("EMAIL_NOT_CONFIRMED".equals(errorMap.get("error"))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(result);
        }
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(result);
    }

    @PostMapping("/resend-confirmation")
    public ResponseEntity<?> resendConfirmation(@RequestBody Map<String, String> request) {
        return ResponseEntity.ok(authService.resendConfirmation(request.get("email")));
    }
}
