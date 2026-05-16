package com.abcenglish.controller;

import com.abcenglish.dto.ApiResponse;
import com.abcenglish.service.DashboardService;
import com.abcenglish.service.JwtService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
@CrossOrigin(origins = "*")
@Slf4j
public class DashboardController {

    private final DashboardService dashboardService;
    private final JwtService jwtService;

    public DashboardController(DashboardService dashboardService, JwtService jwtService) {
        this.dashboardService = dashboardService;
        this.jwtService = jwtService;
    }

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getStats(
            HttpServletRequest request
    ) {
        try {
            Long userId = jwtService.extractUserId(request);
            if (userId == null) {
                return ResponseEntity.status(401).body(ApiResponse.error("Authentication required"));
            }

            log.info("Dashboard stats requested for userId={}", userId);

            Map<String, Object> stats = dashboardService.getDashboardData(userId);
            return ResponseEntity.ok(ApiResponse.ok(stats));
        } catch (Exception e) {
            log.error("Error fetching dashboard stats: {}", e.getMessage(), e);
            return ResponseEntity.ok(ApiResponse.error(e.getMessage()));
        }
    }
}
