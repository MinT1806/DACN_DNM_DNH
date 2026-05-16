package com.abcenglish.service;

import com.abcenglish.entity.Course;
import com.abcenglish.entity.QuizResult;
import com.abcenglish.entity.UserProgress;
import com.abcenglish.repository.CourseRepository;
import com.abcenglish.repository.QuizResultRepository;
import com.abcenglish.repository.UserBadgeRepository;
import com.abcenglish.repository.UserProgressRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Slf4j
public class DashboardService {

    private final UserProgressRepository userProgressRepository;
    private final QuizResultRepository quizResultRepository;
    private final UserBadgeRepository userBadgeRepository;
    private final CourseRepository courseRepository;

    public DashboardService(UserProgressRepository userProgressRepository,
                           QuizResultRepository quizResultRepository,
                           UserBadgeRepository userBadgeRepository,
                           CourseRepository courseRepository) {
        this.userProgressRepository = userProgressRepository;
        this.quizResultRepository = quizResultRepository;
        this.userBadgeRepository = userBadgeRepository;
        this.courseRepository = courseRepository;
    }

    public Map<String, Object> getDashboardData(Long userId) {
        Map<String, Object> dashboard = new LinkedHashMap<>();

        LocalDate today = LocalDate.now();
        LocalDateTime startOfToday = today.atStartOfDay();
        LocalDateTime endOfToday = today.plusDays(1).atStartOfDay();

        // 1. Lessons completed today
        List<UserProgress> todayProgress = userProgressRepository.findByUserIdAndCompletedTrueOrderByCompletedAtDesc(userId)
                .stream()
                .filter(up -> up.getCompletedAt() != null &&
                        !up.getCompletedAt().isBefore(startOfToday) &&
                        up.getCompletedAt().isBefore(endOfToday))
                .collect(Collectors.toList());
        int lessonsCompletedToday = todayProgress.size();

        // 2. Exercises done today
        List<QuizResult> todayQuizzes = quizResultRepository.findByUserIdAndCompletedAtAfter(userId, startOfToday.minusSeconds(1));
        int exercisesDoneToday = todayQuizzes.size();

        // 3. Accuracy (today)
        double accuracyToday = calculateAverageAccuracy(todayQuizzes);

        // 4. Learning streak (days)
        int learningStreak = calculateLearningStreak(userId, today);

        // 5. Total lessons completed
        int totalLessonsCompleted = (int) userProgressRepository.findByUserIdAndCompletedTrueOrderByCompletedAtDesc(userId).stream().count();

        // 6. Total exercises done
        List<QuizResult> allQuizzes = quizResultRepository.findByUserId(userId);
        int totalExercisesDone = allQuizzes.size();

        // 7. Overall accuracy
        double overallAccuracy = calculateAverageAccuracy(allQuizzes);

        // 8. Total XP (estimated)
        int badgesCount = userBadgeRepository.findByUserId(userId).size();
        int totalXp = badgesCount * 100 + totalLessonsCompleted * 10 + totalExercisesDone * 5;

        // 9. Weekly activity - last 7 days
        List<Map<String, Object>> weeklyActivity = getWeeklyActivity(userId, today);

        // 10. Recent activity - last 5 completed lessons
        List<Map<String, Object>> recentActivity = getRecentActivity(userId);

        // Build response
        dashboard.put("lessonsCompletedToday", lessonsCompletedToday);
        dashboard.put("exercisesDoneToday", exercisesDoneToday);
        dashboard.put("accuracyToday", Math.round(accuracyToday * 10.0) / 10.0);
        dashboard.put("learningStreak", learningStreak);
        dashboard.put("totalLessonsCompleted", totalLessonsCompleted);
        dashboard.put("totalExercisesDone", totalExercisesDone);
        dashboard.put("overallAccuracy", Math.round(overallAccuracy * 10.0) / 10.0);
        dashboard.put("totalXp", totalXp);
        dashboard.put("weeklyActivity", weeklyActivity);
        dashboard.put("recentActivity", recentActivity);

        return dashboard;
    }

