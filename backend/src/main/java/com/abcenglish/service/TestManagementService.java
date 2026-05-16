package com.abcenglish.service;

import com.abcenglish.dto.*;
import com.abcenglish.entity.*;
import com.abcenglish.repository.*;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class TestManagementService {

    private static final Logger log = LoggerFactory.getLogger(TestManagementService.class);

    private final TestRepository testRepository;
    private final TestSectionRepository testSectionRepository;
    private final TestSessionRepository testSessionRepository;
    private final TestResultRepository testResultRepository;
    private final TestAnswerRepository testAnswerRepository;
    private final TestQuestionResultRepository questionResultRepository;
    private final ObjectMapper objectMapper;

    public TestManagementService(
            TestRepository testRepository,
            TestSectionRepository testSectionRepository,
            TestSessionRepository testSessionRepository,
            TestResultRepository testResultRepository,
            TestAnswerRepository testAnswerRepository,
            TestQuestionResultRepository questionResultRepository,
            ObjectMapper objectMapper) {
        this.testRepository = testRepository;
        this.testSectionRepository = testSectionRepository;
        this.testSessionRepository = testSessionRepository;
        this.testResultRepository = testResultRepository;
        this.testAnswerRepository = testAnswerRepository;
        this.questionResultRepository = questionResultRepository;
        this.objectMapper = objectMapper;
    }

    public TestSessionResponse startTest(Long testId, Long userId) {
        Test test = testRepository.findById(testId).orElse(null);
        if (test == null || !test.isActive()) {
            throw new IllegalArgumentException("Test not found or inactive");
        }

        Optional<TestSession> existingSession = testSessionRepository.findByUserIdAndStatus(userId, TestSession.TestStatus.IN_PROGRESS)
                .stream().filter(s -> s.getTestId().equals(testId)).findFirst();

        TestSession session;
        if (existingSession.isPresent()) {
            session = existingSession.get();
            session.setStatus(TestSession.TestStatus.IN_PROGRESS);
        } else {
            session = new TestSession();
            session.setUserId(userId);
            session.setTestId(testId);
            session.setTestTitle(test.getTitle());
            session.setTestType(test.getType() != null ? test.getType().name() : null);
            session.setLevel(test.getLevel() != null ? test.getLevel().name() : null);
            session.setQuestionsCount(test.getTotalQuestions());
            session.setStatus(TestSession.TestStatus.IN_PROGRESS);
            session.setTimed(test.isTimed());
        }

        session.setStartedAt(LocalDateTime.now());
        session.setTotalTimeSeconds(test.getDurationMinutes() * 60);
        session.setRemainingSeconds(test.getDurationMinutes() * 60);
        session = testSessionRepository.save(session);

        List<TestSection> sections = testSectionRepository.findByTestIdOrderByOrderIndexAsc(testId);
        boolean hasSections = !sections.isEmpty();

        TestSessionResponse response = new TestSessionResponse();
        response.setSessionId(session.getId());
        response.setTestId(testId);
        response.setTitle(test.getTitle());
        response.setDescription(test.getDescription());
        response.setTestType(test.getType() != null ? test.getType().name() : null);
        response.setLevel(test.getLevel() != null ? test.getLevel().name() : null);
        response.setTotalDuration(test.getDurationMinutes());
        response.setTotalQuestions(test.getTotalQuestions());
        response.setTimed(test.isTimed());
        response.setHasSections(hasSections);
        response.setStatus(session.getStatus().name());

        if (session.getStartedAt() != null) {
            response.setStartedAt(session.getStartedAt().toInstant(java.time.ZoneOffset.UTC).toEpochMilli());
        }
        response.setRemainingSeconds(session.getRemainingSeconds());

        if (hasSections) {
            response.setSections(buildSectionResponse(sections, test.getQuestionData()));
        } else {
            List<Map<String, Object>> questions = parseQuestions(test.getQuestionData());
            questions.forEach(q -> q.remove("correctAnswer"));
            response.setQuestions(questions);
            response.setQuestionMap(buildQuestionMap(questions));
        }

        if (session.getAnswersJson() != null) {
            try {
                @SuppressWarnings("unchecked")
                Map<String, Object> savedAnswers = objectMapper.readValue(session.getAnswersJson(), Map.class);
                Map<String, Object> respMap = objectMapper.convertValue(response, Map.class);
                respMap.put("savedAnswers", savedAnswers);
                response = objectMapper.convertValue(respMap, TestSessionResponse.class);
            } catch (Exception e) {
                log.warn("Could not parse saved answers: {}", e.getMessage());
            }
        }

        return response;
    }

    @Transactional
    public TestSessionResponse resumeTest(Long sessionId, Long userId) {
        TestSession session = testSessionRepository.findById(sessionId).orElse(null);
        if (session == null || !session.getUserId().equals(userId)) {
            throw new IllegalArgumentException("Session not found or unauthorized");
        }

        if (session.getStatus() == TestSession.TestStatus.SUBMITTED) {
            throw new IllegalStateException("Test already submitted");
        }

        Test test = testRepository.findById(session.getTestId()).orElse(null);
        if (test == null) {
            throw new IllegalArgumentException("Test not found");
        }

        int elapsed = (int) Duration.between(session.getStartedAt(), LocalDateTime.now()).getSeconds();
        int remaining = Math.max(0, session.getTotalTimeSeconds() - elapsed);
        session.setRemainingSeconds(remaining);
        session.setStatus(TestSession.TestStatus.IN_PROGRESS);
        testSessionRepository.save(session);

        TestSessionResponse response = new TestSessionResponse();
        response.setSessionId(session.getId());
        response.setTestId(session.getTestId());
        response.setTitle(session.getTestTitle());
        response.setTestType(session.getTestType());
        response.setLevel(session.getLevel());
        response.setTotalDuration(session.getTotalTimeSeconds() / 60);
        response.setTotalQuestions(session.getQuestionsCount());
        response.setTimed(session.isTimed());
        response.setStatus(session.getStatus().name());
        response.setStartedAt(session.getStartedAt().toInstant(java.time.ZoneOffset.UTC).toEpochMilli());
        response.setRemainingSeconds(remaining);

        List<TestSection> sections = testSectionRepository.findByTestIdOrderByOrderIndexAsc(session.getTestId());
        if (!sections.isEmpty()) {
            response.setHasSections(true);
            response.setSections(buildSectionResponse(sections, test.getQuestionData()));
        } else {
            List<Map<String, Object>> questions = parseQuestions(test.getQuestionData());
            questions.forEach(q -> q.remove("correctAnswer"));
            response.setQuestions(questions);
            response.setQuestionMap(buildQuestionMap(questions));
        }

        if (session.getAnswersJson() != null) {
            try {
                @SuppressWarnings("unchecked")
                Map<String, Object> savedAnswers = objectMapper.readValue(session.getAnswersJson(), Map.class);
                Map<String, Object> respMap = objectMapper.convertValue(response, Map.class);
                respMap.put("savedAnswers", savedAnswers);
                response = objectMapper.convertValue(respMap, TestSessionResponse.class);
            } catch (Exception e) {
                log.warn("Could not parse saved answers: {}", e.getMessage());
            }
        }

        return response;
    }

    @Transactional
    public void autoSave(AutoSaveRequest request, Long userId) {
        if (request.getSessionId() == null) return;

        TestSession session = testSessionRepository.findById(request.getSessionId()).orElse(null);
        if (session == null || !session.getUserId().equals(userId)) return;

        if (session.getStatus() == TestSession.TestStatus.SUBMITTED) return;

        if (request.getAnswers() != null) {
            try {
                String json = objectMapper.writeValueAsString(request.getAnswers());
                session.setAnswersJson(json);
            } catch (Exception e) {
                log.warn("Could not serialize answers: {}", e.getMessage());
            }
        }

        if (request.getTimeSpentSeconds() != null) {
            int elapsed = (int) Duration.between(session.getStartedAt(), LocalDateTime.now()).getSeconds();
            session.setRemainingSeconds(Math.max(0, session.getTotalTimeSeconds() - elapsed));
        }

        session.setStatus(TestSession.TestStatus.IN_PROGRESS);
        testSessionRepository.save(session);

        if (request.getAnswers() != null) {
            int answeredCount = (int) request.getAnswers().values().stream()
                    .filter(v -> v != null && !String.valueOf(v).isBlank())
                    .count();
            session.setAnsweredCount(answeredCount);
            testSessionRepository.save(session);
        }
    }

    @Transactional
    public TestResultResponse submitTest(Long testId, TestSubmitRequest request, Long userId) {
        Test test = testRepository.findById(testId).orElse(null);
        if (test == null) {
            throw new IllegalArgumentException("Test not found");
        }

        Long sessionId = request.getSessionId();
        TestSession session = sessionId != null
                ? testSessionRepository.findById(sessionId).orElse(null)
                : null;

        if (session == null) {
            session = new TestSession();
            session.setUserId(userId);
            session.setTestId(testId);
            session.setTestTitle(test.getTitle());
            session.setTestType(test.getType() != null ? test.getType().name() : null);
            session.setLevel(test.getLevel() != null ? test.getLevel().name() : null);
            session.setQuestionsCount(test.getTotalQuestions());
            session.setTimed(test.isTimed());
        }

        if (session.getStatus() == TestSession.TestStatus.SUBMITTED) {
            TestResult existingResult = request.getResultId() != null
                    ? testResultRepository.findById(request.getResultId()).orElse(null)
                    : testResultRepository.findByTestSessionId(session.getId()).stream().findFirst().orElse(null);
            if (existingResult != null) {
                return buildResultResponse(existingResult, test, session);
            }
            throw new IllegalStateException("Test already submitted");
        }

        int timeSpent = request.getTimeSpentSeconds() != null ? request.getTimeSpentSeconds()
                : session.getStartedAt() != null ? (int) Duration.between(session.getStartedAt(), LocalDateTime.now()).getSeconds()
                : 0;

        session.setSubmittedAt(LocalDateTime.now());
        session.setTotalTimeSeconds(timeSpent);
        session.setRemainingSeconds(0);
        session.setStatus(TestSession.TestStatus.SUBMITTED);

        Map<String, Object> answers = request.getAnswers() != null ? request.getAnswers() : new HashMap<>();

        List<Map<String, Object>> questions = parseQuestions(test.getQuestionData());
        List<Map<String, Object>> questionResults = new ArrayList<>();
        int correctAnswers = 0;

        for (int i = 0; i < questions.size(); i++) {
            Map<String, Object> q = questions.get(i);
            String key = "q_" + i;
            String userAnswer = answers.containsKey(key) ? String.valueOf(answers.get(key)) : "";
            String correctAnswer = q.get("correctAnswer") != null ? String.valueOf(q.get("correctAnswer")) : "";
            boolean isCorrect = userAnswer.trim().equalsIgnoreCase(correctAnswer.trim());

            if (isCorrect) correctAnswers++;

            Map<String, Object> qr = new LinkedHashMap<>();
            qr.put("questionIndex", i);
            qr.put("question", q.get("question"));
            qr.put("userAnswer", userAnswer);
            qr.put("correctAnswer", correctAnswer);
            qr.put("isCorrect", isCorrect);
            qr.put("questionType", q.get("type"));
            qr.put("points", q.get("points") != null ? q.get("points") : 1);
            questionResults.add(qr);

            TestQuestionResult qrEntity = new TestQuestionResult();
            qrEntity.setSessionId(session.getId());
            qrEntity.setTestId(testId);
            qrEntity.setQuestionIndex(i);
            qrEntity.setQuestionType(q.get("type") != null ? q.get("type").toString() : null);
            qrEntity.setQuestion(q.get("question") != null ? q.get("question").toString() : null);
            qrEntity.setUserAnswer(userAnswer);
            qrEntity.setCorrectAnswer(correctAnswer);
            qrEntity.setIsCorrect(isCorrect);
            qrEntity.setPoints(q.get("points") != null ? ((Number) q.get("points")).intValue() : 1);
            qrEntity.setMaxScore(q.get("points") != null ? ((Number) q.get("points")).doubleValue() : 1.0);
            questionResultRepository.save(qrEntity);
        }

        session = testSessionRepository.save(session);

        double score = questions.size() > 0 ? (double) correctAnswers / questions.size() * test.getMaxScore() : 0;
        double percentage = questions.size() > 0 ? (double) correctAnswers / questions.size() * 100 : 0;

        TestResult result = new TestResult();
        result.setUserId(userId);
        result.setTestSessionId(session.getId());
        result.setTestId(testId);
        result.setTestTitle(test.getTitle());
        result.setTestType(test.getType() != null ? test.getType().name() : null);
        result.setLevel(test.getLevel() != null ? test.getLevel().name() : null);
        result.setTotalQuestions(questions.size());
        result.setCorrectAnswers(correctAnswers);
        result.setScore(Math.round(score * 10.0) / 10.0);
        result.setPercentage(String.valueOf(Math.round(percentage * 10.0) / 10.0));
        result.setTimeSpentSeconds(timeSpent);
        try {
            result.setQuestionResults(objectMapper.writeValueAsString(questionResults));
        } catch (Exception e) {
            log.error("Failed to serialize question results: {}", e.getMessage());
        }
        result = testResultRepository.save(result);

        session.setSubmittedAt(LocalDateTime.now());
        testSessionRepository.save(session);

        return buildResultResponse(result, test, session);
    }

    public TestResultResponse getResult(Long resultId, Long userId) {
        TestResult result = testResultRepository.findById(resultId).orElse(null);
        if (result == null || !result.getUserId().equals(userId)) {
            throw new IllegalArgumentException("Result not found or unauthorized");
        }

        Test test = testRepository.findById(result.getTestId()).orElse(null);
        TestSession session = testSessionRepository.findById(result.getTestSessionId()).orElse(null);

        return buildResultResponse(result, test, session);
    }

    public List<Map<String, Object>> getInProgressSessions(Long userId) {
        return testSessionRepository.findByUserIdAndStatus(userId, TestSession.TestStatus.IN_PROGRESS)
                .stream().map(s -> {
                    Map<String, Object> map = new LinkedHashMap<>();
                    map.put("sessionId", s.getId());
                    map.put("testId", s.getTestId());
                    map.put("title", s.getTestTitle());
                    map.put("testType", s.getTestType());
                    map.put("level", s.getLevel());
                    map.put("startedAt", s.getStartedAt() != null ? s.getStartedAt().toString() : null);
                    map.put("remainingSeconds", s.getRemainingSeconds());
                    map.put("totalSeconds", s.getTotalTimeSeconds());
                    map.put("answeredCount", s.getAnsweredCount());
                    map.put("questionsCount", s.getQuestionsCount());
                    map.put("status", s.getStatus().name());
                    return map;
                }).collect(Collectors.toList());
    }

    public TestSessionResponse getSession(Long sessionId, Long userId) {
        TestSession session = testSessionRepository.findById(sessionId).orElse(null);
        if (session == null || !session.getUserId().equals(userId)) {
            throw new IllegalArgumentException("Session not found or unauthorized");
        }
        return resumeTest(sessionId, userId);
    }

    @Transactional
    public void expireTimedOutSessions() {
        List<TestSession> inProgress = testSessionRepository.findByUserIdAndStatus(null, TestSession.TestStatus.IN_PROGRESS);
        inProgress.forEach(s -> {
            if (s.getStartedAt() != null && s.getTotalTimeSeconds() != null) {
                int elapsed = (int) Duration.between(s.getStartedAt(), LocalDateTime.now()).getSeconds();
                if (elapsed >= s.getTotalTimeSeconds()) {
                    s.setStatus(TestSession.TestStatus.TIMED_OUT);
                    s.setAutoSubmitted(true);
                    s.setSubmittedAt(LocalDateTime.now());
                    testSessionRepository.save(s);
                    log.info("Auto-submitted timed out session: {}", s.getId());
                }
            }
        });
    }

    private TestResultResponse buildResultResponse(TestResult result, Test test, TestSession session) {
        TestResultResponse response = new TestResultResponse();
        response.setResultId(result.getId());
        response.setSessionId(result.getTestSessionId());
        response.setTestId(result.getTestId());
        response.setTestTitle(result.getTestTitle());
        response.setTestType(result.getTestType());
        response.setLevel(result.getLevel());
        response.setScore(result.getScore());
        response.setPercentage(result.getPercentage() != null ? Double.parseDouble(result.getPercentage()) : 0);
        response.setCorrectAnswers(result.getCorrectAnswers());
        response.setTotalQuestions(result.getTotalQuestions());
        response.setTimeSpentSeconds(result.getTimeSpentSeconds());
        response.setXpEarned((int) result.getScore() * 10);
        response.setMaxScore(test != null ? test.getMaxScore() : 10);
        response.setPassingScore(test != null ? test.getPassingScore() : 6);
        response.setPassed(result.getScore() >= (test != null ? test.getPassingScore() : 6));
        response.setCompletedAt(result.getCompletedAt() != null ? result.getCompletedAt().toString() : null);
        response.setStatus("COMPLETED");

        if (result.getQuestionResults() != null) {
            try {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> questionResults = objectMapper.readValue(
                        result.getQuestionResults(), new TypeReference<List<Map<String, Object>>>() {});
                response.setQuestionResults(questionResults);
            } catch (Exception e) {
                log.warn("Could not parse question results: {}", e.getMessage());
            }
        }

        String feedback = generateFeedback(result.getScore(), test != null ? test.getPassingScore() : 6);
        response.setFeedback(feedback);
        response.setOverallFeedback(feedback);

        return response;
    }

    private String generateFeedback(double score, int passingScore) {
        if (score >= 9) return "Xuất sắc! Bạn nắm vững kiến thức. Hãy tiếp tục phát huy!";
        if (score >= 8) return "Tốt lắm! Bạn làm rất tốt. Hãy tiếp tục cố gắng!";
        if (score >= 7) return "Khá tốt! Bạn hiểu bài. Cần ôn tập thêm một chút.";
        if (score >= passingScore) return "Đạt yêu cầu! Hãy ôn tập thêm để cải thiện điểm số.";
        return "Chưa đạt. Hãy xem lại bài giảng và thử lại nhé. Đừng nản lòng!";
    }

    private List<Map<String, Object>> buildSectionResponse(List<TestSection> sections, String questionData) {
        List<Map<String, Object>> allQuestions = parseQuestions(questionData);
        Map<String, List<Map<String, Object>>> questionsBySection = new LinkedHashMap<>();

        for (TestSection section : sections) {
            questionsBySection.put(section.getType().name(), new ArrayList<>());
        }

        for (int i = 0; i < allQuestions.size(); i++) {
            Map<String, Object> q = allQuestions.get(i);
            String sectionType = q.get("section") != null ? q.get("section").toString() : "MIXED";
            List<Map<String, Object>> list = questionsBySection.computeIfAbsent(sectionType, k -> new ArrayList<>());
            Map<String, Object> qCopy = new LinkedHashMap<>(q);
            qCopy.put("index", i);
            list.add(qCopy);
        }

        return sections.stream().map(section -> {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", section.getId());
            map.put("title", section.getTitle());
            map.put("type", section.getType().name());
            map.put("orderIndex", section.getOrderIndex());
            map.put("durationMinutes", section.getDurationMinutes());
            map.put("instructions", section.getInstructions());
            map.put("content", section.getContent());
            map.put("required", section.isRequired());

            List<Map<String, Object>> sectionQuestions = questionsBySection.getOrDefault(section.getType().name(), new ArrayList<>());
            sectionQuestions.forEach(q -> q.remove("correctAnswer"));
            map.put("questions", sectionQuestions);
            map.put("questionsCount", sectionQuestions.size());
            return map;
        }).collect(Collectors.toList());
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> parseQuestions(String questionData) {
        if (questionData == null || questionData.isBlank()) return new ArrayList<>();
        try {
            return objectMapper.readValue(questionData, new TypeReference<List<Map<String, Object>>>() {});
        } catch (Exception e) {
            log.error("Failed to parse question data: {}", e.getMessage());
            return new ArrayList<>();
        }
    }

    private Map<String, Object> buildQuestionMap(List<Map<String, Object>> questions) {
        Map<String, Object> map = new LinkedHashMap<>();
        for (int i = 0; i < questions.size(); i++) {
            Map<String, Object> q = new LinkedHashMap<>(questions.get(i));
            q.remove("correctAnswer");
            map.put("q_" + i, q);
        }
        return map;
    }
}
