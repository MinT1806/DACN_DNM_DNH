package com.abcenglish.service;

import com.abcenglish.entity.*;
import com.abcenglish.repository.*;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class TestService {

    private static final Logger log = LoggerFactory.getLogger(TestService.class);

    private final TestRepository testRepository;
    private final TestSessionRepository testSessionRepository;
    private final TestResultRepository testResultRepository;
    private final ObjectMapper objectMapper;

    public TestService(TestRepository testRepository,
                       TestSessionRepository testSessionRepository,
                       TestResultRepository testResultRepository,
                       ObjectMapper objectMapper) {
        this.testRepository = testRepository;
        this.testSessionRepository = testSessionRepository;
        this.testResultRepository = testResultRepository;
        this.objectMapper = objectMapper;
    }

    public List<Map<String, Object>> getAllTests(String type, String level, Long userId) {
        List<Test> tests;
        try {
            if (type != null && !type.isBlank() && level != null && !level.isBlank()) {
                User.Level lv = User.Level.valueOf(level.toUpperCase());
                Test.TestType tt = Test.TestType.valueOf(type.toUpperCase());
                tests = testRepository.findByActiveTrueAndLevelAndType(lv, tt);
            } else if (type != null && !type.isBlank()) {
                tests = testRepository.findByActiveTrueAndType(Test.TestType.valueOf(type.toUpperCase()));
            } else if (level != null && !level.isBlank()) {
                tests = testRepository.findByActiveTrueAndLevel(User.Level.valueOf(level.toUpperCase()));
            } else {
                tests = testRepository.findByActiveTrue();
            }
        } catch (IllegalArgumentException e) {
            log.warn("Invalid filter type='{}' or level='{}': {}", type, level, e.getMessage());
            tests = testRepository.findByActiveTrue();
        }

        return tests.stream().map(t -> {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", t.getId());
            map.put("title", t.getTitle());
            map.put("testTitle", t.getTitle());
            map.put("description", t.getDescription());
            map.put("type", t.getType() != null ? t.getType().name() : null);
            map.put("testType", t.getType() != null ? t.getType().name() : null);
            map.put("level", t.getLevel() != null ? t.getLevel().name() : null);
            map.put("category", t.getCategory());
            map.put("duration", t.getDurationMinutes());
            map.put("passingScore", t.getPassingScore());
            map.put("totalQuestions", t.getTotalQuestions());
            map.put("maxScore", t.getMaxScore());
            map.put("timed", t.isTimed());
            map.put("active", t.isActive());
            map.put("createdAt", t.getCreatedAt() != null ? t.getCreatedAt().toString() : null);

            if (userId != null) {
                var lastResult = testResultRepository.findTopByUserIdAndTestIdOrderByCompletedAtDesc(userId, t.getId());
                map.put("completed", lastResult.isPresent());
                map.put("userScore", lastResult.map(r -> r.getScore()).orElse(null));
            }
            return map;
        }).collect(Collectors.toList());
    }

    public Map<String, Object> getTestById(Long id, Long userId) {
        return testRepository.findById(id).map(t -> {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", t.getId());
            map.put("title", t.getTitle());
            map.put("testTitle", t.getTitle());
            map.put("description", t.getDescription());
            map.put("type", t.getType() != null ? t.getType().name() : null);
            map.put("testType", t.getType() != null ? t.getType().name() : null);
            map.put("level", t.getLevel() != null ? t.getLevel().name() : null);
            map.put("category", t.getCategory());
            map.put("duration", t.getDurationMinutes());
            map.put("passingScore", t.getPassingScore());
            map.put("totalQuestions", t.getTotalQuestions());
            map.put("maxScore", t.getMaxScore());
            map.put("timed", t.isTimed());
            map.put("active", t.isActive());

            List<Map<String, Object>> questions = parseQuestions(t.getQuestionData());
            map.put("questions", questions);
            map.put("questionsCount", questions.size());

            if (userId != null) {
                var lastResult = testResultRepository.findTopByUserIdAndTestIdOrderByCompletedAtDesc(userId, id);
                map.put("completed", lastResult.isPresent());
                map.put("userScore", lastResult.map(r -> r.getScore()).orElse(null));
            }

            return map;
        }).orElse(Collections.emptyMap());
    }

    public Map<String, Object> startTest(Long testId, Long userId) {
        Test test = testRepository.findById(testId).orElse(null);
        if (test == null || !test.isActive()) {
            Map<String, Object> err = new HashMap<>();
            err.put("error", "Test not found or inactive");
            return err;
        }

        TestSession session = new TestSession();
        session.setUserId(userId);
        session.setTestId(testId);
        session.setTestTitle(test.getTitle());
        session.setTestType(test.getType() != null ? test.getType().name() : null);
        session.setQuestionsCount(test.getTotalQuestions());
        session.setStatus(TestSession.TestStatus.IN_PROGRESS);
        session = testSessionRepository.save(session);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("sessionId", session.getId());
        result.put("testId", testId);
        result.put("title", test.getTitle());
        result.put("duration", test.getDurationMinutes());
        result.put("totalQuestions", test.getTotalQuestions());
        result.put("timed", test.isTimed());

        List<Map<String, Object>> questions = parseQuestions(test.getQuestionData());
        questions.forEach(q -> q.remove("correctAnswer"));
        result.put("questions", questions);

        return result;
    }

    public Map<String, Object> submitTest(Long testId, Long sessionId, Map<String, Object> answers, Long userId) {
        Test test = testRepository.findById(testId).orElse(null);
        TestSession session = testSessionRepository.findById(sessionId).orElse(null);

        if (test == null || session == null) {
            Map<String, Object> err = new HashMap<>();
            err.put("error", "Test or session not found");
            return err;
        }

        List<Map<String, Object>> questions = parseQuestions(test.getQuestionData());

        int correctAnswers = 0;
        List<Map<String, Object>> questionResults = new ArrayList<>();
        int totalQuestions = questions.size();

        for (int i = 0; i < totalQuestions; i++) {
            Map<String, Object> q = questions.get(i);
            String key = "q_" + i;
            String userAnswer = answers.containsKey(key) ? String.valueOf(answers.get(key)) : "";
            String correctAnswer = q.get("correctAnswer") != null ? String.valueOf(q.get("correctAnswer")) : "";
            boolean isCorrect = userAnswer.trim().equalsIgnoreCase(correctAnswer);

            if (isCorrect) correctAnswers++;

            Map<String, Object> qr = new LinkedHashMap<>();
            qr.put("questionIndex", i);
            qr.put("question", q.get("question"));
            qr.put("userAnswer", userAnswer);
            qr.put("correctAnswer", correctAnswer);
            qr.put("isCorrect", isCorrect);
            Object pts = q.get("points");
            qr.put("points", pts != null ? pts : 1);
            questionResults.add(qr);
        }

        double score = totalQuestions > 0 ? (double) correctAnswers / totalQuestions * test.getMaxScore() : 0;
        double percentage = totalQuestions > 0 ? (double) correctAnswers / totalQuestions * 100 : 0;

        int timeSpent = 0;
        if (session.getStartedAt() != null) {
            timeSpent = (int) Duration.between(session.getStartedAt(), LocalDateTime.now()).getSeconds();
        }

        TestResult result = new TestResult();
        result.setUserId(userId);
        result.setTestSessionId(sessionId);
        result.setTestId(testId);
        result.setTestTitle(test.getTitle());
        result.setTestType(test.getType() != null ? test.getType().name() : null);
        result.setLevel(test.getLevel() != null ? test.getLevel().name() : null);
        result.setTotalQuestions(totalQuestions);
        result.setCorrectAnswers(correctAnswers);
        result.setScore(Math.round(score * 10.0) / 10.0);
        result.setPercentage(String.valueOf(Math.round(percentage * 10.0) / 10.0));
        result.setTimeSpentSeconds(timeSpent);
        try {
            result.setQuestionResults(objectMapper.writeValueAsString(questionResults));
        } catch (Exception e) {
            log.error("Failed to serialize question results: {}", e.getMessage());
        }
        testResultRepository.save(result);

        session.setSubmittedAt(LocalDateTime.now());
        session.setTotalTimeSeconds(timeSpent);
        session.setStatus(TestSession.TestStatus.SUBMITTED);
        testSessionRepository.save(session);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("resultId", result.getId());
        response.put("testId", testId);
        response.put("testTitle", test.getTitle());
        response.put("testType", test.getType() != null ? test.getType().name() : null);
        response.put("level", test.getLevel() != null ? test.getLevel().name() : null);
        response.put("sessionId", sessionId);
        response.put("score", result.getScore());
        response.put("percentage", result.getPercentage());
        response.put("correctAnswers", correctAnswers);
        response.put("totalQuestions", totalQuestions);
        response.put("timeSpentSeconds", timeSpent);
        response.put("passed", result.getScore() >= test.getPassingScore());
        response.put("passingScore", test.getPassingScore());
        response.put("maxScore", test.getMaxScore());
        response.put("xpEarned", (int) result.getScore() * 10);
        response.put("completedAt", result.getCompletedAt() != null ? result.getCompletedAt().toString() : null);

        String feedback;
        if (result.getScore() >= 9) {
            feedback = "Xuất sắc! Bạn nắm vững kiến thức. Hãy tiếp tục phát huy!";
        } else if (result.getScore() >= 7) {
            feedback = "Tốt lắm! Bạn làm khá tốt. Cần ôn tập thêm một chút để hoàn hảo hơn.";
        } else if (result.getScore() >= test.getPassingScore()) {
            feedback = "Đạt yêu cầu! Bạn đã vượt qua bài kiểm tra. Hãy ôn tập thêm để cải thiện.";
        } else {
            feedback = "Chưa đạt. Hãy xem lại bài giảng và thử lại nhé. Đừng nản lòng!";
        }
        response.put("feedback", feedback);
        response.put("questionResults", questionResults);

        return response;
    }

    public List<Map<String, Object>> getMyResults(Long userId) {
        return testResultRepository.findByUserIdOrderByCompletedAtDesc(userId).stream()
                .map(r -> {
                    Map<String, Object> map = new LinkedHashMap<>();
                    map.put("id", r.getId());
                    map.put("testId", r.getTestId());
                    map.put("testTitle", r.getTestTitle());
                    map.put("testType", r.getTestType());
                    map.put("level", r.getLevel());
                    map.put("score", r.getScore());
                    map.put("percentage", r.getPercentage());
                    map.put("correctAnswers", r.getCorrectAnswers());
                    map.put("totalQuestions", r.getTotalQuestions());
                    map.put("timeSpentSeconds", r.getTimeSpentSeconds());
                    map.put("completedAt", r.getCompletedAt() != null ? r.getCompletedAt().toString() : null);
                    return map;
                }).collect(Collectors.toList());
    }

    public Test createTest(Map<String, Object> data, Long createdBy) {
        Test test = new Test();
        test.setTitle((String) data.get("title"));
        test.setDescription((String) data.get("description"));
        if (data.get("type") != null) {
            try {
                test.setType(Test.TestType.valueOf(data.get("type").toString().toUpperCase()));
            } catch (IllegalArgumentException e) {
                log.warn("Invalid test type '{}': {}", data.get("type"), e.getMessage());
            }
        }
        if (data.get("level") != null) {
            try {
                test.setLevel(User.Level.valueOf(data.get("level").toString().toUpperCase()));
            } catch (IllegalArgumentException e) {
                log.warn("Invalid test level '{}': {}", data.get("level"), e.getMessage());
            }
        }
        test.setCategory((String) data.get("category"));
        if (data.get("durationMinutes") != null) test.setDurationMinutes((Integer) data.get("durationMinutes"));
        if (data.get("passingScore") != null) test.setPassingScore((Integer) data.get("passingScore"));
        if (data.get("totalQuestions") != null) test.setTotalQuestions((Integer) data.get("totalQuestions"));
        if (data.get("maxScore") != null) test.setMaxScore((Integer) data.get("maxScore"));
        if (data.get("timed") != null) test.setTimed((Boolean) data.get("timed"));
        if (data.get("questionData") != null) {
            test.setQuestionData(data.get("questionData").toString());
        }
        test.setCreatedBy(createdBy);
        return testRepository.save(test);
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
}
