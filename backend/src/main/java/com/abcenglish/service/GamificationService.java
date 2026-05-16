package com.abcenglish.service;

import com.abcenglish.entity.*;
import com.abcenglish.entity.UserBadge;
import com.abcenglish.entity.UserChallenge;
import com.abcenglish.repository.*;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class GamificationService {

    private final UserBadgeRepository userBadgeRepository;
    private final QuizResultRepository quizResultRepository;
    private final UserProgressRepository userProgressRepository;
    private final UserRepository userRepository;

    public GamificationService(UserBadgeRepository userBadgeRepository,
                            QuizResultRepository quizResultRepository,
                            UserProgressRepository userProgressRepository,
                            UserRepository userRepository) {
        this.userBadgeRepository = userBadgeRepository;
        this.quizResultRepository = quizResultRepository;
        this.userProgressRepository = userProgressRepository;
        this.userRepository = userRepository;
    }

    public Map<String, Object> getUserStats(Long userId) {
        Map<String, Object> stats = new LinkedHashMap<>();

        List<QuizResult> results = quizResultRepository.findByUserId(userId);

        double totalPoints = results.stream().mapToDouble(QuizResult::getScore).sum();
        int totalExercises = results.size();
        int currentLevel = calculateLevel(totalPoints);

        // XP needed for next level
        int currentLevelXP = getXPForLevel(currentLevel);
        int nextLevelXP = getXPForLevel(currentLevel + 1);
        int pointsToNextLevel = nextLevelXP - (int) totalPoints;

        int streak = calculateStreak(userId);

        stats.put("totalPoints", (int) totalPoints);
        stats.put("currentLevel", currentLevel);
        stats.put("pointsToNextLevel", Math.max(0, pointsToNextLevel));
        stats.put("streak", streak);
        stats.put("totalExercises", totalExercises);

        // Total time spent (estimate based on exercises)
        int totalMinutes = totalExercises * 10;
        stats.put("totalMinutes", totalMinutes);

        return stats;
    }

    public List<Map<String, Object>> getAllBadges(Long userId) {
        List<Map<String, Object>> allBadges = new ArrayList<>();

        // Define all available badges
        List<Map<String, String>> badgeDefinitions = List.of(
            Map.of("id", "first_steps", "name", "First Steps", "description", "Hoàn thành bài học đầu tiên", "icon", "🎯", "rarity", "COMMON"),
            Map.of("id", "vocab_master", "name", "Vocabulary Master", "description", "Học 50 từ vựng mới", "icon", "📚", "rarity", "RARE"),
            Map.of("id", "week_warrior", "name", "Week Warrior", "description", "Hoàn thành streak 7 ngày", "icon", "🔥", "rarity", "EPIC"),
            Map.of("id", "grammar_guru", "name", "Grammar Guru", "description", "Đạt 100% 5 bài ngữ pháp", "icon", "🏆", "rarity", "LEGENDARY"),
            Map.of("id", "early_bird", "name", "Early Bird", "description", "Học bài vào buổi sáng", "icon", "🌅", "rarity", "COMMON"),
            Map.of("id", "night_owl", "name", "Night Owl", "description", "Học bài vào ban đêm", "icon", "🦉", "rarity", "COMMON"),
            Map.of("id", "perfect_score", "name", "Perfect Score", "description", "Đạt điểm tuyệt đối", "icon", "💯", "rarity", "RARE"),
            Map.of("id", "speed_learner", "name", "Speed Learner", "description", "Hoàn thành 10 bài trong 1 giờ", "icon", "⚡", "rarity", "EPIC"),
            Map.of("id", "persistent", "name", "Persistent", "description", "Học liên tục 30 ngày", "icon", "💪", "rarity", "LEGENDARY"),
            Map.of("id", "social_learner", "name", "Social Learner", "description", "Tham gia diễn đàn", "icon", "👥", "rarity", "COMMON")
        );

        List<String> earnedBadgeIds = userBadgeRepository.findByUserId(userId).stream()
                .map(UserBadge::getBadgeId)
                .collect(Collectors.toList());

        for (Map<String, String> def : badgeDefinitions) {
            Map<String, Object> badge = new LinkedHashMap<>();
            badge.put("id", def.get("id"));
            badge.put("name", def.get("name"));
            badge.put("description", def.get("description"));
            badge.put("icon", def.get("icon"));
            badge.put("rarity", def.get("rarity"));

            boolean earned = earnedBadgeIds.contains(def.get("id"));
            badge.put("earned", earned);

            if (earned) {
                UserBadge ub = userBadgeRepository.findByUserIdAndBadgeId(userId, def.get("id")).orElse(null);
                badge.put("earnedAt", ub != null && ub.getEarnedAt() != null ? ub.getEarnedAt().toLocalDate().toString() : null);
            }

            allBadges.add(badge);
        }

        return allBadges;
    }

    public List<Map<String, Object>> getUserBadges(Long userId) {
        return userBadgeRepository.findByUserIdOrderByEarnedAtDesc(userId).stream()
                .map(ub -> {
                    Map<String, Object> badge = new LinkedHashMap<>();
                    badge.put("id", ub.getBadgeId());
                    badge.put("name", ub.getBadgeName());
                    badge.put("icon", ub.getIcon());
                    badge.put("earnedAt", ub.getEarnedAt() != null ? ub.getEarnedAt().toLocalDate().toString() : null);
                    return badge;
                })
                .collect(Collectors.toList());
    }

    public List<Map<String, Object>> getLeaderboard(int limit) {
        List<Map<String, Object>> leaderboard = new ArrayList<>();

        // Get all students and calculate their points
        List<User> students = userRepository.findByRole(User.Role.STUDENT);
        List<Map<String, Object>> ranked = students.stream()
                .map(u -> {
                    List<QuizResult> results = quizResultRepository.findByUserId(u.getId());
                    double totalPoints = results.stream().mapToDouble(QuizResult::getScore).sum();

                    Map<String, Object> entry = new LinkedHashMap<>();
                    entry.put("userId", u.getId());
                    entry.put("username", u.getUsername());
                    entry.put("fullName", u.getFullName() != null ? u.getFullName() : u.getUsername());
                    entry.put("points", (int) totalPoints);
                    entry.put("avatar", getAvatarForRank(0)); // placeholder
                    entry.put("level", u.getLevel() != null ? u.getLevel().name() : "A1");
                    return entry;
                })
                .sorted((a, b) -> {
                    int pointsA = (int) a.get("points");
                    int pointsB = (int) b.get("points");
                    return Integer.compare(pointsB, pointsA);
                })
                .limit(limit)
                .collect(Collectors.toList());

        // Add rank
        for (int i = 0; i < ranked.size(); i++) {
            Map<String, Object> entry = ranked.get(i);
            entry.put("rank", i + 1);
            entry.put("avatar", getAvatarForRank(i + 1));
            leaderboard.add(entry);
        }

        return leaderboard;
    }

    public Map<String, Object> getStreak(Long userId) {
        int currentStreak = calculateStreak(userId);
        int longestStreak = currentStreak; // simplified
        int totalDays = userBadgeRepository.findByUserId(userId).size();

        Map<String, Object> streak = new LinkedHashMap<>();
        streak.put("currentStreak", currentStreak);
        streak.put("longestStreak", longestStreak);
        streak.put("totalDays", totalDays);
        streak.put("lastActivityDate", LocalDate.now().toString());
        streak.put("todayCompleted", isTodayCompleted(userId));

        return streak;
    }

    public void checkAndAwardBadges(Long userId) {
        List<QuizResult> results = quizResultRepository.findByUserId(userId);
        double totalPoints = results.stream().mapToDouble(QuizResult::getScore).sum();

        // First Steps badge
        if (results.size() >= 1 && !userBadgeRepository.existsByUserIdAndBadgeId(userId, "first_steps")) {
            awardBadge(userId, "first_steps", "First Steps", "🎯", "COMMON");
        }

        // Perfect Score badge
        if (results.stream().anyMatch(r -> r.getScore() == 10.0) && !userBadgeRepository.existsByUserIdAndBadgeId(userId, "perfect_score")) {
            awardBadge(userId, "perfect_score", "Perfect Score", "💯", "RARE");
        }

        // Vocabulary Master badge
        if (results.size() >= 50 && !userBadgeRepository.existsByUserIdAndBadgeId(userId, "vocab_master")) {
            awardBadge(userId, "vocab_master", "Vocabulary Master", "📚", "RARE");
        }
    }

    private void awardBadge(Long userId, String badgeId, String name, String icon, String rarity) {
        UserBadge badge = new UserBadge(userId, badgeId, name, icon, rarity);
        userBadgeRepository.save(badge);
    }

    private int calculateLevel(double points) {
        if (points < 50) return 1;
        if (points < 150) return 2;
        if (points < 300) return 3;
        if (points < 500) return 4;
        if (points < 800) return 5;
        if (points < 1200) return 6;
        if (points < 1700) return 7;
        if (points < 2300) return 8;
        if (points < 3000) return 9;
        return 10;
    }

    private int getXPForLevel(int level) {
        int[] xpThresholds = {0, 50, 150, 300, 500, 800, 1200, 1700, 2300, 3000};
        if (level <= 0) return 0;
        if (level > 10) return 5000;
        return xpThresholds[level - 1];
    }

    private int calculateStreak(Long userId) {
        // This would normally check daily challenge completions
        // For now, return based on recent activity
        List<QuizResult> results = quizResultRepository.findByUserId(userId);
        if (results.isEmpty()) return 0;

        LocalDateTime lastActivity = results.stream()
                .map(QuizResult::getCompletedAt)
                .filter(Objects::nonNull)
                .max(LocalDateTime::compareTo)
                .orElse(null);

        if (lastActivity == null) return 0;

        long daysSince = java.time.temporal.ChronoUnit.DAYS.between(lastActivity.toLocalDate(), LocalDate.now());
        if (daysSince > 1) return 0;

        return (int) Math.min(7, results.size());
    }

    private boolean isTodayCompleted(Long userId) {
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        return quizResultRepository.findByUserId(userId).stream()
                .anyMatch(r -> r.getCompletedAt() != null && r.getCompletedAt().isAfter(startOfDay));
    }

    private String getAvatarForRank(int rank) {
        return switch (rank) {
            case 1 -> "🥇";
            case 2 -> "🥈";
            case 3 -> "🥉";
            default -> rank <= 10 ? (rank + "️⃣") : "🎖️";
        };
    }
}
