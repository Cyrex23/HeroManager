package com.heromanager.controller;

import com.heromanager.dto.DashboardResponse;
import com.heromanager.service.DashboardService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/{playerId}")
    public ResponseEntity<DashboardResponse> getDashboard(@PathVariable Long playerId) {
        return ResponseEntity.ok(dashboardService.getDashboard(playerId));
    }
}
