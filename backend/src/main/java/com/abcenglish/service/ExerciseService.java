package com.abcenglish.service;

import com.abcenglish.entity.*;
import com.abcenglish.repository.*;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class ExerciseService {

    private final ExerciseRepository exerciseRepository;
    private final ExerciseQuestionRepository questionRepository;
    private final QuizResultRepository quizResultRepository;
    private final UserProgressRepository progressRepository;
    private final ExerciseSubmissionRepository submissionRepository;
    private final VocabularyRepository vocabularyRepository;
    private final SavedWordRepository savedWordRepository;
    private final AIGradingService aiGradingService;
    private final ObjectMapper objectMapper;

    public ExerciseService(
            ExerciseRepository exerciseRepository,
            ExerciseQuestionRepository questionRepository,
            QuizResultRepository quizResultRepository,
            UserProgressRepository progressRepository,
            ExerciseSubmissionRepository submissionRepository,
            VocabularyRepository vocabularyRepository,
            SavedWordRepository savedWordRepository,
            AIGradingService aiGradingService) {
        this.exerciseRepository = exerciseRepository;
        this.questionRepository = questionRepository;
        this.quizResultRepository = quizResultRepository;
        this.progressRepository = progressRepository;
        this.submissionRepository = submissionRepository;
        this.vocabularyRepository = vocabularyRepository;
        this.savedWordRepository = savedWordRepository;
        this.aiGradingService = aiGradingService;
        this.objectMapper = new ObjectMapper();
    }

    @Transactional
    public Map<String, Object> submitExercise(Long exerciseId, Map<String, Object> answers, Long userId) {
        Exercise exercise = exerciseRepository.findById(exerciseId).orElse(null);
        if (exercise == null) throw new RuntimeException("Exercise not found: " + exerciseId);

        List<ExerciseQuestion> questions = questionRepository.findByExerciseIdOrderByOrderIndexAsc(exerciseId);

        int totalQuestions = questions.size();
        int correctCount = 0;
        double totalScore = 0;
        double maxScore = 0;
        List<Map<String, Object>> results = new ArrayList<>();
        Map<String, Object> overallAiGrading = new LinkedHashMap<>();

        // Track if we have any AI-graded questions
        boolean hasAiGrading = false;
        List<Map<String, Object>> aiGradingDetails = new ArrayList<>();

        for (ExerciseQuestion question : questions) {
            String answerKey = "q_" + question.getId();
            String userAnswer = getStringAnswer(answers, answerKey);
            String correctAnswer = question.getCorrectAnswer() != null ? question.getCorrectAnswer().trim() : "";

            Map<String, Object> qResult = new LinkedHashMap<>();
            qResult.put("questionId", question.getId());
            qResult.put("question", question.getQuestion());
            qResult.put("type", question.getType() != null ? question.getType().name() : "UNKNOWN");
            qResult.put("userAnswer", userAnswer);
            qResult.put("correctAnswer", correctAnswer);
            qResult.put("points", question.getPoints());
            qResult.put("explanation", question.getExplanation());

            boolean isCorrect = false;
            double earnedPoints = 0;
            AIGradingService.GradingResult aiResult = null;

            switch (question.getType()) {
                case MULTIPLE_CHOICE -> {
                    isCorrect = userAnswer.equalsIgnoreCase(correctAnswer);
                    if (isCorrect) correctCount++;
                    earnedPoints = isCorrect ? question.getPoints() : 0;
                    qResult.put("correct", isCorrect);
                    qResult.put("options", parseOptions(question.getOptions()));
                }
                case FILL_BLANK -> {
                    isCorrect = userAnswer.equalsIgnoreCase(correctAnswer);
                    if (isCorrect) correctCount++;
                    earnedPoints = isCorrect ? question.getPoints() : 0;
                    qResult.put("correct", isCorrect);
                }
                case MATCHING, DRAG_DROP -> {
                    // Drag & drop: answer format is JSON string like "{\"item_0\":\"slot_1\",\"item_1\":\"slot_0\"}"
                    DragDropResult ddResult = gradeDragDrop(userAnswer, correctAnswer, question.getOptions());
                    isCorrect = ddResult.isFullyCorrect;
                    if (isCorrect) correctCount++;
                    earnedPoints = ddResult.correctRatio * question.getPoints();
                    qResult.put("correct", isCorrect);
                    qResult.put("correctRatio", ddResult.correctRatio);
                    qResult.put("correctPlacements", ddResult.correctPlacements);
                    qResult.put("totalPlacements", ddResult.totalPlacements);
                }
                case ESSAY -> {
                    // Essay: always gets points based on AI grading (no auto-fail for empty)
                    earnedPoints = 0;
                    qResult.put("correct", null); // subjective - no auto-correct
                    if (!userAnswer.trim().isEmpty() && userAnswer.trim().length() >= 10) {
                        try {
                            aiResult = aiGradingService.gradeEssay(
                                    question.getQuestion(),
                                    userAnswer,
                                    exercise.getContent()
                            );
                            if (aiResult.score() != null) {
                                earnedPoints = (aiResult.score() / 10.0) * question.getPoints();
                                qResult.put("aiScore", aiResult.score());
                                qResult.put("aiFeedback", aiResult.feedback());
                                qResult.put("aiDetails", aiResult.details());
                                hasAiGrading = true;
                                aiGradingDetails.add(Map.of(
                                        "question", question.getQuestion(),
                                        "score", aiResult.score(),
                                        "feedback", aiResult.feedback(),
                                        "type", "essay"
                                ));
                            }
                        } catch (Exception e) {
                            qResult.put("aiFeedback", "Không thể chấm bài lúc này: " + e.getMessage());
                        }
                    } else {
                        qResult.put("aiFeedback", "Bài viết quá ngắn (cần ít nhất 10 ký tự)");
                    }
                }
                case TRANSLATION -> {
                    earnedPoints = 0;
                    qResult.put("correct", null);
                    if (!userAnswer.trim().isEmpty()) {
                        try {
                            aiResult = aiGradingService.gradeTranslation(
                                    question.getQuestion(),
                                    userAnswer,
                                    correctAnswer
                            );
                            if (aiResult.score() != null) {
                                earnedPoints = (aiResult.score() / 10.0) * question.getPoints();
                                qResult.put("aiScore", aiResult.score());
                                qResult.put("aiFeedback", aiResult.feedback());
                                qResult.put("aiDetails", aiResult.details());
                                hasAiGrading = true;
                                aiGradingDetails.add(Map.of(
                                        "question", question.getQuestion(),
                                        "score", aiResult.score(),
                                        "feedback", aiResult.feedback(),
                                        "type", "translation"
                                ));
                            }
                        } catch (Exception e) {
                            qResult.put("aiFeedback", "Không thể chấm bài lúc này.");
                        }
                    } else {
                        qResult.put("aiFeedback", "Vui lòng nhập câu trả lời.");
                    }
                }
                case PRONUNCIATION -> {
                    earnedPoints = 0;
                    qResult.put("correct", null);
                    if (!userAnswer.trim().isEmpty() && userAnswer.trim().length() >= 5) {
                        try {
                            aiResult = aiGradingService.gradeSpeaking(
                                    question.getQuestion(),
                                    userAnswer,
                                    exercise.getContent()
                            );
                            if (aiResult.score() != null) {
                                earnedPoints = (aiResult.score() / 10.0) * question.getPoints();
                                qResult.put("aiScore", aiResult.score());
                                qResult.put("aiFeedback", aiResult.feedback());
                                qResult.put("aiDetails", aiResult.details());
                                qResult.put("pronunciationTips", aiResult.criteriaScores().getOrDefault("pronunciation", ""));
                                qResult.put("transcriptAccuracy", aiResult.criteriaScores().getOrDefault("accuracy", ""));
                                hasAiGrading = true;
                                aiGradingDetails.add(Map.of(
                                        "question", question.getQuestion(),
                                        "score", aiResult.score(),
                                        "feedback", aiResult.feedback(),
                                        "type", "speaking"
                                ));
                            }
                        } catch (Exception e) {
                            qResult.put("aiFeedback", "Không thể chấm bài lúc này.");
                        }
                    } else {
                        qResult.put("aiFeedback", "Không nhận diện được giọng nói. Vui lòng thử lại.");
                    }
                }
            }

            totalScore += earnedPoints;
            maxScore += question.getPoints();

            // Save submission
            ExerciseSubmission submission = new ExerciseSubmission();
            submission.setUserId(userId);
            submission.setExerciseId(exerciseId);
            submission.setQuestionId(question.getId());
            submission.setUserAnswer(userAnswer);
            submission.setCorrectAnswer(correctAnswer);
            submission.setCorrect(isCorrect);
            submission.setQuestionType(question.getType() != null ? question.getType().name() : "UNKNOWN");
            submission.setPointsEarned((int) earnedPoints);
            submission.setMaxPoints(question.getPoints());
            if (aiResult != null && aiResult.score() != null) {
                submission.setAiScore(aiResult.score());
                submission.setAiFeedback(aiResult.feedback());
            }
            submissionRepository.save(submission);

            results.add(qResult);
        }

        // Calculate final score
        double score = maxScore > 0 ? (totalScore / maxScore) * 10 : 0;
        score = Math.round(score * 10.0) / 10.0;

        // Calculate XP
        int xpEarned = (int) Math.round(score * 10);

        // Save quiz result
        QuizResult quizResult = new QuizResult();
        quizResult.setUserId(userId);
        quizResult.setLessonId(exerciseId);
        quizResult.setTotalQuestions(totalQuestions);
        quizResult.setCorrectAnswers(correctCount);
        quizResult.setScore(score);
        quizResult.setQuizType(exercise.getType() != null ? exercise.getType().name() : "MIXED");
        quizResultRepository.save(quizResult);

        // Update user progress
        UserProgress progress = new UserProgress();
        progress.setUserId(userId);
        progress.setLessonId(exerciseId);
        if (exercise.getCategory() != null) {
            try {
                progress.setCourseId(Long.parseLong(exercise.getCategory()));
            } catch (Exception ignored) {}
        }
        progress.setScore((int) score);
        progress.setCompleted(score >= 5.0);
        if (score >= 5.0) {
            progress.setCompletedAt(LocalDateTime.now());
        }
        progressRepository.save(progress);

        // Build response
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("exerciseId", exerciseId);
        response.put("title", exercise.getTitle());
        response.put("totalQuestions", totalQuestions);
        response.put("correctAnswers", correctCount);
        response.put("totalScore", totalScore);
        response.put("maxScore", maxScore);
        response.put("score", score);
        response.put("xpEarned", xpEarned);
        response.put("completed", score >= 5.0);
        response.put("completedAt", LocalDateTime.now().toString());
        response.put("questionResults", results);

        // AI grading summary
        if (hasAiGrading) {
            double avgAiScore = aiGradingDetails.stream()
                    .mapToDouble(m -> ((Number) m.get("score")).doubleValue())
                    .average().orElse(0);
            overallAiGrading.put("score", Math.round(avgAiScore * 10.0) / 10.0);
            overallAiGrading.put("details", aiGradingDetails);
            overallAiGrading.put("summary", String.format(
                    "Bạn đã được %.1f/10 điểm cho phần tự luận. Xem chi tiết từng câu bên dưới.",
                    avgAiScore));
            response.put("aiGrading", overallAiGrading);
        }

        return response;
    }

    private String getStringAnswer(Map<String, Object> answers, String key) {
        Object val = answers.get(key);
        if (val == null) return "";
        if (val instanceof List) {
            return String.join(",", ((List<?>) val).stream()
                    .map(Object::toString)
                    .toList());
        }
        return val.toString();
    }

    private Object parseOptions(String options) {
        if (options == null || options.isBlank()) return null;
        try {
            return objectMapper.readValue(options, Object.class);
        } catch (Exception e) {
            return options;
        }
    }

    private DragDropResult gradeDragDrop(String userAnswer, String correctAnswerStr, String optionsJson) {
        DragDropResult result = new DragDropResult();
        result.totalPlacements = 0;
        result.correctPlacements = 0;

        if (userAnswer == null || userAnswer.isBlank()) {
            result.isFullyCorrect = false;
            result.correctRatio = 0;
            return result;
        }

        // Parse correct answer - expected format: JSON like "{\"item_0\":\"slot_1\",\"item_1\":\"slot_0\"}"
        Map<String, String> correctMap = new HashMap<>();
        Map<String, String> userMap = new HashMap<>();

        try {
            if (correctAnswerStr != null && !correctAnswerStr.isBlank()) {
                correctMap = objectMapper.readValue(correctAnswerStr, new TypeReference<Map<String, String>>() {});
            }
            if (userAnswer != null && !userAnswer.isBlank()) {
                userMap = objectMapper.readValue(userAnswer, new TypeReference<Map<String, String>>() {});
            }
        } catch (Exception e) {
            // Fallback: treat as comma-separated key:value pairs
            if (correctAnswerStr != null) {
                for (String pair : correctAnswerStr.split(",")) {
                    String[] parts = pair.trim().split(":");
                    if (parts.length == 2) {
                        correctMap.put(parts[0].trim(), parts[1].trim());
                    }
                }
            }
            if (!userAnswer.isBlank()) {
                for (String pair : userAnswer.split(",")) {
                    String[] parts = pair.trim().split(":");
                    if (parts.length == 2) {
                        userMap.put(parts[0].trim(), parts[1].trim());
                    }
                }
            }
        }

        result.totalPlacements = correctMap.size();
        if (result.totalPlacements == 0) {
            result.isFullyCorrect = false;
            result.correctRatio = 0;
            return result;
        }

        for (Map.Entry<String, String> entry : correctMap.entrySet()) {
            String userSlot = userMap.get(entry.getKey());
            if (entry.getValue().equals(userSlot)) {
                result.correctPlacements++;
            }
        }

        result.correctRatio = (double) result.correctPlacements / result.totalPlacements;
        result.isFullyCorrect = result.correctPlacements == result.totalPlacements;

        return result;
    }

    private static class DragDropResult {
        boolean isFullyCorrect;
        double correctRatio;
        int correctPlacements;
        int totalPlacements;
    }

    @Transactional
    public boolean saveWordFromExercise(Long userId, Long vocabularyId) {
        if (savedWordRepository.existsByUserIdAndVocabularyId(userId, vocabularyId)) {
            return false;
        }
        VocabularyWord vocab = vocabularyRepository.findById(vocabularyId).orElse(null);
        if (vocab == null) return false;

        SavedWord savedWord = new SavedWord();
        savedWord.setUserId(userId);
        savedWord.setVocabularyId(vocabularyId);
        savedWord.setWord(vocab.getWord());
        savedWord.setTranslation(vocab.getTranslation());
        savedWord.setPronunciation(vocab.getPronunciation());
        savedWord.setLevel(vocab.getLevel() != null ? vocab.getLevel().name() : null);
        savedWord.setSavedAt(LocalDateTime.now());
        savedWord.setLastReviewedAt(LocalDateTime.now());
        savedWordRepository.save(savedWord);
        return true;
    }
}
