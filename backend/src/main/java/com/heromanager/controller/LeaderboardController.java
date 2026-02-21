package com.heromanager.controller;

import com.heromanager.service.LeaderboardService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/leaderboard")
public class LeaderboardController {

    private final LeaderboardService leaderboardService;

    public LeaderboardController(LeaderboardService leaderboardService) {
        this.leaderboardService = leaderboardService;
    }

    @GetMapping("/heroes")
    public ResponseEntity<?> topHeroes() {
        return ResponseEntity.ok(leaderboardService.getTopHeroes());
    }

    @GetMapping("/summons")
    public ResponseEntity<?> topSummons() {
        return ResponseEntity.ok(leaderboardService.getTopSummons());
    }

    @GetMapping("/teams")
    public ResponseEntity<?> topTeams() {
        return ResponseEntity.ok(leaderboardService.getTopTeams());
    }
}
