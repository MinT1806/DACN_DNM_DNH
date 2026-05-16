package com.abcenglish.service;

import com.abcenglish.entity.*;
import com.abcenglish.repository.*;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class LeaderboardService {

    private final QuizResultRepository quizResultRepository;
    private final UserProgressRepository progressRepository;
    private final UserBadgeRepository badgeRepository;
    private final UserRepository userRepository;

    public LeaderboardService(QuizResultRepository quizResultRepository,
                              UserProgressRepository progressRepository,
                              UserBadgeRepository badgeRepository,
                              UserRepository userRepository) {
        this.quizResultRepository = quizResultRepository;
        this.progressRepository = progressRepository;
        this.badgeRepository = badgeRepository;
        this.userRepository = userRepository;
    }

    public List<Map<String, Object>> getLeaderboard(String period, String level, int limit) {
        LocalDateTime since = getSinceDate(period);
        List<User> users = userRepository.findByRole(User.Role.STUDENT);

        return users.stream()
                .filter(u -> level == null || level.isEmpty() ||
                        (u.getLevel() != null && u.getLevel().name().equalsIgnoreCase(level)))
                .map(u -> buildEntry(u, since))
                .filter(e -> (int) e.get("points") > 0)
                .sorted((a, b) -> Integer.compare((int) b.get("points"), (int) a.get("points")))
                .limit(limit)
                .collect(Collectors.toList());
    }

    public Map<String, Object> getMyRank(Long userId, String period) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) return null;

        LocalDateTime since = getSinceDate(period);

        // Calculate user's points directly (avoid full leaderboard computation)
        List<QuizResult> userResults = quizResultRepository.findByUserId(userId).stream()
                .filter(r -> since == null || (r.getCompletedAt() != null && r.getCompletedAt().isAfter(since)))
                .toList();
        int userPoints = (int) Math.round(userResults.stream().mapToDouble(QuizResult::getScore).sum());

        // Count how many users have strictly more points (more efficient than full leaderboard)
        List<User> allStudents = userRepository.findByRole(User.Role.STUDENT);
        int rank = 0;
        for (User other : allStudents) {
            List<QuizResult> otherResults = quizResultRepository.findByUserId(other.getId()).stream()
                    .filter(r -> since == null || (r.getCompletedAt() != null && r.getCompletedAt().isAfter(since)))
                    .toList();
            int otherPoints = (int) Math.round(otherResults.stream().mapToDouble(QuizResult::getScore).sum());
            if (otherPoints > userPoints) {
                rank++;
            }
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("userId", userId);
        result.put("rank", rank + 1);
        result.put("points", userPoints);
        result.put("totalParticipants", allStudents.size());
        result.put("level", user.getLevel() != null ? user.getLevel().name() : "A1");
        result.put("period", period);
        return result;
    }

    private Map<String, Object> buildEntry(User user, LocalDateTime since) {
        Long uid = user.getId();
        List<QuizResult> results = quizResultRepository.findByUserId(uid).stream()
                .filter(r -> since == null || (r.getCompletedAt() != null && r.getCompletedAt().isAfter(since)))
                .toList();

        double totalScore = results.stream().mapToDouble(QuizResult::getScore).sum();
        int points = (int) Math.round(totalScore * 10);
        int quizCount = results.size();
        double avgScore = quizCount > 0 ? totalScore / quizCount : 0;

        List<UserProgress> completedProgress = progressRepository.findByUserIdAndCompletedTrueOrderByCompletedAtDesc(uid).stream()
                .filter(p -> since == null || (p.getCompletedAt() != null && p.getCompletedAt().isAfter(since)))
                .toList();
        int lessonCount = completedProgress.size();
        int badgeCount = badgeRepository.findByUserId(uid).size();

        int xpTotal = points + lessonCount * 10 + badgeCount * 20;
        int xpForLevel = xpTotal % 100;
        int progressPercent = Math.min(100, xpForLevel);

        Map<String, Object> entry = new LinkedHashMap<>();
        entry.put("userId", uid);
        entry.put("username", user.getUsername());
        entry.put("fullName", user.getFullName() != null ? user.getFullName() : user.getUsername());
        entry.put("avatar", user.getAvatarUrl());
        entry.put("level", user.getLevel() != null ? user.getLevel().name() : "A1");
        entry.put("totalPoints", xpTotal);
        entry.put("points", points);
        entry.put("quizCount", quizCount);
        entry.put("testCount", 0);
        entry.put("lessonCount", lessonCount);
        entry.put("avgScore", Math.round(avgScore * 10.0) / 10.0);
        entry.put("badgeCount", badgeCount);
        entry.put("xpToNextLevel", 100 - xpForLevel);
        entry.put("progressPercent", progressPercent);
        return entry;
    }

    private LocalDateTime getSinceDate(String period) {
        if (period == null || "all".equalsIgnoreCase(period)) return null;
        LocalDate today = LocalDate.now();
        return switch (period.toLowerCase()) {
            case "daily", "day" -> today.atStartOfDay();
            case "weekly", "week" -> today.minusDays(7).atStartOfDay();
            case "monthly", "month" -> today.minusDays(30).atStartOfDay();
            default -> null;
        };
    }

    public List<Map<String, Object>> getDailyLeaderboard(int limit) {
        return getLeaderboard("daily", null, limit);
    }

    public List<Map<String, Object>> getWeeklyLeaderboard(int limit) {
        return getLeaderboard("weekly", null, limit);
    }

    public List<Map<String, Object>> getContestRanking(LocalDate startDate, LocalDate endDate, int limit) {
        List<User> users = userRepository.findByRole(User.Role.STUDENT);
        LocalDateTime since = startDate.atStartOfDay();
        LocalDateTime until = endDate.plusDays(1).atStartOfDay();

        return users.stream()
                .map(u -> {
                    List<QuizResult> results = quizResultRepository.findByUserId(u.getId()).stream()
                            .filter(r -> r.getCompletedAt() != null &&
                                    !r.getCompletedAt().isBefore(since) &&
                                    r.getCompletedAt().isBefore(until))
                            .toList();
                    int points = results.stream().mapToInt(r -> (int) Math.round(r.getScore() * 10)).sum();
                    int lessonCount = progressRepository.findByUserIdAndCompletedTrueOrderByCompletedAtDesc(u.getId()).stream()
                            .filter(p -> p.getCompletedAt() != null &&
                                    !p.getCompletedAt().isBefore(since) &&
                                    p.getCompletedAt().isBefore(until))
                            .toList().size();

                    Map<String, Object> entry = new LinkedHashMap<>();
                    entry.put("userId", u.getId());
                    entry.put("username", u.getUsername());
                    entry.put("fullName", u.getFullName() != null ? u.getFullName() : u.getUsername());
                    entry.put("avatar", u.getAvatarUrl());
                    entry.put("level", u.getLevel() != null ? u.getLevel().name() : "A1");
                    entry.put("totalPoints", points);
                    entry.put("quizCount", results.size());
                    entry.put("lessonCount", lessonCount);
                    return entry;
                })
                .filter(e -> (int) e.get("totalPoints") > 0)
                .sorted((a, b) -> Integer.compare((int) b.get("totalPoints"), (int) a.get("totalPoints")))
                .limit(limit)
                .collect(Collectors.toList());
    }
}
