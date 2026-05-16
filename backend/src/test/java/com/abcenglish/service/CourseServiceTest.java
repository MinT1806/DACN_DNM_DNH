package com.abcenglish.service;

import com.abcenglish.dto.CourseDTO;
import com.abcenglish.entity.Course;
import com.abcenglish.entity.Lesson;
import com.abcenglish.entity.User;
import com.abcenglish.entity.UserProgress;
import com.abcenglish.repository.CourseRepository;
import com.abcenglish.repository.LessonRepository;
import com.abcenglish.repository.UserProgressRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CourseServiceTest {

    @Mock private CourseRepository courseRepository;
    @Mock private LessonRepository lessonRepository;
    @Mock private UserProgressRepository progressRepository;

    private CourseService service;

    private Course makeCourse(Long id, String title, String desc) {
        Course c = new Course();
        c.setId(id);
        c.setTitle(title);
        c.setDescription(desc);
        return c;
    }

    @BeforeEach
    void setUp() {
        service = new CourseService(courseRepository, lessonRepository, progressRepository);
    }

    @Test
    void getAllCourses_shouldReturnDTOs() {
        Course c1 = makeCourse(1L, "A1 Basics", "Learn A1");
        Course c2 = makeCourse(2L, "A2 Intermediate", "Learn A2");

        when(courseRepository.findAll()).thenReturn(List.of(c1, c2));

        List<CourseDTO> courses = service.getAllCourses();

        assertEquals(2, courses.size());
        verify(courseRepository).findAll();
    }

    @Test
    void getCourseById_shouldReturnDTO() {
        Course course = makeCourse(1L, "Test Course", "Desc");

        when(courseRepository.findById(1L)).thenReturn(Optional.of(course));

        CourseDTO result = service.getCourseById(1L);

        assertNotNull(result);
        assertEquals("Test Course", result.getTitle());
    }

    @Test
    void getCourseById_notFound_shouldReturnNull() {
        when(courseRepository.findById(999L)).thenReturn(Optional.empty());

        CourseDTO result = service.getCourseById(999L);

        assertNull(result);
    }

    @Test
    void getCourseProgress_shouldReturnCorrectLessonCount() {
        Course course = makeCourse(1L, "Test", "Desc");

        Lesson l1 = new Lesson(); l1.setId(1L);
        Lesson l2 = new Lesson(); l2.setId(2L);
        Lesson l3 = new Lesson(); l3.setId(3L);

        UserProgress p1 = new UserProgress();
        p1.setLessonId(1L);
        p1.setCompleted(true);

        UserProgress p2 = new UserProgress();
        p2.setLessonId(2L);
        p2.setCompleted(false);

        when(lessonRepository.findByCourseIdOrderByOrderIndex(1L)).thenReturn(List.of(l1, l2, l3));
        when(progressRepository.findByUserIdAndCourseId(1L, 1L)).thenReturn(List.of(p1, p2));

        Map<String, Object> progress = service.getCourseProgress(1L, 1L);

        assertEquals(3, progress.get("totalLessons"));
        assertTrue(progress.get("completedLessons") instanceof Number);
        assertEquals(1, ((Number) progress.get("completedLessons")).intValue());
    }

    @Test
    void getCourseProgress_shouldMarkCompletedLessons() {
        Lesson l1 = new Lesson(); l1.setId(1L);
        Lesson l2 = new Lesson(); l2.setId(2L);

        UserProgress p1 = new UserProgress();
        p1.setLessonId(1L);
        p1.setCompleted(true);

        when(lessonRepository.findByCourseIdOrderByOrderIndex(1L)).thenReturn(List.of(l1, l2));
        when(progressRepository.findByUserIdAndCourseId(1L, 1L)).thenReturn(List.of(p1));

        Map<String, Object> progress = service.getCourseProgress(1L, 1L);

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> lessons = (List<Map<String, Object>>) progress.get("lessons");
        assertTrue((Boolean) lessons.get(0).get("completed"));
        assertFalse((Boolean) lessons.get(1).get("completed"));
    }

    @Test
    void getLessonsByCourse_shouldReturnOrderedLessons() {
        Lesson l1 = new Lesson(); l1.setId(1L); l1.setOrderIndex(1);
        Lesson l2 = new Lesson(); l2.setId(2L); l2.setOrderIndex(2);

        when(lessonRepository.findByCourseIdOrderByOrderIndex(1L)).thenReturn(List.of(l1, l2));

        List<Lesson> lessons = service.getLessonsByCourse(1L);

        assertEquals(2, lessons.size());
        verify(lessonRepository).findByCourseIdOrderByOrderIndex(1L);
    }

    @Test
    void getFeaturedCourses_shouldReturnFeaturedOnly() {
        Course c = makeCourse(1L, "Featured", "Desc");

        when(courseRepository.findByFeaturedTrue()).thenReturn(List.of(c));

        List<CourseDTO> courses = service.getFeaturedCourses();

        assertEquals(1, courses.size());
        verify(courseRepository).findByFeaturedTrue();
    }

    @Test
    void getCoursesByLevel_invalidLevel_shouldReturnEmptyList() {
        // Level "INVALID" causes exception in service -> returns empty list
        // Repository is NOT called, so no stubbing needed
        List<CourseDTO> courses = service.getCoursesByLevel("INVALID");
        assertTrue(courses.isEmpty());
    }
}
