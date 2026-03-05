package com.heromanager.controller;

import com.heromanager.service.UpgradeService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(UpgradeService.UpgradeException.class)
    public ResponseEntity<Map<String, String>> handleUpgradeException(UpgradeService.UpgradeException e) {
        return ResponseEntity.status(400).body(Map.of("error", e.getCode(), "message", e.getMessage()));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> handleException(Exception e) {
        String message = e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName();
        return ResponseEntity.status(500).body(Map.of(
            "error", "INTERNAL_ERROR",
            "message", message
        ));
    }
}