    private double calculateAverageAccuracy(List<QuizResult> quizzes) {
        if (quizzes == null || quizzes.isEmpty()) {
            return 0.0;
        }
        double totalAccuracy = quizzes.stream()
                .filter(q -> q.getTotalQuestions() > 0)
                .mapToDouble(q -> (double) q.getCorrectAnswers() / q.getTotalQuestions() * 100)
                .sum();
        long validQuizzes = quizzes.stream().filter(q -> q.getTotalQuestions() > 0).count();
        if (validQuizzes == 0) {
            return 0.0;
        }
        return totalAccuracy / validQuizzes;
    }

    private int calculateLearningStreak(Long userId, LocalDate today) {
        List<UserProgress> allProgress = userProgressRepository.findByUserIdAndCompletedTrueOrderByCompletedAtDesc(userId);

        if (allProgress.isEmpty()) {
            return 0;
        }

        // Get unique dates with completed lessons
        List<LocalDate> completedDates = allProgress.stream()
                .filter(up -> up.getCompletedAt() != null)
                .map(up -> up.getCompletedAt().toLocalDate())
                .distinct()
                .sorted()
                .collect(Collectors.toList());

        if (completedDates.isEmpty()) {
            return 0;
        }

        LocalDate mostRecentDate = completedDates.get(completedDates.size() - 1);
        LocalDate checkDate;

        // If today has records, start counting from today
        // If today has none but yesterday does, start counting from yesterday
        if (mostRecentDate.equals(today)) {
            checkDate = today;
        } else if (mostRecentDate.equals(today.minusDays(1))) {
            checkDate = today.minusDays(1);
        } else {
            // Gap too large, streak is broken
            return 0;
        }

        int streak = 0;
        LocalDate currentDate = checkDate;

        while (true) {
            final LocalDate dateToCheck = currentDate;
            boolean hasActivity = completedDates.stream()
                    .anyMatch(d -> d.equals(dateToCheck));

            if (hasActivity) {
                streak++;
                currentDate = currentDate.minusDays(1);
            } else {
                break;
            }
        }

        return streak;
    }

    private List<Map<String, Object>> getWeeklyActivity(Long userId, LocalDate today) {
        List<Map<String, Object>> weekly = new ArrayList<>();

        for (int i = 6; i >= 0; i--) {
            LocalDate date = today.minusDays(i);
            LocalDateTime startOfDay = date.atStartOfDay();
            LocalDateTime endOfDay = date.plusDays(1).atStartOfDay();

            long count = userProgressRepository.findByUserIdAndCompletedTrueOrderByCompletedAtDesc(userId)
                    .stream()
                    .filter(up -> up.getCompletedAt() != null)
                    .filter(up -> {
                        LocalDateTime completedAt = up.getCompletedAt();
                        return !completedAt.isBefore(startOfDay) && completedAt.isBefore(endOfDay);
                    })
                    .count();

            Map<String, Object> day = new LinkedHashMap<>();
            day.put("date", date.toString());
            day.put("dayOfWeek", date.getDayOfWeek().name().substring(0, 3));
            day.put("completedLessons", count);
            weekly.add(day);
        }

        return weekly;
    }

    private List<Map<String, Object>> getRecentActivity(Long userId) {
        List<UserProgress> recentProgress = userProgressRepository.findByUserIdAndCompletedTrueOrderByCompletedAtDesc(userId);

        return recentProgress.stream()
                .limit(5)
                .map(up -> {
                    Map<String, Object> activity = new LinkedHashMap<>();
                    activity.put("id", up.getId());
                    activity.put("courseId", up.getCourseId());
                    activity.put("lessonId", up.getLessonId());
                    activity.put("completed", up.isCompleted());
                    activity.put("score", up.getScore());
                    activity.put("timeSpentMinutes", up.getTimeSpentMinutes());
                    activity.put("completedAt", up.getCompletedAt() != null ? up.getCompletedAt().toString() : null);

                    // Get course title
                    if (up.getCourseId() != null) {
                        String courseTitle = courseRepository.findById(up.getCourseId())
                                .map(Course::getTitle)
                                .orElse("Unknown Course");
                        activity.put("courseTitle", courseTitle);
                    } else {
                        activity.put("courseTitle", "Unknown Course");
                    }

                    return activity;
                })
                .collect(Collectors.toList());
    }
}
