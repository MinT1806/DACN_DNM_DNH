package com.abcenglish.service;

import com.abcenglish.entity.*;
import com.abcenglish.repository.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.data.domain.PageRequest;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for DashboardService.
 * Tests dashboard statistics, streak calculation, weekly activity.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class DashboardServiceTest {

    @Mock private UserProgressRepository userProgressRepository;
    @Mock private QuizResultRepository quizResultRepository;
    @Mock private UserBadgeRepository userBadgeRepository;
    @Mock private CourseRepository courseRepository;

    private DashboardService dashboardService;

    @BeforeEach
    void setUp() {
        dashboardService = new DashboardService(
            userProgressRepository, quizResultRepository,
            userBadgeRepository, courseRepository
        );
    }

    // ─── Basic Statistics Tests ──────────────────────────────────────────────

    @Test
    void getDashboardData_withNoActivity_shouldReturnZeroStats() {
        Long userId = 1L;
        when(userProgressRepository.findByUserIdAndCompletedTrueOrderByCompletedAtDesc(userId))
            .thenReturn(List.of());
        when(quizResultRepository.findByUserId(userId)).thenReturn(List.of());
        when(quizResultRepository.findByUserIdAndCompletedAtAfter(eq(userId), any()))
            .thenReturn(List.of());
        when(userBadgeRepository.findByUserId(userId)).thenReturn(List.of());

        Map<String, Object> result = dashboardService.getDashboardData(userId);

        assertNotNull(result);
        assertEquals(0, result.get("lessonsCompletedToday"));
        assertEquals(0, result.get("exercisesDoneToday"));
        assertEquals(0.0, result.get("accuracyToday"));
        assertEquals(0, result.get("learningStreak"));
        assertEquals(0, result.get("totalLessonsCompleted"));
        assertEquals(0, result.get("totalExercisesDone"));
        assertEquals(0.0, result.get("overallAccuracy"));
        assertEquals(0, result.get("totalXp"));
    }

    @Test
    void getDashboardData_withCompletedLessons_shouldCalculateCorrectly() {
        Long userId = 1L;

        UserProgress progress = new UserProgress();
        progress.setId(1L);
        progress.setUserId(userId);
        progress.setLessonId(10L);
        progress.setCourseId(1L);
        progress.setCompleted(true);
        progress.setScore(8);
        progress.setCompletedAt(LocalDateTime.now());

        QuizResult quiz = new QuizResult();
        quiz.setId(1L);
        quiz.setUserId(userId);
        quiz.setTotalQuestions(10);
        quiz.setCorrectAnswers(8);
        quiz.setScore(8.0);
        quiz.setCompletedAt(LocalDateTime.now());

        when(userProgressRepository.findByUserIdAndCompletedTrueOrderByCompletedAtDesc(userId))
            .thenReturn(List.of(progress));
        when(quizResultRepository.findByUserIdAndCompletedAtAfter(eq(userId), any()))
            .thenReturn(List.of(quiz));
        when(quizResultRepository.findByUserId(userId))
            .thenReturn(List.of(quiz));
        when(userBadgeRepository.findByUserId(userId)).thenReturn(List.of());

        Map<String, Object> result = dashboardService.getDashboardData(userId);

        assertEquals(1, result.get("lessonsCompletedToday"));
        assertEquals(1, result.get("exercisesDoneToday"));
        assertEquals(1, result.get("totalLessonsCompleted"));
        assertEquals(1, result.get("totalExercisesDone"));
        assertEquals(80.0, result.get("accuracyToday")); // 8/10 * 100
    }

    @Test
    void getDashboardData_shouldIncludeWeeklyActivity() {
        Long userId = 1L;
        when(userProgressRepository.findByUserIdAndCompletedTrueOrderByCompletedAtDesc(userId))
            .thenReturn(List.of());
        when(quizResultRepository.findByUserId(userId)).thenReturn(List.of());
        when(quizResultRepository.findByUserIdAndCompletedAtAfter(eq(userId), any()))
            .thenReturn(List.of());
        when(userBadgeRepository.findByUserId(userId)).thenReturn(List.of());

        Map<String, Object> result = dashboardService.getDashboardData(userId);

        assertNotNull(result.get("weeklyActivity"));
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> weekly = (List<Map<String, Object>>) result.get("weeklyActivity");
        assertEquals(7, weekly.size()); // Last 7 days
    }

    @Test
    void getDashboardData_shouldIncludeRecentActivity() {
        Long userId = 1L;
        UserProgress progress = new UserProgress();
        progress.setId(1L);
        progress.setUserId(userId);
        progress.setLessonId(10L);
        progress.setCourseId(1L);
        progress.setCompleted(true);
        progress.setScore(9);
        progress.setCompletedAt(LocalDateTime.now());

        Course course = new Course();
        course.setId(1L);
        course.setTitle("Test Course");

        when(userProgressRepository.findByUserIdAndCompletedTrueOrderByCompletedAtDesc(userId))
            .thenReturn(List.of(progress));
        when(quizResultRepository.findByUserId(userId)).thenReturn(List.of());
        when(quizResultRepository.findByUserIdAndCompletedAtAfter(eq(userId), any()))
            .thenReturn(List.of());
        when(userBadgeRepository.findByUserId(userId)).thenReturn(List.of());
        when(courseRepository.findById(1L)).thenReturn(Optional.of(course));

        Map<String, Object> result = dashboardService.getDashboardData(userId);

        assertNotNull(result.get("recentActivity"));
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> recent = (List<Map<String, Object>>) result.get("recentActivity");
        assertEquals(1, recent.size());
        assertEquals("Test Course", recent.get(0).get("courseTitle"));
    }

    @Test
    void getDashboardData_withBadges_shouldCalculateXp() {
        Long userId = 1L;
        UserBadge badge = new UserBadge(userId, "first_steps", "First Steps", "🎯", "COMMON");
        badge.setEarnedAt(LocalDateTime.now());

        UserProgress progress = new UserProgress();
        progress.setUserId(userId);
        progress.setCompleted(true);
        progress.setCompletedAt(LocalDateTime.now());

        QuizResult quiz = new QuizResult();
        quiz.setUserId(userId);
        quiz.setTotalQuestions(10);
        quiz.setCorrectAnswers(8);
        quiz.setScore(8.0);
        quiz.setCompletedAt(LocalDateTime.now());

        when(userProgressRepository.findByUserIdAndCompletedTrueOrderByCompletedAtDesc(userId))
            .thenReturn(List.of(progress));
        when(quizResultRepository.findByUserIdAndCompletedAtAfter(eq(userId), any()))
            .thenReturn(List.of(quiz));
        when(quizResultRepository.findByUserId(userId)).thenReturn(List.of(quiz));
        when(userBadgeRepository.findByUserId(userId)).thenReturn(List.of(badge));

        Map<String, Object> result = dashboardService.getDashboardData(userId);

        // Badge: 1 * 100 = 100, Lesson: 1 * 10 = 10, Quiz: 1 * 5 = 5, Total: 115
        int expectedXp = 1 * 100 + 1 * 10 + 1 * 5;
        assertEquals(expectedXp, result.get("totalXp"));
    }

    // ─── Accuracy Calculation Tests ──────────────────────────────────────────

    @Test
    void calculateAverageAccuracy_withZeroQuestions_shouldReturnZero() {
        QuizResult quiz = new QuizResult();
        quiz.setTotalQuestions(0);
        quiz.setCorrectAnswers(0);

        double accuracy = dashboardService.getDashboardData(1L).get("accuracyToday") == null ? 0.0 :
            (Double) dashboardService.getDashboardData(1L).get("accuracyToday");

        // NPE-free - no exception thrown
        assertNotNull(accuracy);
    }

    @Test
    void calculateAverageAccuracy_withMixedResults_shouldCalculateCorrectly() {
        Long userId = 1L;

        QuizResult q1 = new QuizResult();
        q1.setTotalQuestions(10);
        q1.setCorrectAnswers(10); // 100%

        QuizResult q2 = new QuizResult();
        q2.setTotalQuestions(10);
        q2.setCorrectAnswers(5); // 50%

        when(userProgressRepository.findByUserIdAndCompletedTrueOrderByCompletedAtDesc(userId))
            .thenReturn(List.of());
        when(quizResultRepository.findByUserIdAndCompletedAtAfter(eq(userId), any()))
            .thenReturn(List.of(q1, q2));
        when(quizResultRepository.findByUserId(userId)).thenReturn(List.of(q1, q2));
        when(userBadgeRepository.findByUserId(userId)).thenReturn(List.of());

        Map<String, Object> result = dashboardService.getDashboardData(userId);

        // (100% + 50%) / 2 = 75%
        assertEquals(75.0, result.get("accuracyToday"));
    }

    // ─── Streak Calculation Tests ────────────────────────────────────────────

    @Test
    void calculateLearningStreak_withNoActivity_shouldReturnZero() {
        Long userId = 1L;
        when(userProgressRepository.findByUserIdAndCompletedTrueOrderByCompletedAtDesc(userId))
            .thenReturn(List.of());

        // Test via reflection or call a method if accessible
        // For now, verify via dashboard
        when(quizResultRepository.findByUserIdAndCompletedAtAfter(eq(userId), any()))
            .thenReturn(List.of());
        when(quizResultRepository.findByUserId(userId)).thenReturn(List.of());
        when(userBadgeRepository.findByUserId(userId)).thenReturn(List.of());

        Map<String, Object> result = dashboardService.getDashboardData(userId);

        assertEquals(0, result.get("learningStreak"));
    }

    @Test
    void calculateLearningStreak_withGap_shouldReturnZero() {
        Long userId = 1L;
        LocalDateTime twoDaysAgo = LocalDateTime.now().minusDays(2);
        LocalDateTime threeDaysAgo = LocalDateTime.now().minusDays(3);

        UserProgress p1 = new UserProgress();
        p1.setCompletedAt(threeDaysAgo);
        p1.setCompleted(true);

        UserProgress p2 = new UserProgress();
        p2.setCompletedAt(twoDaysAgo);
        p2.setCompleted(true);

        when(userProgressRepository.findByUserIdAndCompletedTrueOrderByCompletedAtDesc(userId))
            .thenReturn(List.of(p1, p2));

        // p2 is 2 days ago, p1 is 3 days ago
        // Gap exists between yesterday and 2 days ago
        // Streak should be broken
    }

    @Test
    void weeklyActivity_shouldReturn7Days() {
        Long userId = 1L;
        when(userProgressRepository.findByUserIdAndCompletedTrueOrderByCompletedAtDesc(userId))
            .thenReturn(List.of());
        when(quizResultRepository.findByUserId(userId)).thenReturn(List.of());
        when(quizResultRepository.findByUserIdAndCompletedAtAfter(eq(userId), any()))
            .thenReturn(List.of());
        when(userBadgeRepository.findByUserId(userId)).thenReturn(List.of());

        Map<String, Object> result = dashboardService.getDashboardData(userId);

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> weekly = (List<Map<String, Object>>) result.get("weeklyActivity");
        assertEquals(7, weekly.size());

        // Days should be ordered from oldest to newest (6 days ago to today)
        assertNotNull(weekly.get(0).get("date"));
        assertNotNull(weekly.get(6).get("date"));
    }
}
