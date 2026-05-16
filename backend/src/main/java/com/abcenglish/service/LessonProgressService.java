package com.abcenglish.service;

import com.abcenglish.entity.LessonProgress;
import com.abcenglish.repository.LessonProgressRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class LessonProgressService {

    private final LessonProgressRepository progressRepository;

    public LessonProgressService(LessonProgressRepository progressRepository) {
        this.progressRepository = progressRepository;
    }

    public Optional<LessonProgress> getByUserAndLesson(Long userId, Long lessonId) {
        return progressRepository.findByUserIdAndLessonId(userId, lessonId);
    }

    public Map<String, Object> getProgressDetail(Long userId, Long lessonId) {
        Optional<LessonProgress> pOpt = progressRepository.findByUserIdAndLessonId(userId, lessonId);
        if (pOpt.isEmpty()) {
            return Map.of(
                "lessonId", lessonId,
                "contentViewed", false,
                "exercisesCompleted", false,
                "testCompleted", false,
                "lessonCompleted", false,
                "totalScore", 0,
                "timeSpentSeconds", 0
            );
        }

        LessonProgress p = pOpt.get();
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("id", p.getId());
        result.put("lessonId", p.getLessonId());
        result.put("courseId", p.getCourseId());
        result.put("contentViewed", p.isContentViewed());
        result.put("exercisesCompleted", p.isExercisesCompleted());
        result.put("testCompleted", p.isTestCompleted());
        result.put("lessonCompleted", p.isLessonCompleted());
        result.put("contentScore", p.getContentScore());
        result.put("exerciseScore", p.getExerciseScore());
        result.put("testScore", p.getTestScore());
        result.put("totalScore", p.getTotalScore());
        result.put("timeSpentSeconds", p.getTimeSpentSeconds());
        result.put("exerciseTimeSpentSeconds", p.getExerciseTimeSpentSeconds());
        result.put("testTimeSpentSeconds", p.getTestTimeSpentSeconds());

        if (p.getCompletedSections() != null) {
            result.put("completedSections", Arrays.asList(p.getCompletedSections().split(",")));
        } else {
            result.put("completedSections", Collections.emptyList());
        }

        result.put("contentViewedAt", p.getContentViewedAt() != null ? p.getContentViewedAt().toString() : null);
        result.put("exercisesCompletedAt", p.getExercisesCompletedAt() != null ? p.getExercisesCompletedAt().toString() : null);
        result.put("testCompletedAt", p.getTestCompletedAt() != null ? p.getTestCompletedAt().toString() : null);
        result.put("lessonCompletedAt", p.getLessonCompletedAt() != null ? p.getLessonCompletedAt().toString() : null);
        result.put("lastAccessedAt", p.getLastAccessedAt() != null ? p.getLastAccessedAt().toString() : null);

        return result;
    }

    @Transactional
    public LessonProgress updateSection(Long userId, Long lessonId, Long courseId,
                                        String section, int score, int timeSpentSeconds, boolean completed) {
        Optional<LessonProgress> existing = progressRepository.findByUserIdAndLessonId(userId, lessonId);
        LessonProgress progress;
        if (existing.isPresent()) {
            progress = existing.get();
        } else {
            progress = new LessonProgress();
            progress.setUserId(userId);
            progress.setLessonId(lessonId);
            progress.setCourseId(courseId);
        }

        switch (section.toLowerCase()) {
            case "content" -> {
                progress.setContentViewed(completed || progress.isContentViewed());
                if (completed) progress.setContentViewedAt(LocalDateTime.now());
                progress.setContentScore(Math.max(progress.getContentScore(), score));
            }
            case "exercises" -> {
                progress.setExercisesCompleted(completed);
                if (completed) progress.setExercisesCompletedAt(LocalDateTime.now());
                progress.setExerciseScore(score);
                progress.setExerciseTimeSpentSeconds(progress.getExerciseTimeSpentSeconds() + timeSpentSeconds);
            }
            case "test" -> {
                progress.setTestCompleted(completed);
                if (completed) progress.setTestCompletedAt(LocalDateTime.now());
                progress.setTestScore(score);
                progress.setTestTimeSpentSeconds(progress.getTestTimeSpentSeconds() + timeSpentSeconds);
            }
        }

        int total = progress.getContentScore() + progress.getExerciseScore() + progress.getTestScore();
        progress.setTotalScore(total);
        progress.setTimeSpentSeconds(progress.getTimeSpentSeconds() + timeSpentSeconds);

        if (progress.isContentViewed() && progress.isExercisesCompleted() && progress.isTestCompleted()) {
            progress.setLessonCompleted(true);
            progress.setLessonCompletedAt(LocalDateTime.now());
        }

        return progressRepository.save(progress);
    }

    @Transactional
    public LessonProgress markContentViewed(Long userId, Long lessonId, Long courseId) {
        Optional<LessonProgress> existing = progressRepository.findByUserIdAndLessonId(userId, lessonId);
        LessonProgress progress;
        if (existing.isPresent()) {
            progress = existing.get();
        } else {
            progress = new LessonProgress();
            progress.setUserId(userId);
            progress.setLessonId(lessonId);
            progress.setCourseId(courseId);
        }

        progress.setContentViewed(true);
        progress.setContentViewedAt(LocalDateTime.now());

        return progressRepository.save(progress);
    }

    public List<Map<String, Object>> getCourseProgress(Long userId, Long courseId) {
        List<LessonProgress> allProgress = progressRepository.findByUserIdAndCourseId(userId, courseId);
        return allProgress.stream().map(p -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("lessonId", p.getLessonId());
            m.put("contentViewed", p.isContentViewed());
            m.put("exercisesCompleted", p.isExercisesCompleted());
            m.put("testCompleted", p.isTestCompleted());
            m.put("lessonCompleted", p.isLessonCompleted());
            m.put("totalScore", p.getTotalScore());
            m.put("timeSpentSeconds", p.getTimeSpentSeconds());
            return m;
        }).toList();
    }

    public Map<String, Object> getUserStats(Long userId) {
        List<LessonProgress> allProgress = progressRepository.findByUserId(userId);
        int totalLessons = allProgress.size();
        int completedLessons = (int) allProgress.stream().filter(LessonProgress::isLessonCompleted).count();
        int totalTimeSeconds = allProgress.stream().mapToInt(LessonProgress::getTimeSpentSeconds).sum();
        double avgScore = allProgress.stream().mapToInt(LessonProgress::getTotalScore).average().orElse(0);

        return Map.of(
            "totalLessons", totalLessons,
            "completedLessons", completedLessons,
            "completionRate", totalLessons > 0 ? Math.round((completedLessons * 100.0 / totalLessons) * 10.0) / 10.0 : 0,
            "totalTimeMinutes", totalTimeSeconds / 60,
            "averageScore", Math.round(avgScore * 10.0) / 10.0
        );
    }
}
