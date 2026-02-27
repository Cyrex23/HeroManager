package com.heromanager.controller;

import com.heromanager.service.FriendService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/friends")
public class FriendController {

    private final FriendService friendService;

    public FriendController(FriendService friendService) {
        this.friendService = friendService;
    }

    @GetMapping
    public ResponseEntity<?> listFriends(Authentication auth) {
        Long playerId = (Long) auth.getPrincipal();
        return ResponseEntity.ok(friendService.listFriends(playerId));
    }

    @GetMapping("/search")
    public ResponseEntity<?> search(Authentication auth, @RequestParam String q) {
        Long playerId = (Long) auth.getPrincipal();
        return ResponseEntity.ok(friendService.searchPlayers(playerId, q));
    }

    @PostMapping("/request")
    public ResponseEntity<?> sendRequest(Authentication auth, @RequestBody Map<String, Object> body) {
        Long playerId = (Long) auth.getPrincipal();
        Long receiverId = ((Number) body.get("receiverId")).longValue();
        try {
            friendService.sendRequest(playerId, receiverId);
            return ResponseEntity.ok(Map.of("message", "Friend request sent."));
        } catch (FriendService.FriendException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getErrorCode(), "message", e.getMessage()));
        }
    }

    @PostMapping("/accept")
    public ResponseEntity<?> acceptRequest(Authentication auth, @RequestBody Map<String, Object> body) {
        Long playerId = (Long) auth.getPrincipal();
        Long requesterId = ((Number) body.get("requesterId")).longValue();
        try {
            friendService.acceptRequest(playerId, requesterId);
            return ResponseEntity.ok(Map.of("message", "Friend request accepted."));
        } catch (FriendService.FriendException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getErrorCode(), "message", e.getMessage()));
        }
    }

    @DeleteMapping("/{otherId}")
    public ResponseEntity<?> declineOrDelete(Authentication auth, @PathVariable Long otherId) {
        Long playerId = (Long) auth.getPrincipal();
        try {
            friendService.declineOrDelete(playerId, otherId);
            return ResponseEntity.ok(Map.of("message", "Removed."));
        } catch (FriendService.FriendException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getErrorCode(), "message", e.getMessage()));
        }
    }
}
