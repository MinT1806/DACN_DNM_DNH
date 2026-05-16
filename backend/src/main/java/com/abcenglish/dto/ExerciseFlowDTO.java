package com.abcenglish.dto;

import java.util.List;
import java.util.Map;

public class ExerciseFlowDTO {

    public record ExerciseDetailResponse(
        Long id,
        String title,
        String description,
        String type,
        String level,
        int duration,
        int maxScore,
        String topic,
        String category,
        String instructions,
        String content,
        List<QuestionDTO> questions,
        int questionCount
    ) {}

    public record QuestionDTO(
        Long id,
        String question,
        String type,
        String content,
        Object options,
        int orderIndex,
        int points,
        String explanation
    ) {}

    public record ExerciseSubmitRequest(
        Map<String, Object> answers,
        int timeSpentSeconds
    ) {}

    public record ExerciseSubmitResponse(
        Long exerciseId,
        String title,
        int totalQuestions,
        int correctAnswers,
        double score,
        int xpEarned,
        boolean completed,
        String completedAt,
        List<QuestionResultDTO> questionResults,
        AiGradingSummaryDTO aiGrading
    ) {}

    public record QuestionResultDTO(
        Long questionId,
        String question,
        String type,
        String userAnswer,
        String correctAnswer,
        Boolean correct,
        Double correctRatio,
        Integer correctPlacements,
        Integer totalPlacements,
        Double aiScore,
        String aiFeedback,
        List<Map<String, Object>> aiDetails,
        String explanation
    ) {}

    public record AiGradingSummaryDTO(
        Double score,
        List<AiGradingDetailDTO> details,
        String summary
    ) {}

    public record AiGradingDetailDTO(
        String question,
        Double score,
        String feedback,
        String type
    ) {}

    public record SingleQuestionGradeRequest(
        Long questionId,
        String answer,
        String audioTranscript
    ) {}

    public record SingleQuestionGradeResponse(
        Double score,
        String feedback,
        List<Map<String, Object>> details,
        Map<String, Object> extras
    ) {}

    public record SpeakingGradeRequest(
        Long questionId,
        String audioUrl,
        String audioTranscript
    ) {}
}
