package com.abcenglish.controller;

import com.abcenglish.dto.ApiResponse;
import com.abcenglish.service.LeaderboardService;
import com.abcenglish.service.JwtService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ranking")
@CrossOrigin(origins = "*")
public class RankingController {

    private final LeaderboardService leaderboardService;
    private final JwtService jwtService;

    public RankingController(LeaderboardService leaderboardService, JwtService jwtService) {
        this.leaderboardService = leaderboardService;
        this.jwtService = jwtService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getRanking(
            @RequestParam(defaultValue = "all") String period,
            @RequestParam(defaultValue = "10") int limit,
            @RequestParam(required = false) String level) {
        return ResponseEntity.ok(ApiResponse.ok(
                leaderboardService.getLeaderboard(period, level, limit)));
    }

    @GetMapping("/my-rank")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getMyRank(
            @RequestParam(defaultValue = "all") String period,
            HttpServletRequest request) {
        Long userId = jwtService.extractUserId(request);
        if (userId == null) return ResponseEntity.status(401).body(ApiResponse.error("Authentication required"));
        Map<String, Object> rank = leaderboardService.getMyRank(userId, period);
        return ResponseEntity.ok(ApiResponse.ok(rank));
    }

    @GetMapping("/daily")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getDailyRanking(
            @RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(ApiResponse.ok(leaderboardService.getDailyLeaderboard(limit)));
    }

    @GetMapping("/weekly")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getWeeklyRanking(
            @RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(ApiResponse.ok(leaderboardService.getWeeklyLeaderboard(limit)));
    }

    @GetMapping("/level/{level}")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getRankingByLevel(
            @PathVariable String level,
            @RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(ApiResponse.ok(
                leaderboardService.getLeaderboard("all", level, limit)));
    }
}
