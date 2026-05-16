package com.abcenglish.service;

import com.abcenglish.entity.*;
import com.abcenglish.repository.*;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class LessonService {

    private final LessonRepository lessonRepository;
    private final CourseRepository courseRepository;
    private final UserProgressRepository progressRepository;
    private final QuizResultRepository quizResultRepository;
    private final ExerciseRepository exerciseRepository;
    private final ExerciseQuestionRepository questionRepository;
    private final AIService aiService;
    private final ObjectMapper objectMapper;

    public LessonService(LessonRepository lessonRepository,
                        CourseRepository courseRepository,
                        UserProgressRepository progressRepository,
                        QuizResultRepository quizResultRepository,
                        ExerciseRepository exerciseRepository,
                        ExerciseQuestionRepository questionRepository,
                        AIService aiService) {
        this.lessonRepository = lessonRepository;
        this.courseRepository = courseRepository;
        this.progressRepository = progressRepository;
        this.quizResultRepository = quizResultRepository;
        this.exerciseRepository = exerciseRepository;
        this.questionRepository = questionRepository;
        this.aiService = aiService;
        this.objectMapper = new ObjectMapper();
    }

    public Lesson getLessonById(Long id) {
        return lessonRepository.findById(id).orElse(null);
    }

    public List<Lesson> getLessonsByCourse(Long courseId) {
        return lessonRepository.findByCourseIdOrderByOrderIndex(courseId);
    }

    public Map<String, Object> getLessonDetail(Long lessonId, Long userId) {
        Lesson lesson = lessonRepository.findById(lessonId).orElse(null);
        if (lesson == null) return null;

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("id", lesson.getId());
        result.put("title", lesson.getTitle());
        result.put("content", lesson.getContent());
        result.put("videoUrl", lesson.getVideoUrl());
        result.put("orderIndex", lesson.getOrderIndex());
        result.put("durationMinutes", lesson.getDurationMinutes());
        result.put("courseId", lesson.getCourseId());

        // Exercises for this lesson
        List<Exercise> exercises = exerciseRepository.findAll().stream()
                .filter(e -> {
                    String cat = e.getCategory();
                    if (cat == null) return false;
                    return cat.equals(String.valueOf(lesson.getCourseId())) ||
                           cat.contains("lesson_" + lessonId);
                })
                .toList();
        result.put("exercises", exercises.stream().map(e -> {
            Map<String, Object> ex = new LinkedHashMap<>();
            ex.put("id", e.getId());
            ex.put("title", e.getTitle());
            ex.put("type", e.getType() != null ? e.getType().name() : null);
            ex.put("duration", e.getDurationMinutes());
            ex.put("questionsCount", questionRepository.findByExerciseId(e.getId()).size());
            return ex;
        }).toList());

        // User progress for this lesson
        if (userId != null) {
            Optional<UserProgress> progress = progressRepository.findByUserIdAndLessonId(userId, lessonId);
            result.put("completed", progress.map(UserProgress::isCompleted).orElse(false));
            result.put("score", progress.map(UserProgress::getScore).orElse(0));
            result.put("timeSpentMinutes", progress.map(UserProgress::getTimeSpentMinutes).orElse(0));

            // Navigation: prev/next lesson
            List<Lesson> siblings = lessonRepository.findByCourseIdOrderByOrderIndex(lesson.getCourseId());
            int idx = -1;
            for (int i = 0; i < siblings.size(); i++) {
                if (siblings.get(i).getId().equals(lessonId)) {
                    idx = i;
                    break;
                }
            }
            Map<String, Object> nav = new LinkedHashMap<>();
            nav.put("hasPrevious", idx > 0);
            nav.put("hasNext", idx < siblings.size() - 1);
            if (idx > 0) {
                Lesson prev = siblings.get(idx - 1);
                nav.put("previousId", prev.getId());
                nav.put("previousTitle", prev.getTitle());
            }
            if (idx < siblings.size() - 1) {
                Lesson next = siblings.get(idx + 1);
                nav.put("nextId", next.getId());
                nav.put("nextTitle", next.getTitle());
            }
            result.put("navigation", nav);
        } else {
            result.put("completed", false);
            result.put("score", 0);
        }

        return result;
    }

    @Transactional
    public Map<String, Object> startLesson(Long lessonId, Long userId) {
        Optional<UserProgress> existing = progressRepository.findByUserIdAndLessonId(userId, lessonId);
        UserProgress progress;
        if (existing.isPresent()) {
            progress = existing.get();
        } else {
            Lesson lesson = lessonRepository.findById(lessonId).orElse(null);
            progress = new UserProgress();
            progress.setUserId(userId);
            progress.setLessonId(lessonId);
            if (lesson != null) {
                progress.setCourseId(lesson.getCourseId());
            }
        }
        progress.setLastAccessedAt(LocalDateTime.now());
        progressRepository.save(progress);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("started", true);
        result.put("progressId", progress.getId());
        result.put("lastAccessedAt", progress.getLastAccessedAt() != null ? progress.getLastAccessedAt().toString() : null);
        return result;
    }

    @Transactional
    public UserProgress completeLesson(Long lessonId, Long userId, int score, int timeSpent) {
        Optional<UserProgress> existing = progressRepository.findByUserIdAndLessonId(userId, lessonId);
        UserProgress progress;
        if (existing.isPresent()) {
            progress = existing.get();
        } else {
            Lesson lesson = lessonRepository.findById(lessonId).orElse(null);
            progress = new UserProgress();
            progress.setUserId(userId);
            progress.setLessonId(lessonId);
            if (lesson != null) {
                progress.setCourseId(lesson.getCourseId());
            }
        }

        progress.setCompleted(true);
        progress.setScore(score);
        progress.setTimeSpentMinutes(timeSpent);
        progress.setCompletedAt(LocalDateTime.now());
        progress = progressRepository.save(progress);

        // Update course completion count
        if (progress.getCourseId() != null) {
            courseRepository.findById(progress.getCourseId()).ifPresent(course -> {
                long completed = progressRepository.findByUserIdAndCourseId(userId, course.getId()).stream()
                        .filter(UserProgress::isCompleted).count();
                course.setCompletedLessons((int) completed);
                courseRepository.save(course);
            });
        }

        return progress;
    }

    @Transactional
    public Lesson createLesson(Long courseId, String title, String content, String videoUrl,
                              int orderIndex, int durationMinutes) {
        Lesson lesson = new Lesson();
        lesson.setCourseId(courseId);
        lesson.setTitle(title);
        lesson.setContent(content);
        lesson.setVideoUrl(videoUrl);
        lesson.setOrderIndex(orderIndex);
        lesson.setDurationMinutes(durationMinutes);
        return lessonRepository.save(lesson);
    }

    @Transactional
    public Lesson updateLesson(Long lessonId, String title, String content, String videoUrl,
                              int orderIndex, int durationMinutes) {
        return lessonRepository.findById(lessonId).map(l -> {
            if (title != null) l.setTitle(title);
            if (content != null) l.setContent(content);
            if (videoUrl != null) l.setVideoUrl(videoUrl);
            if (orderIndex >= 0) l.setOrderIndex(orderIndex);
            if (durationMinutes > 0) l.setDurationMinutes(durationMinutes);
            return lessonRepository.save(l);
        }).orElse(null);
    }

    @Transactional
    public boolean deleteLesson(Long lessonId) {
        if (lessonRepository.existsById(lessonId)) {
            progressRepository.findByUserIdAndLessonId(null, lessonId);
            lessonRepository.deleteById(lessonId);
            return true;
        }
        return false;
    }
}
