package com.abcenglish.service;

import com.abcenglish.entity.*;
import com.abcenglish.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for LeaderboardService.
 * Tests leaderboard ranking, points calculation, and ranking by period.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class LeaderboardServiceTest {

    @Mock private QuizResultRepository quizResultRepository;
    @Mock private UserProgressRepository progressRepository;
    @Mock private UserBadgeRepository badgeRepository;
    @Mock private UserRepository userRepository;

    private LeaderboardService leaderboardService;

    private User student1;
    private User student2;
    private User student3;

    @BeforeEach
    void setUp() {
        leaderboardService = new LeaderboardService(
            quizResultRepository, progressRepository, badgeRepository, userRepository
        );

        student1 = new User();
        student1.setId(1L);
        student1.setUsername("top_student");
        student1.setFullName("Alice");
        student1.setLevel(User.Level.A1);
        student1.setRole(User.Role.STUDENT);

        student2 = new User();
        student2.setId(2L);
        student2.setUsername("mid_student");
        student2.setFullName("Bob");
        student2.setLevel(User.Level.A1);
        student2.setRole(User.Role.STUDENT);

        student3 = new User();
        student3.setId(3L);
        student3.setUsername("low_student");
        student3.setFullName("Charlie");
        student3.setLevel(User.Level.A2);
        student3.setRole(User.Role.STUDENT);
    }

    // ─── Leaderboard Sorting Tests ─────────────────────────────────────────

    @Test
    void getLeaderboard_shouldSortByPointsDescending() {
        when(userRepository.findByRole(User.Role.STUDENT))
            .thenReturn(List.of(student1, student2, student3));

        // student1: 2 quizzes, avg score 9.0 -> 9.0 + 9.0 = 18.0 * 10 = 180 points
        QuizResult r1 = new QuizResult();
        r1.setScore(9.0);
        r1.setCompletedAt(LocalDateTime.now());
        QuizResult r2 = new QuizResult();
        r2.setScore(9.0);
        r2.setCompletedAt(LocalDateTime.now());

        when(quizResultRepository.findByUserId(1L)).thenReturn(List.of(r1, r2));
        when(quizResultRepository.findByUserId(2L)).thenReturn(List.of(r1)); // 1 quiz, avg 9.0 -> 90 points
        when(quizResultRepository.findByUserId(3L)).thenReturn(List.of()); // 0 points

        when(progressRepository.findByUserIdAndCompletedTrueOrderByCompletedAtDesc(anyLong()))
            .thenReturn(List.of());
        when(badgeRepository.findByUserId(anyLong())).thenReturn(List.of());

        var result = leaderboardService.getLeaderboard("all", null, 10);

        assertNotNull(result);
        assertEquals(2, result.size()); // Only 2 have points > 0
        // student1 (180 points) should be first
        assertEquals("top_student", result.get(0).get("username"));
        assertEquals(180, result.get(0).get("points"));
    }

    @Test
    void getLeaderboard_withLevelFilter_shouldReturnFilteredUsers() {
        when(userRepository.findByRole(User.Role.STUDENT))
            .thenReturn(List.of(student1, student2, student3));

        when(quizResultRepository.findByUserId(anyLong())).thenReturn(List.of());
        when(progressRepository.findByUserIdAndCompletedTrueOrderByCompletedAtDesc(anyLong()))
            .thenReturn(List.of());
        when(badgeRepository.findByUserId(anyLong())).thenReturn(List.of());

        var result = leaderboardService.getLeaderboard("all", "A1", 10);

        assertNotNull(result);
        // Should only include A1 users (student1 and student2)
        assertTrue(result.stream()
            .allMatch(entry -> "A1".equals(entry.get("level"))));
    }

    @Test
    void getLeaderboard_withZeroPoints_shouldBeFilteredOut() {
        when(userRepository.findByRole(User.Role.STUDENT))
            .thenReturn(List.of(student1, student2));

        when(quizResultRepository.findByUserId(1L)).thenReturn(List.of());
        when(quizResultRepository.findByUserId(2L)).thenReturn(List.of());
        when(progressRepository.findByUserIdAndCompletedTrueOrderByCompletedAtDesc(anyLong()))
            .thenReturn(List.of());
        when(badgeRepository.findByUserId(anyLong())).thenReturn(List.of());

        var result = leaderboardService.getLeaderboard("all", null, 10);

        assertEquals(0, result.size());
    }

    @Test
    void getLeaderboard_shouldEnrichUserData() {
        when(userRepository.findByRole(User.Role.STUDENT))
            .thenReturn(List.of(student1));

        QuizResult r = new QuizResult();
        r.setScore(8.0);
        r.setCompletedAt(LocalDateTime.now());

        when(quizResultRepository.findByUserId(1L)).thenReturn(List.of(r));
        when(progressRepository.findByUserIdAndCompletedTrueOrderByCompletedAtDesc(1L))
            .thenReturn(List.of());
        when(badgeRepository.findByUserId(1L)).thenReturn(List.of());

        var result = leaderboardService.getLeaderboard("all", null, 10);

        assertEquals(1, result.size());
        assertEquals("Alice", result.get(0).get("fullName"));
        assertEquals("A1", result.get(0).get("level"));
        assertEquals(1, result.get(0).get("quizCount"));
    }

    // ─── Period-based Leaderboard Tests ────────────────────────────────────

    @Test
    void getLeaderboard_dailyPeriod_shouldFilterByToday() {
        when(userRepository.findByRole(User.Role.STUDENT))
            .thenReturn(List.of(student1));

        QuizResult todayQuiz = new QuizResult();
        todayQuiz.setScore(9.0);
        todayQuiz.setCompletedAt(LocalDateTime.now());

        QuizResult yesterdayQuiz = new QuizResult();
        yesterdayQuiz.setScore(8.0);
        yesterdayQuiz.setCompletedAt(LocalDateTime.now().minusDays(1));

        when(quizResultRepository.findByUserId(1L))
            .thenReturn(List.of(todayQuiz, yesterdayQuiz));
        when(progressRepository.findByUserIdAndCompletedTrueOrderByCompletedAtDesc(1L))
            .thenReturn(List.of());
        when(badgeRepository.findByUserId(1L)).thenReturn(List.of());

        var result = leaderboardService.getLeaderboard("daily", null, 10);

        assertNotNull(result);
        // Only today's quiz should count
        assertEquals(90, result.get(0).get("points")); // 9.0 * 10
    }

    @Test
    void getLeaderboard_allPeriod_shouldIncludeAllHistory() {
        when(userRepository.findByRole(User.Role.STUDENT))
            .thenReturn(List.of(student1));

        QuizResult oldQuiz = new QuizResult();
        oldQuiz.setScore(5.0);
        oldQuiz.setCompletedAt(LocalDateTime.now().minusMonths(1));

        QuizResult recentQuiz = new QuizResult();
        recentQuiz.setScore(8.0);
        recentQuiz.setCompletedAt(LocalDateTime.now());

        when(quizResultRepository.findByUserId(1L))
            .thenReturn(List.of(oldQuiz, recentQuiz));
        when(progressRepository.findByUserIdAndCompletedTrueOrderByCompletedAtDesc(1L))
            .thenReturn(List.of());
        when(badgeRepository.findByUserId(1L)).thenReturn(List.of());

        var result = leaderboardService.getLeaderboard("all", null, 10);

        assertNotNull(result);
        // Both quizzes should count
        assertEquals(130, result.get(0).get("points")); // (5.0 + 8.0) * 10
    }

    @Test
    void getLeaderboard_limit_shouldCapResults() {
        when(userRepository.findByRole(User.Role.STUDENT))
            .thenReturn(List.of(student1, student2, student3));

        QuizResult r = new QuizResult();
        r.setScore(5.0);
        r.setCompletedAt(LocalDateTime.now());

        when(quizResultRepository.findByUserId(1L)).thenReturn(List.of(r));
        when(quizResultRepository.findByUserId(2L)).thenReturn(List.of(r));
        when(quizResultRepository.findByUserId(3L)).thenReturn(List.of(r));
        when(progressRepository.findByUserIdAndCompletedTrueOrderByCompletedAtDesc(anyLong()))
            .thenReturn(List.of());
        when(badgeRepository.findByUserId(anyLong())).thenReturn(List.of());

        var result = leaderboardService.getLeaderboard("all", null, 2);

        assertEquals(2, result.size()); // Limited to 2
    }

    // ─── My Rank Tests ───────────────────────────────────────────────────

    @Test
    void getMyRank_existingUser_shouldReturnCorrectRank() {
        when(userRepository.findById(1L)).thenReturn(java.util.Optional.of(student1));
        when(userRepository.findByRole(User.Role.STUDENT))
            .thenReturn(List.of(student1, student2));

        QuizResult r = new QuizResult();
        r.setScore(9.0);
        r.setCompletedAt(LocalDateTime.now());

        when(quizResultRepository.findByUserId(1L)).thenReturn(List.of(r));
        when(quizResultRepository.findByUserId(2L)).thenReturn(List.of(r)); // Same score
        when(progressRepository.findByUserIdAndCompletedTrueOrderByCompletedAtDesc(anyLong()))
            .thenReturn(List.of());
        when(badgeRepository.findByUserId(anyLong())).thenReturn(List.of());

        var result = leaderboardService.getMyRank(1L, "all");

        assertNotNull(result);
        assertEquals(1L, result.get("userId"));
        assertTrue((Integer) result.get("rank") > 0);
        assertEquals("A1", result.get("level"));
    }

    @Test
    void getMyRank_nonexistentUser_shouldReturnNull() {
        when(userRepository.findById(999L)).thenReturn(java.util.Optional.empty());

        var result = leaderboardService.getMyRank(999L, "all");

        assertNull(result);
    }

    // ─── Daily/Weekly Convenience Methods ─────────────────────────────────

    @Test
    void getDailyLeaderboard_shouldDelegateToGetLeaderboard() {
        when(userRepository.findByRole(User.Role.STUDENT))
            .thenReturn(List.of(student1));
        when(quizResultRepository.findByUserId(anyLong())).thenReturn(List.of());
        when(progressRepository.findByUserIdAndCompletedTrueOrderByCompletedAtDesc(anyLong()))
            .thenReturn(List.of());
        when(badgeRepository.findByUserId(anyLong())).thenReturn(List.of());

        var result = leaderboardService.getDailyLeaderboard(10);

        assertNotNull(result);
        verify(userRepository).findByRole(User.Role.STUDENT);
    }

    @Test
    void getWeeklyLeaderboard_shouldDelegateToGetLeaderboard() {
        when(userRepository.findByRole(User.Role.STUDENT))
            .thenReturn(List.of(student1));
        when(quizResultRepository.findByUserId(anyLong())).thenReturn(List.of());
        when(progressRepository.findByUserIdAndCompletedTrueOrderByCompletedAtDesc(anyLong()))
            .thenReturn(List.of());
        when(badgeRepository.findByUserId(anyLong())).thenReturn(List.of());

        var result = leaderboardService.getWeeklyLeaderboard(10);

        assertNotNull(result);
    }

    // ─── Contest Ranking Tests ─────────────────────────────────────────────

    @Test
    void getContestRanking_shouldFilterByDateRange() {
        LocalDate today = LocalDate.now();
        LocalDateTime withinRange = today.minusDays(3).atStartOfDay();
        LocalDateTime outsideRange = today.minusDays(10).atStartOfDay();

        QuizResult withinQuiz = new QuizResult();
        withinQuiz.setScore(9.0);
        withinQuiz.setCompletedAt(withinRange);

        QuizResult outsideQuiz = new QuizResult();
        outsideQuiz.setScore(10.0);
        outsideQuiz.setCompletedAt(outsideRange);

        when(userRepository.findByRole(User.Role.STUDENT))
            .thenReturn(List.of(student1));
        when(quizResultRepository.findByUserId(1L))
            .thenReturn(List.of(withinQuiz, outsideQuiz));
        when(progressRepository.findByUserIdAndCompletedTrueOrderByCompletedAtDesc(1L))
            .thenReturn(List.of());

        var result = leaderboardService.getContestRanking(
            today.minusDays(7), today, 10
        );

        assertNotNull(result);
        // Only within-range quiz counts (9.0 * 10 = 90)
        assertEquals(90, result.get(0).get("totalPoints"));
    }

    @Test
    void getContestRanking_withNoResults_shouldBeEmpty() {
        when(userRepository.findByRole(User.Role.STUDENT))
            .thenReturn(List.of(student1));
        when(quizResultRepository.findByUserId(1L)).thenReturn(List.of());
        when(progressRepository.findByUserIdAndCompletedTrueOrderByCompletedAtDesc(1L))
            .thenReturn(List.of());

        var result = leaderboardService.getContestRanking(
            LocalDate.now().minusDays(7), LocalDate.now(), 10
        );

        assertEquals(0, result.size());
    }
}
