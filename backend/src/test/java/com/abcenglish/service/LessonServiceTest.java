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

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for LessonService.
 * Tests lesson retrieval, navigation, and completion tracking.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class LessonServiceTest {

    @Mock private LessonRepository lessonRepository;
    @Mock private CourseRepository courseRepository;
    @Mock private UserProgressRepository progressRepository;
    @Mock private QuizResultRepository quizResultRepository;
    @Mock private ExerciseRepository exerciseRepository;
    @Mock private ExerciseQuestionRepository questionRepository;
    @Mock private AIService aiService;

    private LessonService lessonService;

    private Course testCourse;
    private Lesson lesson1;
    private Lesson lesson2;
    private Lesson lesson3;

    @BeforeEach
    void setUp() {
        lessonService = new LessonService(
            lessonRepository, courseRepository, progressRepository,
            quizResultRepository, exerciseRepository, questionRepository, aiService
        );

        testCourse = new Course();
        testCourse.setId(1L);
        testCourse.setTitle("English A1");

        lesson1 = new Lesson();
        lesson1.setId(1L);
        lesson1.setCourseId(1L);
        lesson1.setTitle("Lesson 1: Greetings");
        lesson1.setContent("Hello, how are you?");
        lesson1.setOrderIndex(0);
        lesson1.setDurationMinutes(15);

        lesson2 = new Lesson();
        lesson2.setId(2L);
        lesson2.setCourseId(1L);
        lesson2.setTitle("Lesson 2: Farewells");
        lesson2.setContent("Goodbye, see you later!");
        lesson2.setOrderIndex(1);
        lesson2.setDurationMinutes(20);

        lesson3 = new Lesson();
        lesson3.setId(3L);
        lesson3.setCourseId(1L);
        lesson3.setTitle("Lesson 3: Numbers");
        lesson3.setContent("One, two, three...");
        lesson3.setOrderIndex(2);
        lesson3.setDurationMinutes(10);
    }

    // ─── Get Lesson Tests ───────────────────────────────────────────────────

    @Test
    void getLessonById_existingLesson_shouldReturnLesson() {
        when(lessonRepository.findById(1L)).thenReturn(java.util.Optional.of(lesson1));

        Lesson result = lessonService.getLessonById(1L);

        assertNotNull(result);
        assertEquals("Lesson 1: Greetings", result.getTitle());
    }

    @Test
    void getLessonById_nonexistent_shouldReturnNull() {
        when(lessonRepository.findById(999L)).thenReturn(java.util.Optional.empty());

        Lesson result = lessonService.getLessonById(999L);

        assertNull(result);
    }

    @Test
    void getLessonsByCourse_shouldReturnOrderedLessons() {
        when(lessonRepository.findByCourseIdOrderByOrderIndex(1L))
            .thenReturn(List.of(lesson1, lesson2, lesson3));

        List<Lesson> result = lessonService.getLessonsByCourse(1L);

        assertEquals(3, result.size());
        assertEquals(0, result.get(0).getOrderIndex());
        assertEquals(1, result.get(1).getOrderIndex());
        assertEquals(2, result.get(2).getOrderIndex());
    }

    // ─── Lesson Detail Tests ─────────────────────────────────────────────────

    @Test
    void getLessonDetail_existingLesson_shouldReturnFullDetail() {
        when(lessonRepository.findById(2L)).thenReturn(java.util.Optional.of(lesson2));
        when(exerciseRepository.findAll()).thenReturn(List.of());
        when(lessonRepository.findByCourseIdOrderByOrderIndex(1L))
            .thenReturn(List.of(lesson1, lesson2, lesson3));

        var result = lessonService.getLessonDetail(2L, null);

        assertNotNull(result);
        assertEquals("Lesson 2: Farewells", result.get("title"));
        assertEquals("Goodbye, see you later!", result.get("content"));
        assertEquals(20, result.get("durationMinutes"));
        assertEquals(1L, result.get("courseId"));
        assertFalse((Boolean) result.get("completed"));
        assertEquals(0, result.get("score"));
    }

    @Test
    void getLessonDetail_withUserProgress_shouldShowCompleted() {
        UserProgress progress = new UserProgress();
        progress.setLessonId(1L);
        progress.setCompleted(true);
        progress.setScore(9);

        when(lessonRepository.findById(1L)).thenReturn(java.util.Optional.of(lesson1));
        when(progressRepository.findByUserIdAndLessonId(1L, 1L))
            .thenReturn(java.util.Optional.of(progress));
        when(exerciseRepository.findAll()).thenReturn(List.of());
        when(lessonRepository.findByCourseIdOrderByOrderIndex(1L))
            .thenReturn(List.of(lesson1, lesson2, lesson3));

        var result = lessonService.getLessonDetail(1L, 1L);

        assertTrue((Boolean) result.get("completed"));
        assertEquals(9, result.get("score"));
    }

    @Test
    void getLessonDetail_nonexistent_shouldReturnNull() {
        when(lessonRepository.findById(999L)).thenReturn(java.util.Optional.empty());

        var result = lessonService.getLessonDetail(999L, 1L);

        assertNull(result);
    }

    // ─── Navigation Tests ───────────────────────────────────────────────────

    @Test
    void getLessonDetail_withNavigation_shouldIncludePrevAndNext() {
        when(lessonRepository.findById(2L)).thenReturn(java.util.Optional.of(lesson2));
        when(exerciseRepository.findAll()).thenReturn(List.of());
        when(progressRepository.findByUserIdAndLessonId(1L, 2L))
            .thenReturn(java.util.Optional.empty());
        when(lessonRepository.findByCourseIdOrderByOrderIndex(1L))
            .thenReturn(List.of(lesson1, lesson2, lesson3));

        var result = lessonService.getLessonDetail(2L, 1L);

        @SuppressWarnings("unchecked")
        var nav = (java.util.Map<String, Object>) result.get("navigation");
        assertNotNull(nav);
        assertTrue((Boolean) nav.get("hasPrevious"));
        assertTrue((Boolean) nav.get("hasNext"));
        assertEquals(1L, nav.get("previousId"));
        assertEquals(3L, nav.get("nextId"));
    }

    @Test
    void getLessonDetail_firstLesson_shouldHaveNoPrevious() {
        when(lessonRepository.findById(1L)).thenReturn(java.util.Optional.of(lesson1));
        when(exerciseRepository.findAll()).thenReturn(List.of());
        when(progressRepository.findByUserIdAndLessonId(1L, 1L))
            .thenReturn(java.util.Optional.empty());
        when(lessonRepository.findByCourseIdOrderByOrderIndex(1L))
            .thenReturn(List.of(lesson1, lesson2, lesson3));

        var result = lessonService.getLessonDetail(1L, 1L);

        @SuppressWarnings("unchecked")
        var nav = (java.util.Map<String, Object>) result.get("navigation");
        assertNotNull(nav);
        assertFalse((Boolean) nav.get("hasPrevious"));
        assertTrue((Boolean) nav.get("hasNext"));
    }

    @Test
    void getLessonDetail_lastLesson_shouldHaveNoNext() {
        when(lessonRepository.findById(3L)).thenReturn(java.util.Optional.of(lesson3));
        when(exerciseRepository.findAll()).thenReturn(List.of());
        when(progressRepository.findByUserIdAndLessonId(1L, 3L))
            .thenReturn(java.util.Optional.empty());
        when(lessonRepository.findByCourseIdOrderByOrderIndex(1L))
            .thenReturn(List.of(lesson1, lesson2, lesson3));

        var result = lessonService.getLessonDetail(3L, 1L);

        @SuppressWarnings("unchecked")
        var nav = (java.util.Map<String, Object>) result.get("navigation");
        assertNotNull(nav);
        assertTrue((Boolean) nav.get("hasPrevious"));
        assertFalse((Boolean) nav.get("hasNext"));
    }

    // ─── Start Lesson Tests ──────────────────────────────────────────────────

    @Test
    void startLesson_newProgress_shouldCreateAndSave() {
        when(lessonRepository.findById(1L)).thenReturn(java.util.Optional.of(lesson1));
        when(progressRepository.findByUserIdAndLessonId(1L, 1L))
            .thenReturn(java.util.Optional.empty());
        when(progressRepository.save(any(UserProgress.class))).thenAnswer(inv -> {
            UserProgress p = inv.getArgument(0);
            p.setId(1L);
            return p;
        });

        var result = lessonService.startLesson(1L, 1L);

        assertNotNull(result);
        assertTrue((Boolean) result.get("started"));
        assertEquals(1L, result.get("progressId"));
        assertNotNull(result.get("lastAccessedAt"));
        verify(progressRepository).save(any(UserProgress.class));
    }

    @Test
    void startLesson_existingProgress_shouldUpdateLastAccessed() {
        UserProgress existing = new UserProgress();
        existing.setId(5L);
        existing.setUserId(1L);
        existing.setLessonId(1L);

        when(lessonRepository.findById(1L)).thenReturn(java.util.Optional.of(lesson1));
        when(progressRepository.findByUserIdAndLessonId(1L, 1L))
            .thenReturn(java.util.Optional.of(existing));
        when(progressRepository.save(any(UserProgress.class))).thenReturn(existing);

        var result = lessonService.startLesson(1L, 1L);

        assertNotNull(result);
        assertTrue((Boolean) result.get("started"));
        assertEquals(5L, result.get("progressId"));
        verify(progressRepository).save(existing);
    }

    // ─── Complete Lesson Tests ──────────────────────────────────────────────

    @Test
    void completeLesson_newProgress_shouldCreateCompletedProgress() {
        when(lessonRepository.findById(1L)).thenReturn(java.util.Optional.of(lesson1));
        when(progressRepository.findByUserIdAndLessonId(1L, 1L))
            .thenReturn(java.util.Optional.empty());
        when(progressRepository.save(any(UserProgress.class))).thenAnswer(inv -> inv.getArgument(0));
        when(courseRepository.findById(1L)).thenReturn(java.util.Optional.of(testCourse));
        when(progressRepository.findByUserIdAndCourseId(1L, 1L)).thenReturn(List.of());

        UserProgress result = lessonService.completeLesson(1L, 1L, 8, 15);

        assertNotNull(result);
        assertTrue(result.isCompleted());
        assertEquals(8, result.getScore());
        assertEquals(15, result.getTimeSpentMinutes());
        assertNotNull(result.getCompletedAt());
    }

    @Test
    void completeLesson_existingProgress_shouldUpdateExisting() {
        UserProgress existing = new UserProgress();
        existing.setId(5L);
        existing.setUserId(1L);
        existing.setLessonId(1L);
        existing.setScore(5);

        when(lessonRepository.findById(1L)).thenReturn(java.util.Optional.of(lesson1));
        when(progressRepository.findByUserIdAndLessonId(1L, 1L))
            .thenReturn(java.util.Optional.of(existing));
        when(progressRepository.save(any(UserProgress.class))).thenAnswer(inv -> inv.getArgument(0));
        when(courseRepository.findById(1L)).thenReturn(java.util.Optional.of(testCourse));
        when(progressRepository.findByUserIdAndCourseId(1L, 1L)).thenReturn(List.of());

        UserProgress result = lessonService.completeLesson(1L, 1L, 10, 20);

        assertEquals(10, result.getScore());
        assertTrue(result.isCompleted());
        assertEquals(20, result.getTimeSpentMinutes());
    }
}
