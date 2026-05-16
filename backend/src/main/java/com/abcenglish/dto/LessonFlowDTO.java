package com.abcenglish.dto;

import java.util.List;
import java.util.Map;

public class LessonFlowDTO {

    public record LessonDetailResponse(
        Long id,
        String title,
        String content,
        String videoUrl,
        int orderIndex,
        int durationMinutes,
        Long courseId,
        LessonContentDTO contentDetails,
        List<ExerciseSummaryDTO> exercises,
        LessonTestSummaryDTO test,
        LessonProgressDTO progress,
        NavigationDTO navigation
    ) {}

    public record LessonContentDTO(
        Long id,
        String textContent,
        String grammarRules,
        String vocabulary,
        String keyPoints,
        String audioUrl,
        String imageUrl
    ) {}

    public record ExerciseSummaryDTO(
        Long id,
        String title,
        String type,
        int duration,
        int questionsCount,
        int maxScore
    ) {}

    public record LessonTestSummaryDTO(
        Long id,
        String title,
        int durationMinutes,
        int questionCount,
        int passingScore
    ) {}

    public record LessonProgressDTO(
        Long id,
        boolean contentViewed,
        boolean exercisesCompleted,
        boolean testCompleted,
        boolean lessonCompleted,
        int contentScore,
        int exerciseScore,
        int testScore,
        int totalScore,
        int timeSpentSeconds,
        String completedSections
    ) {}

    public record NavigationDTO(
        boolean hasPrevious,
        boolean hasNext,
        Long previousId,
        String previousTitle,
        Long nextId,
        String nextTitle
    ) {}

    public record StartLessonRequest(
        int timeSpentSeconds
    ) {}

    public record UpdateProgressRequest(
        String section,
        int score,
        int timeSpentSeconds,
        boolean completed
    ) {}

    public record LessonContentRequest(
        String textContent,
        String grammarRules,
        String vocabulary,
        String keyPoints,
        String audioUrl,
        String imageUrl
    ) {}

    public record LessonCompleteRequest(
        int totalScore,
        int timeSpentSeconds
    ) {}
}
