package com.heromanager.controller;

import com.heromanager.service.ChatService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private final ChatService chatService;

    public ChatController(ChatService chatService) {
        this.chatService = chatService;
    }

    @GetMapping("/general")
    public ResponseEntity<?> getGeneral(Authentication auth,
                                        @RequestParam(defaultValue = "0") Long since) {
        Long playerId = (Long) auth.getPrincipal();
        return ResponseEntity.ok(chatService.getGeneralMessages(playerId, since));
    }

    @PostMapping("/general")
    public ResponseEntity<?> sendGeneral(Authentication auth,
                                         @RequestBody Map<String, String> body) {
        Long playerId = (Long) auth.getPrincipal();
        try {
            return ResponseEntity.ok(chatService.sendGeneral(playerId, body.get("content")));
        } catch (ChatService.ChatException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getErrorCode(), "message", e.getMessage()));
        }
    }

    @GetMapping("/whisper/{otherId}")
    public ResponseEntity<?> getWhisper(Authentication auth,
                                        @PathVariable Long otherId,
                                        @RequestParam(defaultValue = "0") Long since) {
        Long playerId = (Long) auth.getPrincipal();
        return ResponseEntity.ok(chatService.getWhisperMessages(playerId, otherId, since));
    }

    @PostMapping("/whisper")
    public ResponseEntity<?> sendWhisper(Authentication auth,
                                         @RequestBody Map<String, Object> body) {
        Long playerId = (Long) auth.getPrincipal();
        try {
            Long receiverId = ((Number) body.get("receiverId")).longValue();
            String content = (String) body.get("content");
            return ResponseEntity.ok(chatService.sendWhisper(playerId, receiverId, content));
        } catch (ChatService.ChatException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getErrorCode(), "message", e.getMessage()));
        }
    }

    @GetMapping("/conversations")
    public ResponseEntity<?> getConversations(Authentication auth) {
        Long playerId = (Long) auth.getPrincipal();
        return ResponseEntity.ok(chatService.getConversations(playerId));
    }
}
