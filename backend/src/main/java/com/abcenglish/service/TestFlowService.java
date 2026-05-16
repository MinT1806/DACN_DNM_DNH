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
public class TestFlowService {

    private final LessonTestRepository testRepository;
    private final TestQuestionRepository questionRepository;
    private final LessonTestResultRepository testResultRepository;
    private final LessonProgressRepository progressRepository;
    private final LessonRepository lessonRepository;
    private final CourseRepository courseRepository;
    private final AIGradingService aiGradingService;
    private final ObjectMapper objectMapper;

    public TestFlowService(
            LessonTestRepository testRepository,
            TestQuestionRepository questionRepository,
            LessonTestResultRepository testResultRepository,
            LessonProgressRepository progressRepository,
            LessonRepository lessonRepository,
            CourseRepository courseRepository,
            AIGradingService aiGradingService) {
        this.testRepository = testRepository;
        this.questionRepository = questionRepository;
        this.testResultRepository = testResultRepository;
        this.progressRepository = progressRepository;
        this.lessonRepository = lessonRepository;
        this.courseRepository = courseRepository;
        this.aiGradingService = aiGradingService;
        this.objectMapper = new ObjectMapper();
    }

    public Map<String, Object> getTestForLesson(Long lessonId, Long userId) {
        Optional<LessonTest> testOpt = testRepository.findFirstByLessonIdAndActiveTrue(lessonId);
        if (testOpt.isEmpty()) {
            return Map.of(
                "hasTest", false,
                "lessonId", lessonId
            );
        }

        LessonTest test = testOpt.get();
        List<TestQuestion> questions = questionRepository.findByTestIdOrderByOrderIndexAsc(test.getId());

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("hasTest", true);
        result.put("id", test.getId());
        result.put("lessonId", test.getLessonId());
        result.put("title", test.getTitle());
        result.put("description", test.getDescription());
        result.put("durationMinutes", test.getDurationMinutes());
        result.put("passingScore", test.getPassingScore());
        result.put("maxScore", test.getMaxScore());
        result.put("questionCount", questions.size());

        List<Map<String, Object>> questionList = questions.stream().map(q -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", q.getId());
            m.put("question", q.getQuestion());
            m.put("type", q.getType() != null ? q.getType().name() : null);
            m.put("content", q.getContent());
            m.put("options", parseOptions(q.getOptions()));
            m.put("orderIndex", q.getOrderIndex());
            m.put("points", q.getPoints());
            m.put("explanation", q.getExplanation());
            return m;
        }).toList();
        result.put("questions", questionList);

