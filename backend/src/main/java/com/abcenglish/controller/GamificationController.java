package com.abcenglish.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/gamification")
@CrossOrigin(origins = "*")
public class GamificationController {

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats(
            @RequestHeader(value = "Authorization", required = false) String authHeader
    ) {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalPoints", 1250);
        stats.put("currentLevel", 5);
        stats.put("pointsToNextLevel", 250);
        stats.put("streak", 7);
        stats.put("totalExercises", 45);
        stats.put("totalMinutes", 1800);
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/badges")
    public ResponseEntity<List<Map<String, Object>>> getAllBadges() {
        List<Map<String, Object>> badges = new ArrayList<>();

        badges.add(Map.of(
            "id", 1,
            "name", "First Steps",
            "description", "Complete your first lesson",
            "icon", "🎯",
            "rarity", "COMMON",
            "earned", true,
            "earnedAt", "2024-01-20"
        ));

        badges.add(Map.of(
            "id", 2,
            "name", "Vocabulary Master",
            "description", "Learn 100 new words",
            "icon", "📚",
            "rarity", "RARE",
            "earned", true,
            "earnedAt", "2024-02-15"
        ));

        badges.add(Map.of(
            "id", 3,
            "name", "Week Warrior",
            "description", "Complete 7-day streak",
            "icon", "🔥",
            "rarity", "EPIC",
            "earned", true,
            "earnedAt", "2024-03-01"
        ));

        badges.add(Map.of(
            "id", 4,
            "name", "Grammar Guru",
            "description", "Score 100% on 5 grammar tests",
            "icon", "🏆",
            "rarity", "LEGENDARY",
            "earned", false,
            "progress", 3
        ));

        return ResponseEntity.ok(badges);
    }

    @GetMapping("/my-badges")
    public ResponseEntity<List<Map<String, Object>>> getMyBadges(
            @RequestHeader(value = "Authorization", required = false) String authHeader
    ) {
        List<Map<String, Object>> badges = new ArrayList<>();

        badges.add(Map.of(
            "id", 1,
            "name", "First Steps",
            "icon", "🎯",
            "earnedAt", "2024-01-20"
        ));

        badges.add(Map.of(
            "id", 2,
            "name", "Vocabulary Master",
            "icon", "📚",
            "earnedAt", "2024-02-15"
        ));

        badges.add(Map.of(
            "id", 3,
            "name", "Week Warrior",
            "icon", "🔥",
            "earnedAt", "2024-03-01"
        ));

        return ResponseEntity.ok(badges);
    }

    @GetMapping("/leaderboard")
    public ResponseEntity<List<Map<String, Object>>> getLeaderboard(
            @RequestParam(defaultValue = "10") int limit
    ) {
        List<Map<String, Object>> leaderboard = new ArrayList<>();

        leaderboard.add(Map.of("rank", 1, "username", "top_learner", "fullName", "Nguyen Van A", "points", 2500, "avatar", "🥇"));
        leaderboard.add(Map.of("rank", 2, "username", "english_pro", "fullName", "Tran Thi B", "points", 2350, "avatar", "🥈"));
        leaderboard.add(Map.of("rank", 3, "username", "fast_learner", "fullName", "Le Van C", "points", 2200, "avatar", "🥉"));
        leaderboard.add(Map.of("rank", 4, "username", "dedicated_student", "fullName", "Pham Thi D", "points", 2100, "avatar", "4️⃣"));
        leaderboard.add(Map.of("rank", 5, "username", "daily_practice", "fullName", "Hoang Van E", "points", 1950, "avatar", "5️⃣"));

        return ResponseEntity.ok(leaderboard);
    }

    @GetMapping("/streak")
    public ResponseEntity<Map<String, Object>> getStreak(
            @RequestHeader(value = "Authorization", required = false) String authHeader
    ) {
        Map<String, Object> streak = new HashMap<>();
        streak.put("currentStreak", 7);
        streak.put("longestStreak", 14);
        streak.put("totalDays", 45);
        streak.put("lastActivityDate", new Date().toString());
        streak.put("todayCompleted", false);
        return ResponseEntity.ok(streak);
    }
}
