package com.abcenglish.service;

import com.abcenglish.dto.CourseDTO;
import com.abcenglish.dto.VocabDTO;
import com.abcenglish.entity.Course;
import com.abcenglish.entity.Lesson;
import com.abcenglish.entity.User;
import com.abcenglish.entity.UserProgress;
import com.abcenglish.entity.VocabularyWord;
import com.abcenglish.repository.CourseRepository;
import com.abcenglish.repository.LessonRepository;
import com.abcenglish.repository.UserProgressRepository;
import com.abcenglish.repository.VocabularyRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class CourseService {

    private final CourseRepository courseRepository;
    private final LessonRepository lessonRepository;
    private final UserProgressRepository progressRepository;

    public CourseService(CourseRepository courseRepository, LessonRepository lessonRepository,
                         UserProgressRepository progressRepository) {
        this.courseRepository = courseRepository;
        this.lessonRepository = lessonRepository;
        this.progressRepository = progressRepository;
    }

    public List<CourseDTO> getAllCourses() {
        List<Course> courses = courseRepository.findAll();
        List<CourseDTO> result = new ArrayList<CourseDTO>();
        for (Course course : courses) {
            result.add(CourseDTO.fromEntity(course));
        }
        return result;
    }

    public List<CourseDTO> getCoursesByLevel(String level) {
        try {
            User.Level lvl = User.Level.valueOf(level.toUpperCase());
            List<Course> courses = courseRepository.findByLevel(lvl);
            List<CourseDTO> result = new ArrayList<CourseDTO>();
            for (Course course : courses) {
                result.add(CourseDTO.fromEntity(course));
            }
            return result;
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }

    public List<CourseDTO> getFeaturedCourses() {
        List<Course> courses = courseRepository.findByFeaturedTrue();
        List<CourseDTO> result = new ArrayList<CourseDTO>();
        for (Course course : courses) {
            result.add(CourseDTO.fromEntity(course));
        }
        return result;
    }

    public CourseDTO getCourseById(Long id) {
        return courseRepository.findById(id).map(CourseDTO::fromEntity).orElse(null);
    }

    public List<Lesson> getLessonsByCourse(Long courseId) {
        return lessonRepository.findByCourseIdOrderByOrderIndex(courseId);
    }

    public Map<String, Object> getCourseProgress(Long courseId, Long userId) {
        List<UserProgress> progress = progressRepository.findByUserIdAndCourseId(userId, courseId);
        List<Lesson> lessons = lessonRepository.findByCourseIdOrderByOrderIndex(courseId);

        Map<String, Object> result = new HashMap<String, Object>();
        result.put("totalLessons", lessons.size());
        long completedCount = progress.stream().filter(UserProgress::isCompleted).count();
        result.put("completedLessons", completedCount);

        List<Map<String, Object>> lessonMaps = new ArrayList<Map<String, Object>>();
        for (Lesson l : lessons) {
            Map<String, Object> lessonMap = new HashMap<String, Object>();
            lessonMap.put("id", l.getId());
            lessonMap.put("title", l.getTitle());
            lessonMap.put("durationMinutes", l.getDurationMinutes());
            boolean isCompleted = false;
            for (UserProgress p : progress) {
                if (p.getLessonId() != null && p.getLessonId().equals(l.getId()) && p.isCompleted()) {
                    isCompleted = true;
                    break;
                }
            }
            lessonMap.put("completed", isCompleted);
            lessonMaps.add(lessonMap);
        }
        result.put("lessons", lessonMaps);
        return result;
    }
}
