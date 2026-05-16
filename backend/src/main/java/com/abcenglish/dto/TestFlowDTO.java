package com.abcenglish.dto;

import java.util.List;
import java.util.Map;

public class TestFlowDTO {

    public record TestDetailResponse(
        Long id,
        Long lessonId,
        String title,
        String description,
        int durationMinutes,
        int passingScore,
        int maxScore,
        int questionCount,
        List<TestQuestionDTO> questions,
        String sessionId,
        long remainingSeconds
    ) {}

    public record TestQuestionDTO(
        Long id,
        String question,
        String type,
        String content,
        Object options,
        int orderIndex,
        int points,
        String explanation
    ) {}

    public record StartTestRequest(
        Long lessonId,
        Long testId
    ) {}

    public record StartTestResponse(
        String sessionId,
        Long testId,
        int totalQuestions,
        int durationSeconds,
        long remainingSeconds,
        long startedAt
    ) {}

    public record SubmitTestRequest(
        String sessionId,
        Map<String, Object> answers,
        int timeSpentSeconds
    ) {}

    public record SubmitTestResponse(
        Long testId,
        String sessionId,
        int totalQuestions,
        int correctAnswers,
        double score,
        int xpEarned,
        boolean passed,
        int passingScore,
        int timeSpentSeconds,
        List<TestQuestionResultDTO> questionResults,
        AiGradingSummaryDTO aiGrading,
        String completedAt
    ) {}

    public record TestQuestionResultDTO(
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

    public record TestHistoryResponse(
        List<TestHistoryItemDTO> history,
        int totalTests,
        double averageScore,
        int totalPassed,
        int totalFailed
    ) {}

    public record TestHistoryItemDTO(
        Long id,
        Long testId,
        String testTitle,
        Long lessonId,
        String lessonTitle,
        double score,
        boolean passed,
        int correctAnswers,
        int totalQuestions,
        int timeSpentSeconds,
        int xpEarned,
        String submittedAt
    ) {}

    public record TestCreateRequest(
        Long lessonId,
        String title,
        String description,
        int durationMinutes,
        int passingScore,
        List<TestQuestionCreateDTO> questions
    ) {}

    public record TestQuestionCreateDTO(
        String question,
        String type,
        String content,
        List<String> options,
        String correctAnswer,
        String explanation,
        int points
    ) {}
}
