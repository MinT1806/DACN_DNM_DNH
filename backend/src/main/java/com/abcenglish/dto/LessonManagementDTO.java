package com.abcenglish.dto;

import com.abcenglish.entity.Course;
import com.abcenglish.entity.Lesson;
import com.abcenglish.entity.User;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public class LessonManagementDTO {

    // === Lesson CRUD ===
    public record CreateLessonRequest(
            String title,
            String content,
            String videoUrl,
            int orderIndex,
            int durationMinutes,
            Long courseId,
            String level
    ) {}

    public record UpdateLessonRequest(
            String title,
            String content,
            String videoUrl,
            int orderIndex,
            int durationMinutes,
            String level,
            boolean active
    ) {}

    public record LessonDetailDTO(
            Long id,
            String title,
            String content,
            String videoUrl,
            int orderIndex,
            int durationMinutes,
            Long courseId,
            String courseTitle,
            String level,
            boolean active,
            String createdAt,
            String updatedAt
    ) {}

    // === Lesson Content ===
    public record LessonContentDTO(
            Long id,
            Long lessonId,
            String textContent,
            String grammarRules,
            String vocabulary,
            String keyPoints,
            String audioUrl,
            String imageUrl,
            String videoSubtitles
    ) {}

    public record SaveContentRequest(
            String textContent,
            String grammarRules,
            String vocabulary,
            String keyPoints,
            String audioUrl,
            String imageUrl,
            String videoSubtitles
    ) {}

    // === Video Subtitle ===
    public record SubtitleDTO(
            Long id,
            Long lessonId,
            String language,
            String content,
            int startTime,
            int endTime
    ) {}

    public record SaveSubtitleRequest(
            String language,
            String content,
            int startTime,
            int endTime
    ) {}

    // === Key Points ===
    public record KeyPointDTO(
            Long id,
            Long lessonId,
            String point,
            String type,
            int orderIndex
    ) {}

    // === Vocabulary ===
    public record LessonVocabularyDTO(
            Long id,
            Long lessonId,
            String word,
            String pronunciation,
            String translation,
            String definition,
            String example,
            String audioUrl
    ) {}

    // === Course Management ===
    public record CreateCourseRequest(
            String title,
            String description,
            String level,
            String instructor,
            String instructorAvatar,
            String thumbnailUrl,
            String category,
            boolean featured
    ) {}

    public record UpdateCourseRequest(
            String title,
            String description,
            String level,
            String instructor,
            String instructorAvatar,
            String thumbnailUrl,
            String category,
            boolean featured,
            boolean active
    ) {}

    public record CourseDetailDTO(
            Long id,
            String title,
            String description,
            String level,
            String instructor,
            String instructorAvatar,
            int totalLessons,
            int completedLessons,
            double rating,
            String thumbnailUrl,
            String category,
            boolean featured,
            int enrolledCount,
            List<LessonListDTO> lessons,
            CourseProgressDTO progress,
            boolean enrolled,
            String createdAt
    ) {}

    public record LessonListDTO(
            Long id,
            String title,
            int orderIndex,
            int durationMinutes,
            boolean completed,
            boolean locked,
            boolean inProgress,
            int score
    ) {}

    public record CourseProgressDTO(
            int completedLessons,
            int totalLessons,
            double percentage,
            int totalTimeSpent,
            double averageScore
    ) {}

    // === Exercise Management ===
    public record CreateExerciseRequest(
            String title,
            String description,
            String type,
            String level,
            String topic,
            String category,
            String content,
            String instructions,
            int durationMinutes,
            int maxScore,
            List<QuestionRequest> questions
    ) {}

    public record QuestionRequest(
            String question,
            String type,
            String content,
            List<String> options,
            String correctAnswer,
            String explanation,
            int points
    ) {}

    // === Mini Test ===
    public record CreateMiniTestRequest(
            Long lessonId,
            String title,
            String description,
            int durationMinutes,
            int passingScore,
            List<MiniTestQuestionRequest> questions
    ) {}

    public record MiniTestQuestionRequest(
            String question,
            String type,
            String content,
            List<String> options,
            String correctAnswer,
            String explanation,
            int points
    ) {}

    public record MiniTestDTO(
            Long id,
            Long lessonId,
            String title,
            String description,
            int durationMinutes,
            int passingScore,
            int maxScore,
            int questionCount,
            List<MiniTestQuestionDTO> questions,
            boolean completed,
            Double lastScore
    ) {}

    public record MiniTestQuestionDTO(
            Long id,
            String question,
            String type,
            String content,
            List<String> options,
            int orderIndex,
            int points,
            String explanation
    ) {}

    public record MiniTestSubmitRequest(
            Map<Long, Object> answers,
            int timeSpentSeconds
    ) {}

    public record MiniTestResultDTO(
            Long id,
            Long lessonId,
            Long testId,
            String testTitle,
            int totalQuestions,
            int correctAnswers,
            int score,
            String percentage,
            boolean passed,
            int timeSpentSeconds,
            String completedAt,
            List<QuestionResultDTO> questionResults,
            String aiFeedback
    ) {}

    public record QuestionResultDTO(
            Long questionId,
            String question,
            String userAnswer,
            String correctAnswer,
            boolean correct,
            int points,
            int earnedPoints,
            String explanation
    ) {}

    // === Completion Settings ===
    public record CompletionSettingsDTO(
            Long lessonId,
            boolean requireContentView,
            boolean requireExercises,
            boolean requireMiniTest,
            int minTestScore,
            int minExerciseScore,
            boolean autoUnlockNext,
            String completionMessage,
            String certificateTemplate
    ) {}

    public record SaveCompletionSettingsRequest(
            boolean requireContentView,
            boolean requireExercises,
            boolean requireMiniTest,
            int minTestScore,
            int minExerciseScore,
            boolean autoUnlockNext,
            String completionMessage,
            String certificateTemplate
    ) {}

    // === AI Feedback ===
    public record ExerciseFeedbackDTO(
            int score,
            String feedback,
            String strengths,
            String improvements,
            String nextSteps,
            List<String> suggestedResources
    ) {}

    // === Builder helpers ===
    public static LessonDetailDTO fromLesson(Lesson l, String courseTitle) {
        return new LessonDetailDTO(
                l.getId(),
                l.getTitle(),
                l.getContent(),
                l.getVideoUrl(),
                l.getOrderIndex(),
                l.getDurationMinutes(),
                l.getCourseId(),
                courseTitle,
                l.getLevel() != null ? l.getLevel().name() : null,
                l.isActive(),
                l.getCreatedAt() != null ? l.getCreatedAt().toString() : null,
                l.getUpdatedAt() != null ? l.getUpdatedAt().toString() : null
        );
    }

    public static CourseDetailDTO fromCourse(Course c, List<LessonListDTO> lessons, CourseProgressDTO progress, boolean enrolled) {
        return new CourseDetailDTO(
                c.getId(),
                c.getTitle(),
                c.getDescription(),
                c.getLevel() != null ? c.getLevel().name() : null,
                c.getInstructor(),
                c.getInstructorAvatar(),
                c.getTotalLessons(),
                c.getCompletedLessons(),
                c.getRating(),
                c.getThumbnailUrl(),
                c.getCategory(),
                c.isFeatured(),
                c.getEnrolledCount(),
                lessons,
                progress,
                enrolled,
                c.getCreatedAt() != null ? c.getCreatedAt().toString() : null
        );
    }
}