        return result;
    }

    @Transactional
    public Map<String, Object> startTest(Long lessonId, Long testId, Long userId) {
        LessonTest test = testRepository.findById(testId)
                .orElseThrow(() -> new RuntimeException("Test not found: " + testId));

        String sessionId = UUID.randomUUID().toString();
        int questionCount = questionRepository.countByTestId(testId);

        return Map.of(
            "sessionId", sessionId,
            "testId", testId,
            "lessonId", test.getLessonId(),
            "title", test.getTitle(),
            "totalQuestions", questionCount,
            "durationSeconds", test.getDurationMinutes() * 60,
            "remainingSeconds", test.getDurationMinutes() * 60,
            "startedAt", LocalDateTime.now().toString()
        );
    }

    @Transactional
    public Map<String, Object> submitTest(Long testId, String sessionId,
                                          Map<String, Object> answers, int timeSpentSeconds, Long userId) {
        LessonTest test = testRepository.findById(testId)
                .orElseThrow(() -> new RuntimeException("Test not found: " + testId));

        List<TestQuestion> questions = questionRepository.findByTestIdOrderByOrderIndexAsc(testId);
        int totalQuestions = questions.size();
        int correctCount = 0;
        double totalScore = 0;
        double maxScore = 0;
        List<Map<String, Object>> results = new ArrayList<>();
        boolean hasAiGrading = false;
        List<Map<String, Object>> aiGradingDetails = new ArrayList<>();

        for (TestQuestion question : questions) {
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
                case MULTIPLE_CHOICE, FILL_BLANK, LISTENING_CONTENT, READING_PASSAGE -> {
                    isCorrect = userAnswer.equalsIgnoreCase(correctAnswer);
                    if (isCorrect) correctCount++;
                    earnedPoints = isCorrect ? question.getPoints() : 0;
                    qResult.put("correct", isCorrect);
                    if (question.getOptions() != null) {
                        qResult.put("options", parseOptions(question.getOptions()));
                    }
                }
                case MATCHING, DRAG_DROP -> {
                    DragDropResult ddResult = gradeDragDrop(userAnswer, correctAnswer);
                    isCorrect = ddResult.isFullyCorrect;
                    if (isCorrect) correctCount++;
                    earnedPoints = ddResult.correctRatio * question.getPoints();
                    qResult.put("correct", isCorrect);
                    qResult.put("correctRatio", ddResult.correctRatio);
                    qResult.put("correctPlacements", ddResult.correctPlacements);
                    qResult.put("totalPlacements", ddResult.totalPlacements);
                }
                case ESSAY, TRANSLATION -> {
                    earnedPoints = 0;
                    qResult.put("correct", null);
                    if (!userAnswer.trim().isEmpty()) {
                        try {
                            if (question.getType() == TestQuestion.QuestionType.ESSAY) {
                                aiResult = aiGradingService.gradeEssay(
                                        question.getQuestion(), userAnswer, question.getContent());
                            } else {
                                aiResult = aiGradingService.gradeTranslation(
                                        question.getQuestion(), userAnswer, correctAnswer);
                            }
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
                                        "type", question.getType().name().toLowerCase()
                                ));
                            }
                        } catch (Exception e) {
                            qResult.put("aiFeedback", "Không thể chấm bài: " + e.getMessage());
                        }
                    }
                }
                case SPEAKING_PROMPT, PRONUNCIATION -> {
                    earnedPoints = 0;
                    qResult.put("correct", null);
                    if (!userAnswer.trim().isEmpty() && userAnswer.trim().length() >= 5) {
                        try {
                            aiResult = aiGradingService.gradeSpeaking(
                                    question.getQuestion(), userAnswer, question.getContent());
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
                                        "type", "speaking"
                                ));
                            }
                        } catch (Exception e) {
                            qResult.put("aiFeedback", "Không thể chấm bài: " + e.getMessage());
                        }
                    }
                }
            }

            totalScore += earnedPoints;
            maxScore += question.getPoints();
            results.add(qResult);
        }

        double score = maxScore > 0 ? (totalScore / maxScore) * 10 : 0;
        score = Math.round(score * 10.0) / 10.0;
        int xpEarned = (int) Math.round(score * 10);
        boolean passed = score >= test.getPassingScore();

        LessonTestResult testResult = new LessonTestResult();
        testResult.setUserId(userId);
        testResult.setTestId(testId);
        testResult.setLessonId(test.getLessonId());
        testResult.setSessionId(sessionId);
        testResult.setTotalQuestions(totalQuestions);
        testResult.setCorrectAnswers(correctCount);
        testResult.setScore(score);
        testResult.setXpEarned(xpEarned);
        testResult.setTimeSpentSeconds(timeSpentSeconds);
        testResult.setPassed(passed);
        testResult.setSubmittedAt(LocalDateTime.now());
        testResultRepository.save(testResult);

        Optional<LessonProgress> lpOpt = progressRepository.findByUserIdAndLessonId(userId, test.getLessonId());
        if (lpOpt.isPresent()) {
            LessonProgress lp = lpOpt.get();
            lp.setTestCompleted(passed);
            if (passed) lp.setTestCompletedAt(LocalDateTime.now());
            lp.setTestScore((int) score);
            lp.setTestTimeSpentSeconds(lp.getTestTimeSpentSeconds() + timeSpentSeconds);
            int total = lp.getContentScore() + lp.getExerciseScore() + lp.getTestScore();
            lp.setTotalScore(total);
            if (lp.isContentViewed() && lp.isExercisesCompleted() && lp.isTestCompleted()) {
                lp.setLessonCompleted(true);
                lp.setLessonCompletedAt(LocalDateTime.now());
            }
            progressRepository.save(lp);
        }

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("testId", testId);
        response.put("sessionId", sessionId);
        response.put("totalQuestions", totalQuestions);
        response.put("correctAnswers", correctCount);
        response.put("score", score);
        response.put("xpEarned", xpEarned);
        response.put("passed", passed);
        response.put("passingScore", test.getPassingScore());
        response.put("maxScore", test.getMaxScore());
        response.put("timeSpentSeconds", timeSpentSeconds);
        response.put("questionResults", results);
        response.put("completedAt", LocalDateTime.now().toString());

        if (hasAiGrading) {
            double avgAiScore = aiGradingDetails.stream()
                    .mapToDouble(m -> ((Number) m.get("score")).doubleValue())
                    .average().orElse(0);
            response.put("aiGrading", Map.of(
                    "score", Math.round(avgAiScore * 10.0) / 10.0,
                    "details", aiGradingDetails,
                    "summary", String.format("Bạn đã được %.1f/10 điểm cho phần tự luận.", avgAiScore)
            ));
        }

        return response;
    }

    public List<Map<String, Object>> getTestHistory(Long userId) {
        List<LessonTestResult> results = testResultRepository.findByUserIdOrderBySubmittedAtDesc(userId);
        return results.stream().map(r -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", r.getId());
            m.put("testId", r.getTestId());
            m.put("lessonId", r.getLessonId());
            m.put("sessionId", r.getSessionId());
            m.put("score", r.getScore());
            m.put("passed", r.isPassed());
            m.put("correctAnswers", r.getCorrectAnswers());
            m.put("totalQuestions", r.getTotalQuestions());
            m.put("timeSpentSeconds", r.getTimeSpentSeconds());
            m.put("xpEarned", r.getXpEarned());
            m.put("submittedAt", r.getSubmittedAt() != null ? r.getSubmittedAt().toString() : null);
            testRepository.findById(r.getTestId()).ifPresent(t -> m.put("testTitle", t.getTitle()));
            return m;
        }).toList();
    }

    public Map<String, Object> getTestHistoryStats(Long userId) {
        List<LessonTestResult> results = testResultRepository.findByUserIdOrderBySubmittedAtDesc(userId);
        int total = results.size();
        int passed = (int) results.stream().filter(LessonTestResult::isPassed).count();
        double avg = results.stream().mapToDouble(LessonTestResult::getScore).average().orElse(0);
        int totalXp = results.stream().mapToInt(LessonTestResult::getXpEarned).sum();

        return Map.of(
            "totalTests", total,
            "passedTests", passed,
            "failedTests", total - passed,
            "averageScore", Math.round(avg * 10.0) / 10.0,
            "totalXpEarned", totalXp
        );
    }

    @Transactional
    public LessonTest createTest(Long lessonId, String title, String description,
                                 int durationMinutes, int passingScore,
                                 List<Map<String, Object>> questions) {
        LessonTest test = new LessonTest();
        test.setLessonId(lessonId);
        test.setTitle(title);
        test.setDescription(description);
        test.setDurationMinutes(durationMinutes);
        test.setPassingScore(passingScore);
        LessonTest saved = testRepository.save(test);

        for (int i = 0; i < questions.size(); i++) {
            Map<String, Object> q = questions.get(i);
            TestQuestion tq = new TestQuestion();
            tq.setTestId(saved.getId());
            tq.setLessonId(lessonId);
            tq.setQuestion((String) q.get("question"));
            tq.setContent((String) q.get("content"));
            String typeStr = q.get("type") != null ? q.get("type").toString() : "MULTIPLE_CHOICE";
            tq.setType(TestQuestion.QuestionType.valueOf(typeStr.toUpperCase()));

            Object opts = q.get("options");
            if (opts instanceof List) {
                try {
                    tq.setOptions(objectMapper.writeValueAsString(opts));
                } catch (Exception ignored) {}
            }

            tq.setCorrectAnswer(q.get("correctAnswer") != null ? q.get("correctAnswer").toString() : null);
            tq.setExplanation((String) q.get("explanation"));
            tq.setOrderIndex(i);
            if (q.get("points") != null) {
                tq.setPoints(((Number) q.get("points")).intValue());
            }
            questionRepository.save(tq);
        }

        return saved;
    }

    private String getStringAnswer(Map<String, Object> answers, String key) {
        Object val = answers.get(key);
        if (val == null) return "";
        if (val instanceof List) {
            return String.join(",", ((List<?>) val).stream().map(Object::toString).toList());
        }
        return val.toString();
    }

    private Object parseOptions(String options) {
        if (options == null || options.isBlank()) return null;
        try {
            return objectMapper.readValue(options, new TypeReference<Object>() {});
        } catch (Exception e) {
            return options;
        }
    }

    private DragDropResult gradeDragDrop(String userAnswer, String correctAnswerStr) {
        DragDropResult result = new DragDropResult();
        result.totalPlacements = 0;
        result.correctPlacements = 0;

        if (userAnswer == null || userAnswer.isBlank()) {
            result.isFullyCorrect = false;
            result.correctRatio = 0;
            return result;
        }

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
}
