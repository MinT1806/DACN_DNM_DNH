package com.abcenglish.service;

import com.abcenglish.entity.*;
import com.abcenglish.repository.*;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class RankingService {

    private final UserRepository userRepository;
    private final QuizResultRepository quizResultRepository;
    private final TestResultRepository testResultRepository;
    private final UserBadgeRepository userBadgeRepository;

    public RankingService(UserRepository userRepository,
                          QuizResultRepository quizResultRepository,
                          TestResultRepository testResultRepository,
                          UserBadgeRepository userBadgeRepository) {
        this.userRepository = userRepository;
        this.quizResultRepository = quizResultRepository;
        this.testResultRepository = testResultRepository;
        this.userBadgeRepository = userBadgeRepository;
    }

    public List<Map<String, Object>> getGlobalRanking(int limit) {
        List<User> students = userRepository.findByRole(User.Role.STUDENT);
        return buildRanking(students, limit, null, null);
    }

    public List<Map<String, Object>> getWeeklyRanking(int limit) {
        LocalDateTime weekAgo = LocalDateTime.now().minusDays(7);
        List<User> students = userRepository.findByRole(User.Role.STUDENT);
        List<User> active = students.stream().filter(u -> {
            boolean quizActive = !quizResultRepository.findByUserIdAndCompletedAtAfter(u.getId(), weekAgo).isEmpty();
            boolean testActive = !testResultRepository.findByUserIdAndCompletedAtAfter(u.getId(), weekAgo).isEmpty();
            return quizActive || testActive;
        }).collect(Collectors.toList());
        return buildRanking(active, limit, weekAgo, null);
    }

    public List<Map<String, Object>> getMonthlyRanking(int limit) {
        LocalDateTime monthAgo = LocalDateTime.now().minusDays(30);
        List<User> students = userRepository.findByRole(User.Role.STUDENT);
        List<User> active = students.stream().filter(u -> {
            boolean quizActive = !quizResultRepository.findByUserIdAndCompletedAtAfter(u.getId(), monthAgo).isEmpty();
            boolean testActive = !testResultRepository.findByUserIdAndCompletedAtAfter(u.getId(), monthAgo).isEmpty();
            return quizActive || testActive;
        }).collect(Collectors.toList());
        return buildRanking(active, limit, monthAgo, null);
    }

    public List<Map<String, Object>> getRankingByLevel(String level, int limit) {
        List<User> students = userRepository.findByRole(User.Role.STUDENT);
        List<User> filtered = students.stream()
                .filter(u -> u.getLevel() != null && u.getLevel().name().equalsIgnoreCase(level))
                .collect(Collectors.toList());
        return buildRanking(filtered, limit, null, level);
    }

    public Map<String, Object> getMyRank(Long userId) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("globalRank", null);
        result.put("totalParticipants", 0);
        result.put("totalPoints", 0);
        result.put("level", null);
        result.put("found", false);

        List<User> students = userRepository.findByRole(User.Role.STUDENT);
        List<Long> userIds = students.stream().map(User::getId).collect(Collectors.toList());

        Map<Long, Double> quizPointsMap = new HashMap<>();
        Map<Long, Double> testPointsMap = new HashMap<>();
        Map<Long, Integer> quizCountMap = new HashMap<>();
        Map<Long, Integer> testCountMap = new HashMap<>();

        List<QuizResult> allQuizResults = quizResultRepository.findAll();
        for (QuizResult qr : allQuizResults) {
            Long uid = qr.getUserId();
            if (quizPointsMap.containsKey(uid)) {
                quizPointsMap.put(uid, quizPointsMap.get(uid) + qr.getScore());
                quizCountMap.put(uid, quizCountMap.get(uid) + 1);
            } else {
                quizPointsMap.put(uid, qr.getScore());
                quizCountMap.put(uid, 1);
            }
        }

        List<TestResult> allTestResults = testResultRepository.findAll();
        for (TestResult tr : allTestResults) {
            Long uid = tr.getUserId();
            if (testPointsMap.containsKey(uid)) {
                testPointsMap.put(uid, testPointsMap.get(uid) + tr.getScore());
                testCountMap.put(uid, testCountMap.get(uid) + 1);
            } else {
                testPointsMap.put(uid, tr.getScore());
                testCountMap.put(uid, 1);
            }
        }

        List<Map<String, Object>> ranked = students.stream().map(u -> {
            double qp = quizPointsMap.getOrDefault(u.getId(), 0.0);
            double tp = testPointsMap.getOrDefault(u.getId(), 0.0);
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("userId", u.getId());
            entry.put("totalPoints", (int) (qp + tp));
            return entry;
        }).sorted((a, b) -> {
            int pA = (int) a.get("totalPoints");
            int pB = (int) b.get("totalPoints");
            return Integer.compare(pB, pA);
        }).collect(Collectors.toList());

        result.put("totalParticipants", ranked.size());

        for (int i = 0; i < ranked.size(); i++) {
            if (ranked.get(i).get("userId").equals(userId)) {
                result.put("globalRank", i + 1);
                result.put("totalPoints", ranked.get(i).get("totalPoints"));
                result.put("level", students.stream().filter(s -> s.getId().equals(userId))
                        .findFirst().map(s -> s.getLevel() != null ? s.getLevel().name() : "A1").orElse("A1"));
                result.put("found", true);
                break;
            }
        }

        return result;
    }

    private List<Map<String, Object>> buildRanking(List<User> students, int limit, LocalDateTime after, String levelFilter) {
        if (students.isEmpty()) {
            return new ArrayList<>();
        }

        List<Long> userIds = students.stream().map(User::getId).collect(Collectors.toList());

        // Batch load all quiz results
        List<QuizResult> allQuizResults = quizResultRepository.findAll();
        Map<Long, List<QuizResult>> quizResultsByUser = new HashMap<>();
        for (QuizResult qr : allQuizResults) {
            if (userIds.contains(qr.getUserId())) {
                if (after == null || (qr.getCompletedAt() != null && qr.getCompletedAt().isAfter(after))) {
                    quizResultsByUser.computeIfAbsent(qr.getUserId(), k -> new ArrayList<>()).add(qr);
                }
            }
        }

        // Batch load all test results
        List<TestResult> allTestResults = testResultRepository.findAll();
        Map<Long, List<TestResult>> testResultsByUser = new HashMap<>();
        for (TestResult tr : allTestResults) {
            if (userIds.contains(tr.getUserId())) {
                if (after == null || (tr.getCompletedAt() != null && tr.getCompletedAt().isAfter(after))) {
                    testResultsByUser.computeIfAbsent(tr.getUserId(), k -> new ArrayList<>()).add(tr);
                }
            }
        }

        // Batch load all badges
        Map<Long, Integer> badgeCountByUser = new HashMap<>();
        List<UserBadge> allBadges = userBadgeRepository.findAll();
        for (UserBadge ub : allBadges) {
            if (userIds.contains(ub.getUserId())) {
                badgeCountByUser.merge(ub.getUserId(), 1, Integer::sum);
            }
        }

        // Build ranking entries
        List<Map<String, Object>> ranked = students.stream().map(u -> {
            List<QuizResult> quizResults = quizResultsByUser.getOrDefault(u.getId(), Collections.emptyList());
            List<TestResult> testResults = testResultsByUser.getOrDefault(u.getId(), Collections.emptyList());

            double quizPoints = quizResults.stream().mapToDouble(QuizResult::getScore).sum();
            double testPoints = testResults.stream().mapToDouble(TestResult::getScore).sum();
            double totalPoints = quizPoints + testPoints;

            int quizCount = quizResults.size();
            int testCount = testResults.size();
            int totalCount = quizCount + testCount;
            double avgScore = totalCount > 0 ? totalPoints / totalCount : 0;
            int badgeCount = badgeCountByUser.getOrDefault(u.getId(), 0);

            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("userId", u.getId());
            entry.put("username", u.getUsername());
            entry.put("fullName", u.getFullName() != null ? u.getFullName() : u.getUsername());
            entry.put("avatarUrl", u.getAvatarUrl());
            entry.put("level", u.getLevel() != null ? u.getLevel().name() : "A1");
            entry.put("totalPoints", (int) totalPoints);
            entry.put("quizPoints", (int) quizPoints);
            entry.put("testPoints", (int) testPoints);
            entry.put("quizCount", quizCount);
            entry.put("testCount", testCount);
            entry.put("avgScore", Math.round(avgScore * 10.0) / 10.0);
            entry.put("badgeCount", badgeCount);

            int currentLevel = calculateLevel(totalPoints);
            int currentXP = (int) totalPoints;
            int nextXP = getXPForLevel(currentLevel + 1);
            int xpForCurrent = getXPForLevel(currentLevel);
            int progressPercent = nextXP > xpForCurrent
                    ? (int) ((currentXP - xpForCurrent) * 100.0 / (nextXP - xpForCurrent))
                    : 100;
            entry.put("progressPercent", Math.min(100, Math.max(0, progressPercent)));
            entry.put("xpToNextLevel", Math.max(0, nextXP - currentXP));

            return entry;
        }).sorted((a, b) -> {
            int pointsA = (int) a.get("totalPoints");
            int pointsB = (int) b.get("totalPoints");
            return Integer.compare(pointsB, pointsA);
        }).limit(limit).collect(Collectors.toList());

        for (int i = 0; i < ranked.size(); i++) {
            ranked.get(i).put("rank", i + 1);
        }

        return ranked;
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
}
