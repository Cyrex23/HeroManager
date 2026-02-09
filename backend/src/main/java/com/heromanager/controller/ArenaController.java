package com.heromanager.controller;

import com.heromanager.dto.BattleResultResponse;
import com.heromanager.service.ArenaService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/arena")
public class ArenaController {

    private final ArenaService arenaService;

    public ArenaController(ArenaService arenaService) {
        this.arenaService = arenaService;
    }

    private Long getPlayerId() {
        return (Long) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }

    @GetMapping("/opponents")
    public ResponseEntity<?> getOpponents(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(arenaService.listOpponents(getPlayerId(), page, size));
    }

    @PostMapping("/challenge")
    public ResponseEntity<?> challenge(@RequestBody Map<String, Object> body) {
        Long defenderId = ((Number) body.get("defenderId")).longValue();
        Object result = arenaService.initiateChallenge(getPlayerId(), defenderId);
        if (result instanceof BattleResultResponse) {
            return ResponseEntity.ok(result);
        }
        Map<String, Object> errorMap = (Map<String, Object>) result;
        return ResponseEntity.badRequest().body(errorMap);
    }

    @GetMapping("/battle-log")
    public ResponseEntity<?> getBattleLog(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(arenaService.getBattleLog(getPlayerId(), page, size));
    }

    @GetMapping("/battle/{battleId}")
    public ResponseEntity<?> getBattle(@PathVariable Long battleId) {
        Object result = arenaService.getBattle(getPlayerId(), battleId);
        if (result instanceof BattleResultResponse) {
            return ResponseEntity.ok(result);
        }
        Map<String, Object> errorMap = (Map<String, Object>) result;
        if ("NOT_FOUND".equals(errorMap.get("error"))) {
            return ResponseEntity.status(404).body(errorMap);
        }
        return ResponseEntity.badRequest().body(errorMap);
    }
}
