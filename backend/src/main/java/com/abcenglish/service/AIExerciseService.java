package com.abcenglish.service;

import com.abcenglish.dto.AIExerciseConfig;
import com.abcenglish.dto.AIExerciseResponse.AIExerciseData;
import com.abcenglish.dto.AIExerciseResponse.GradingResult;
import com.abcenglish.entity.Exercise;
import com.abcenglish.entity.ExerciseQuestion;
import com.abcenglish.entity.ExerciseQuestion.QuestionType;
import com.abcenglish.entity.QuizResult;
import com.abcenglish.entity.User;
import com.abcenglish.entity.User.Level;
import com.abcenglish.repository.ExerciseQuestionRepository;
import com.abcenglish.repository.ExerciseRepository;
import com.abcenglish.repository.ExerciseSubmissionRepository;
import com.abcenglish.repository.QuizResultRepository;
import com.abcenglish.repository.UserProgressRepository;
import com.abcenglish.repository.UserRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AIExerciseService {

    private static final Logger log = LoggerFactory.getLogger(AIExerciseService.class);

    private final ExerciseRepository exerciseRepository;
    private final ExerciseQuestionRepository questionRepository;
    private final ExerciseSubmissionRepository submissionRepository;
    private final QuizResultRepository quizResultRepository;
    private final UserProgressRepository progressRepository;
    private final UserRepository userRepository;
    private final AIGradingService aiGradingService;
    private final ObjectMapper objectMapper;

    @Value("${groq.api.key:your_groq_api_key_here}")
    private String groqApiKey;

    public AIExerciseService(
            ExerciseRepository exerciseRepository,
            ExerciseQuestionRepository questionRepository,
            ExerciseSubmissionRepository submissionRepository,
            QuizResultRepository quizResultRepository,
            UserProgressRepository progressRepository,
            UserRepository userRepository,
            AIGradingService aiGradingService) {
        this.exerciseRepository = exerciseRepository;
        this.questionRepository = questionRepository;
        this.submissionRepository = submissionRepository;
        this.quizResultRepository = quizResultRepository;
        this.progressRepository = progressRepository;
        this.userRepository = userRepository;
        this.aiGradingService = aiGradingService;
        this.objectMapper = new ObjectMapper();
    }

    // ─── Configuration: Available Skills ─────────────────────────────────────────
    public List<AIExerciseConfig.SkillOption> getAvailableSkills() {
        return List.of(
            new AIExerciseConfig.SkillOption("READING", "Đọc hiểu", "book-open", "#8B5CF6", "Đọc đoạn văn và trả lời câu hỏi"),
            new AIExerciseConfig.SkillOption("LISTENING", "Nghe hiểu", "headphones", "#3B82F6", "Nghe audio và trả lời câu hỏi"),
            new AIExerciseConfig.SkillOption("WRITING", "Viết bài", "pen-tool", "#F59E0B", "Viết bài luận với phản hồi AI"),
            new AIExerciseConfig.SkillOption("SPEAKING", "Nói tiếng Anh", "mic", "#22C55E", "Ghi âm và nhận phản hồi AI")
        );
    }

    // ─── Configuration: Topics by Skill ──────────────────────────────────────────
    public List<AIExerciseConfig.TopicOption> getTopicsBySkill(String skill) {
        Map<String, List<AIExerciseConfig.TopicOption>> topics = Map.of(
            "READING", List.of(
                new AIExerciseConfig.TopicOption("travel", "Du lịch", "✈️", "travel", "trip", "vacation", "destination"),
                new AIExerciseConfig.TopicOption("business", "Kinh doanh", "💼", "business", "meeting", "office", "career"),
                new AIExerciseConfig.TopicOption("daily-life", "Đời thường", "🏠", "daily", "life", "routine", "home"),
                new AIExerciseConfig.TopicOption("technology", "Công nghệ", "💻", "technology", "computer", "internet", "digital"),
                new AIExerciseConfig.TopicOption("health", "Sức khỏe", "🏥", "health", "exercise", "food", "medical"),
                new AIExerciseConfig.TopicOption("education", "Giáo dục", "🎓", "education", "school", "study", "university"),
                new AIExerciseConfig.TopicOption("environment", "Môi trường", "🌍", "environment", "climate", "nature", "pollution"),
                new AIExerciseConfig.TopicOption("entertainment", "Giải trí", "🎬", "movie", "music", "entertainment", "celebrity"),
                new AIExerciseConfig.TopicOption("science", "Khoa học", "🔬", "science", "research", "discovery", "experiment"),
                new AIExerciseConfig.TopicOption("sports", "Thể thao", "⚽", "sports", "football", "athlete", "competition")
            ),
            "LISTENING", List.of(
                new AIExerciseConfig.TopicOption("travel", "Du lịch", "✈️", "airport", "hotel", "booking"),
                new AIExerciseConfig.TopicOption("business", "Kinh doanh", "💼", "meeting", "presentation", "conference"),
                new AIExerciseConfig.TopicOption("daily-life", "Đời thường", "🏠", "shopping", "restaurant", "direction"),
                new AIExerciseConfig.TopicOption("technology", "Công nghệ", "💻", "gadget", "app", "software"),
                new AIExerciseConfig.TopicOption("news", "Tin tức", "📰", "news", "broadcast", "report"),
                new AIExerciseConfig.TopicOption("interview", "Phỏng vấn", "🎤", "interview", "conversation", "dialogue"),
                new AIExerciseConfig.TopicOption("lecture", "Bài giảng", "🎓", "lecture", "talk", "speech"),
                new AIExerciseConfig.TopicOption("podcast", "Podcast", "🎧", "podcast", "discussion", "episode")
            ),
            "WRITING", List.of(
                new AIExerciseConfig.TopicOption("opinion", "Trình bày ý kiến", "💡", "opinion", "think", "believe"),
                new AIExerciseConfig.TopicOption("descriptive", "Miêu tả", "📝", "describe", "explain", "narrate"),
                new AIExerciseConfig.TopicOption("formal-letter", "Thư formal", "✉️", "letter", "application", "request"),
                new AIExerciseConfig.TopicOption("essay", "Essay", "📄", "essay", "argument", "discussion"),
                new AIExerciseConfig.TopicOption("email", "Email", "📧", "email", "message", "reply")
            ),
            "SPEAKING", List.of(
                new AIExerciseConfig.TopicOption("introduction", "Giới thiệu bản thân", "👋", "introduce", "myself", "hobby"),
                new AIExerciseConfig.TopicOption("opinion", "Trình bày ý kiến", "💬", "opinion", "think", "feel"),
                new AIExerciseConfig.TopicOption("describe-situation", "Mô tả tình huống", "🗣️", "describe", "situation", "experience"),
                new AIExerciseConfig.TopicOption("roleplay", "Đóng vai", "🎭", "roleplay", "situation", "dialogue"),
                new AIExerciseConfig.TopicOption("summarize", "Tóm tắt", "📋", "summarize", "summarize", "explain")
            )
        );
        return topics.getOrDefault(skill.toUpperCase(), List.of());
    }

    // ─── Configuration: Levels ──────────────────────────────────────────────────
    public List<Map<String, String>> getAvailableLevels() {
        return List.of(
            Map.of("id", "A1", "label", "A1 - Beginner", "description", "Người mới bắt đầu"),
            Map.of("id", "A2", "label", "A2 - Elementary", "description", "Sơ cấp"),
            Map.of("id", "B1", "label", "B1 - Intermediate", "description", "Trung cấp"),
            Map.of("id", "B2", "label", "B2 - Upper Intermediate", "description", "Trung cấp cao"),
            Map.of("id", "C1", "label", "C1 - Advanced", "description", "Nâng cao")
        );
    }

    // ─── Generate / Load Exercise ─────────────────────────────────────────────────
    public AIExerciseData generateExercise(String skill, String topic, String level, Long userId) {
        try {
            Exercise exercise = findOrCreateExercise(skill, topic, level, userId);
            List<ExerciseQuestion> questions = questionRepository.findByExerciseIdOrderByOrderIndexAsc(exercise.getId());

            if (questions.isEmpty()) {
                questions = generateQuestionsForExercise(exercise);
            }

            return buildExerciseData(exercise, questions);
        } catch (Exception e) {
            log.error("Error generating exercise: {}", e.getMessage(), e);
            throw new RuntimeException("Không thể tạo bài tập: " + e.getMessage());
        }
    }

    private Exercise findOrCreateExercise(String skill, String topic, String level, Long userId) {
        String normalizedSkill = skill.toUpperCase();
        String normalizedTopic = topic != null ? topic.toLowerCase() : "general";
        String normalizedLevel = level != null ? level.toUpperCase() : "A1";

        Exercise.ExerciseType exType = mapSkillToExerciseType(normalizedSkill);

        Level userLevel = Level.A1;
        try {
            userLevel = Level.valueOf(normalizedLevel);
        } catch (Exception ignored) {}

        List<Exercise> existing = exerciseRepository.findByActiveTrueAndTypeAndLevel(exType, userLevel);
        if (existing != null && !existing.isEmpty()) {
            for (Exercise ex : existing) {
                if (normalizedTopic.equalsIgnoreCase(ex.getTopic())) {
                    return ex;
                }
            }
            return existing.get(0);
        }

        Exercise exercise = new Exercise();
        exercise.setTitle(buildExerciseTitle(normalizedSkill, normalizedTopic, normalizedLevel));
        exercise.setType(exType);
        exercise.setLevel(userLevel);
        exercise.setTopic(normalizedTopic);
        exercise.setDescription(buildExerciseDescription(normalizedSkill, normalizedTopic, normalizedLevel));
        exercise.setInstructions(buildExerciseInstructions(normalizedSkill, normalizedLevel));
        exercise.setDurationMinutes(getDurationForSkill(normalizedSkill));
        exercise.setMaxScore(10);
        exercise.setActive(true);
        exercise.setCreatedBy(userId);

        return exerciseRepository.save(exercise);
    }

    private List<ExerciseQuestion> generateQuestionsForExercise(Exercise exercise) throws Exception {
        List<ExerciseQuestion> questions = new ArrayList<>();

        try {
            String prompt = buildQuestionGenerationPrompt(exercise);
            String response = callGroqForQuestionGeneration(prompt);

            if (response != null) {
                questions = parseGeneratedQuestions(response, exercise);
            }
        } catch (Exception e) {
            log.error("Failed to generate questions with AI: {}", e.getMessage());
        }

        if (questions.isEmpty()) {
            questions = generateDefaultQuestions(exercise);
        }

        for (int i = 0; i < questions.size(); i++) {
            questions.get(i).setOrderIndex(i);
            questionRepository.save(questions.get(i));
        }

        return questions;
    }

    private String buildQuestionGenerationPrompt(Exercise exercise) {
        String skill = exercise.getType().name();
        String topic = exercise.getTopic();
        String level = exercise.getLevel() != null ? exercise.getLevel().name() : "A1";

        StringBuilder prompt = new StringBuilder();
        prompt.append("Generate 5 English ").append(skill.toLowerCase()).append(" questions for level ").append(level).append(" on topic: ").append(topic).append(".\n\n");

        switch (skill) {
            case "READING" -> {
                prompt.append("""
Generate a READING exercise with:
- 1 reading passage (4-6 sentences suitable for level)
- 3 multiple choice comprehension questions about the passage

Return JSON:
{
  "passage": "English passage about the topic",
  "questions": [
    {
      "question": "Question text in English",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "A"
    }
  ]
}
""");
            }
            case "LISTENING" -> {
                prompt.append("""
Generate a LISTENING exercise with:
- 1 short dialogue or monologue script (3-5 exchanges)
- 3 comprehension questions (multiple choice)

Return JSON:
{
  "script": "The full listening script in English",
  "questions": [
    {
      "question": "Question about the listening",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "A"
    }
  ]
}
""");
            }
            case "WRITING" -> {
                prompt.append("""
Generate a WRITING prompt:
- 1 writing prompt/task

Return JSON:
{
  "prompt": "Writing task description",
  "requirements": "Minimum requirements (word count, format, etc.)"
}
""");
            }
            case "SPEAKING" -> {
                prompt.append("""
Generate 3 SPEAKING prompts:
- 1 introduction/tell-me-about prompt
- 2 discussion/describe prompts

Return JSON:
{
  "prompts": [
    {
      "prompt": "Speaking prompt text",
      "type": "introduction"
    }
  ]
}
""");
            }
        }

        return prompt.toString();
    }

    private String callGroqForQuestionGeneration(String prompt) {
        if (groqApiKey == null || groqApiKey.isEmpty() ||
            groqApiKey.equals("your_groq_api_key_here")) {
            return null;
        }

        try {
            org.springframework.web.reactive.function.client.WebClient webClient =
                org.springframework.web.reactive.function.client.WebClient.builder()
                    .baseUrl("https://api.groq.com")
                    .defaultHeader("Authorization", "Bearer " + groqApiKey)
                    .defaultHeader("Content-Type", "application/json")
                    .build();

            @SuppressWarnings("unchecked")
            Map<String, Object> response = webClient.post()
                .uri("/openai/v1/chat/completions")
                .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                .bodyValue(Map.of(
                    "model", "llama-3.1-8b-instant",
                    "messages", List.of(Map.of("role", "user", "content", prompt)),
                    "temperature", 0.7,
                    "max_tokens", 2048
                ))
                .retrieve()
                .bodyToMono(Map.class)
                .timeout(java.time.Duration.ofSeconds(30))
                .block();

            if (response != null && response.containsKey("choices")) {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> choices = (List<Map<String, Object>>) response.get("choices");
                if (!choices.isEmpty()) {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> message = (Map<String, Object>) choices.get(0).get("message");
                    return (String) message.get("content");
                }
            }
        } catch (Exception e) {
            log.error("Groq question generation error: {}", e.getMessage());
        }
        return null;
    }

    private List<ExerciseQuestion> parseGeneratedQuestions(String response, Exercise exercise) {
        List<ExerciseQuestion> questions = new ArrayList<>();

        try {
            String jsonStr = extractJsonBlock(response);
            if (jsonStr == null) return questions;

            Map<String, Object> parsed = objectMapper.readValue(jsonStr, new TypeReference<Map<String, Object>>() {});
            String skill = exercise.getType().name();

            switch (skill) {
                case "READING" -> {
                    String passage = (String) parsed.get("passage");
                    if (passage != null) {
                        exercise.setContent(passage);
                        exerciseRepository.save(exercise);
                    }
                    @SuppressWarnings("unchecked")
                    List<Map<String, Object>> qList = (List<Map<String, Object>>) parsed.get("questions");
                    if (qList != null) {
                        for (int i = 0; i < qList.size(); i++) {
                            Map<String, Object> q = qList.get(i);
                            ExerciseQuestion eq = new ExerciseQuestion();
                            eq.setExerciseId(exercise.getId());
                            eq.setQuestion((String) q.get("question"));
                            eq.setType(QuestionType.MULTIPLE_CHOICE);
                            eq.setCorrectAnswer((String) q.get("correctAnswer"));
                            @SuppressWarnings("unchecked")
                            List<String> opts = (List<String>) q.get("options");
                            if (opts != null) eq.setOptions(objectMapper.writeValueAsString(opts));
                            eq.setPoints(1);
                            questions.add(eq);
                        }
                    }
                }
                case "LISTENING" -> {
                    String script = (String) parsed.get("script");
                    if (script != null) {
                        exercise.setContent(script);
                        exerciseRepository.save(exercise);
                    }
                    @SuppressWarnings("unchecked")
                    List<Map<String, Object>> qList = (List<Map<String, Object>>) parsed.get("questions");
                    if (qList != null) {
                        for (Map<String, Object> q : qList) {
                            ExerciseQuestion eq = new ExerciseQuestion();
                            eq.setExerciseId(exercise.getId());
                            eq.setQuestion((String) q.get("question"));
                            eq.setType(QuestionType.MULTIPLE_CHOICE);
                            eq.setCorrectAnswer((String) q.get("correctAnswer"));
                            @SuppressWarnings("unchecked")
                            List<String> opts = (List<String>) q.get("options");
                            if (opts != null) eq.setOptions(objectMapper.writeValueAsString(opts));
                            eq.setPoints(1);
                            questions.add(eq);
                        }
                    }
                }
                case "WRITING" -> {
                    String prompt = (String) parsed.get("prompt");
                    if (prompt == null) prompt = (String) parsed.get("task");
                    if (prompt != null) {
                        ExerciseQuestion eq = new ExerciseQuestion();
                        eq.setExerciseId(exercise.getId());
                        eq.setQuestion(prompt);
                        eq.setType(QuestionType.ESSAY);
                        eq.setPoints(10);
                        String reqs = (String) parsed.get("requirements");
                        if (reqs != null) eq.setExplanation(reqs);
                        questions.add(eq);
                    }
                }
                case "SPEAKING" -> {
                    @SuppressWarnings("unchecked")
                    List<Map<String, Object>> prompts = (List<Map<String, Object>>) parsed.get("prompts");
                    if (prompts != null) {
                        for (int i = 0; i < prompts.size(); i++) {
                            Map<String, Object> p = prompts.get(i);
                            ExerciseQuestion eq = new ExerciseQuestion();
                            eq.setExerciseId(exercise.getId());
                            eq.setQuestion((String) p.get("prompt"));
                            eq.setType(QuestionType.PRONUNCIATION);
                            eq.setPoints(10);
                            questions.add(eq);
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.error("Parse generated questions error: {}", e.getMessage());
        }

        return questions;
    }

    private List<ExerciseQuestion> generateDefaultQuestions(Exercise exercise) throws Exception {
        List<ExerciseQuestion> questions = new ArrayList<>();
        String skill = exercise.getType().name();
        String topic = exercise.getTopic() != null ? exercise.getTopic() : "general";
        String level = exercise.getLevel() != null ? exercise.getLevel().name() : "A1";

        switch (skill) {
            case "READING" -> {
                String passage = getDefaultPassage(topic, level);
                exercise.setContent(passage);
                exerciseRepository.save(exercise);

                List<String[]> defaultQs = getDefaultReadingQuestions(topic, level);
                for (int i = 0; i < defaultQs.size(); i++) {
                    String[] q = defaultQs.get(i);
                    ExerciseQuestion eq = new ExerciseQuestion();
                    eq.setExerciseId(exercise.getId());
                    eq.setQuestion(q[0]);
                    eq.setType(QuestionType.MULTIPLE_CHOICE);
                    eq.setOptions(objectMapper.writeValueAsString(new String[]{q[1], q[2], q[3], q[4]}));
                    eq.setCorrectAnswer(q[5]);
                    eq.setPoints(1);
                    eq.setExplanation(q[6]);
                    questions.add(eq);
                }
            }
            case "LISTENING" -> {
                String script = getDefaultListeningScript(topic, level);
                exercise.setContent(script);
                exerciseRepository.save(exercise);

                List<String[]> defaultQs = getDefaultListeningQuestions(topic, level);
                for (String[] q : defaultQs) {
                    ExerciseQuestion eq = new ExerciseQuestion();
                    eq.setExerciseId(exercise.getId());
                    eq.setQuestion(q[0]);
                    eq.setType(QuestionType.MULTIPLE_CHOICE);
                    eq.setOptions(objectMapper.writeValueAsString(new String[]{q[1], q[2], q[3], q[4]}));
                    eq.setCorrectAnswer(q[5]);
                    eq.setPoints(1);
                    questions.add(eq);
                }
            }
            case "WRITING" -> {
                String[] writingTasks = getDefaultWritingPrompt(topic, level);
                ExerciseQuestion eq = new ExerciseQuestion();
                eq.setExerciseId(exercise.getId());
                eq.setQuestion(writingTasks[0]);
                eq.setType(QuestionType.ESSAY);
                eq.setExplanation(writingTasks[1]);
                eq.setPoints(10);
                questions.add(eq);
            }
            case "SPEAKING" -> {
                List<String> speakingPrompts = getDefaultSpeakingPrompts(topic, level);
                for (int i = 0; i < speakingPrompts.size(); i++) {
                    ExerciseQuestion eq = new ExerciseQuestion();
                    eq.setExerciseId(exercise.getId());
                    eq.setQuestion(speakingPrompts.get(i));
                    eq.setType(QuestionType.PRONUNCIATION);
                    eq.setPoints(10);
                    questions.add(eq);
                }
            }
        }

        return questions;
    }

    // ─── Grading ─────────────────────────────────────────────────────────────────
    @Transactional
    public GradingResult gradeExercise(Long exerciseId, Map<String, Object> answers, Long userId) {
        Exercise exercise = exerciseRepository.findById(exerciseId)
            .orElseThrow(() -> new RuntimeException("Exercise not found: " + exerciseId));

        List<ExerciseQuestion> questions = questionRepository.findByExerciseIdOrderByOrderIndexAsc(exerciseId);
        String skill = exercise.getType().name();

        int correctCount = 0;
        int totalCount = questions.size();
        double totalScore = 0;
        double maxScore = 0;
        List<Map<String, Object>> questionResults = new ArrayList<>();
        List<Map<String, Object>> aiDetails = new ArrayList<>();

        for (ExerciseQuestion question : questions) {
            String answerKey = "q_" + question.getId();
            Object rawAnswer = answers.get(answerKey);
            String userAnswer = rawAnswer != null ? rawAnswer.toString().trim() : "";
            String correctAnswer = question.getCorrectAnswer() != null ? question.getCorrectAnswer().trim() : "";

            Map<String, Object> qResult = new LinkedHashMap<>();
            qResult.put("questionId", question.getId());
            qResult.put("question", question.getQuestion());
            qResult.put("type", question.getType() != null ? question.getType().name() : "UNKNOWN");
            qResult.put("userAnswer", userAnswer);

            boolean isCorrect = false;
            double earnedPoints = 0;
            AIGradingService.GradingResult aiResult = null;

            switch (question.getType()) {
                case MULTIPLE_CHOICE, FILL_BLANK -> {
                    isCorrect = userAnswer.equalsIgnoreCase(correctAnswer);
                    if (isCorrect) correctCount++;
                    earnedPoints = isCorrect ? question.getPoints() : 0;
                    qResult.put("correct", isCorrect);
                    qResult.put("correctAnswer", correctAnswer);
                }
                case ESSAY -> {
                    if (userAnswer.length() >= 10) {
                        try {
                            aiResult = aiGradingService.gradeEssay(
                                question.getQuestion(), userAnswer,
                                exercise.getContent()
                            );
                            if (aiResult.score() != null) {
                                earnedPoints = (aiResult.score() / 10.0) * question.getPoints();
                                qResult.put("aiScore", aiResult.score());
                                qResult.put("aiFeedback", aiResult.feedback());
                                qResult.put("aiDetails", aiResult.details());
                                aiDetails.add(Map.of(
                                    "question", question.getQuestion(),
                                    "score", aiResult.score(),
                                    "feedback", aiResult.feedback(),
                                    "type", "essay"
                                ));
                            }
                        } catch (Exception e) {
                            qResult.put("aiFeedback", "Không thể chấm bài lúc này.");
                        }
                    }
                    qResult.put("correct", null);
                }
                case PRONUNCIATION -> {
                    if (userAnswer.length() >= 5) {
                        try {
                            aiResult = aiGradingService.gradeSpeaking(
                                question.getQuestion(), userAnswer,
                                exercise.getContent()
                            );
                            if (aiResult.score() != null) {
                                earnedPoints = (aiResult.score() / 10.0) * question.getPoints();
                                qResult.put("aiScore", aiResult.score());
                                qResult.put("aiFeedback", aiResult.feedback());
                                qResult.put("aiDetails", aiResult.details());
                                qResult.put("transcript", userAnswer);
                                aiDetails.add(Map.of(
                                    "question", question.getQuestion(),
                                    "score", aiResult.score(),
                                    "feedback", aiResult.feedback(),
                                    "type", "speaking"
                                ));
                            }
                        } catch (Exception e) {
                            qResult.put("aiFeedback", "Không thể chấm bài lúc này.");
                        }
                    }
                    qResult.put("correct", null);
                }
                default -> {
                    qResult.put("correct", null);
                    qResult.put("correctAnswer", correctAnswer);
                }
            }

            totalScore += earnedPoints;
            maxScore += question.getPoints();
            questionResults.add(qResult);
        }

        double score = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) / 10.0 : 0.0;
        int xpEarned = (int) Math.round(score * 10);

        // Save quiz result
        QuizResult quizResult = new QuizResult();
        quizResult.setUserId(userId);
        quizResult.setLessonId(exerciseId);
        quizResult.setTotalQuestions(totalCount);
        quizResult.setCorrectAnswers(correctCount);
        quizResult.setScore(score);
        quizResult.setQuizType(skill);
        quizResult.setCompletedAt(LocalDateTime.now());
        quizResultRepository.save(quizResult);

        // Save results to DB
        for (Map<String, Object> qr : questionResults) {
            com.abcenglish.entity.ExerciseSubmission submission = new com.abcenglish.entity.ExerciseSubmission();
            submission.setUserId(userId);
            submission.setExerciseId(exerciseId);
            Object qId = qr.get("questionId");
            if (qId != null) submission.setQuestionId(((Number) qId).longValue());
            submission.setUserAnswer((String) qr.get("userAnswer"));
            submission.setCorrectAnswer((String) qr.get("correctAnswer"));
            Object correct = qr.get("correct");
            if (correct instanceof Boolean) submission.setCorrect((Boolean) correct);
            submission.setQuestionType((String) qr.get("type"));
            submission.setPointsEarned((int) totalScore);
            submission.setMaxPoints((int) maxScore);
            Object aiScore = qr.get("aiScore");
            if (aiScore instanceof Number) {
                submission.setAiScore(((Number) aiScore).doubleValue());
                submission.setAiFeedback((String) qr.get("aiFeedback"));
            }
            submissionRepository.save(submission);
        }

        return buildGradingResult(score, correctCount, totalCount, xpEarned, questionResults, aiDetails, skill);
    }

    // ─── Real-time AI Grading (single question) ───────────────────────────────────
    public GradingResult gradeSingleAnswer(Long exerciseId, Long questionId, String userAnswer, Long userId) {
        ExerciseQuestion question = questionRepository.findById(questionId)
            .orElseThrow(() -> new RuntimeException("Question not found"));

        Exercise exercise = exerciseRepository.findById(exerciseId).orElse(null);
        AIGradingService.GradingResult aiResult = null;

        switch (question.getType()) {
            case ESSAY -> {
                aiResult = aiGradingService.gradeEssay(
                    question.getQuestion(), userAnswer,
                    exercise != null ? exercise.getContent() : null
                );
            }
            case PRONUNCIATION -> {
                aiResult = aiGradingService.gradeSpeaking(
                    question.getQuestion(), userAnswer,
                    exercise != null ? exercise.getContent() : null
                );
            }
            default -> {
                boolean correct = userAnswer.equalsIgnoreCase(
                    question.getCorrectAnswer() != null ? question.getCorrectAnswer().trim() : "");
                GradingResult gr = new GradingResult();
                gr.setScore(correct ? 10.0 : 0.0);
                gr.setCorrectCount(correct ? 1 : 0);
                gr.setTotalCount(1);
                gr.setFeedback(correct ? "Chính xác!" : "Chưa đúng. Đáp án đúng: " + question.getCorrectAnswer());
                gr.setQuestionResults(List.of(Map.of(
                    "correct", correct,
                    "userAnswer", userAnswer,
                    "correctAnswer", question.getCorrectAnswer() != null ? question.getCorrectAnswer() : ""
                )));
                return gr;
            }
        }

        if (aiResult != null) {
            GradingResult gr = new GradingResult();
            gr.setScore(aiResult.score() != null ? aiResult.score() : 0.0);
            gr.setFeedback(aiResult.feedback());
            gr.setDetails(new ArrayList<>());
            gr.setTotalCount(1);
            gr.setCorrectCount(aiResult.score() != null && aiResult.score() >= 5.0 ? 1 : 0);
            return gr;
        }

        GradingResult gr = new GradingResult();
        gr.setScore(0.0);
        gr.setFeedback("Không thể chấm bài. Vui lòng thử lại.");
        gr.setTotalCount(1);
        return gr;
    }

    // ─── Speech-to-Text for Speaking ──────────────────────────────────────────────
    public String transcribeAudio(byte[] audioData, String fileName) {
        if (audioData == null || audioData.length == 0) {
            return null;
        }

        try {
            if (groqApiKey == null || groqApiKey.isEmpty() ||
                groqApiKey.equals("your_groq_api_key_here")) {
                log.info("Groq API key not configured, returning mock transcription");
                return "Mock transcription for audio file: " + fileName;
            }

            // Use WebClient with multipart file upload for Whisper API
            org.springframework.web.reactive.function.client.WebClient groqClient =
                org.springframework.web.reactive.function.client.WebClient.builder()
                    .baseUrl("https://api.groq.com")
                    .defaultHeader("Authorization", "Bearer " + groqApiKey)
                    .build();

            // Create multipart body with the audio file
            String boundary = "----FormBoundary" + System.currentTimeMillis();
            byte[] multipartBody = buildMultipartBody(audioData, fileName, boundary);

            String response = groqClient.post()
                .uri("/openai/v1/audio/transcriptions")
                .contentType(org.springframework.http.MediaType.parseMediaType("multipart/form-data; boundary=" + boundary))
                .bodyValue(multipartBody)
                .retrieve()
                .bodyToMono(String.class)
                .timeout(java.time.Duration.ofSeconds(30))
                .block();

            if (response != null) {
                // Parse {"text": "..."} from response
                try {
                    Map<String, Object> parsed = objectMapper.readValue(response, new TypeReference<Map<String, Object>>() {});
                    return (String) parsed.get("text");
                } catch (Exception e) {
                    log.warn("Failed to parse transcription response: {}", response);
                    return null;
                }
            }
        } catch (Exception e) {
            log.error("Speech-to-text error: {}", e.getMessage());
        }

        return null;
    }

    private byte[] buildMultipartBody(byte[] fileData, String fileName, String boundary) {
        StringBuilder sb = new StringBuilder();
        String CRLF = "\r\n";

        // Model field
        sb.append("--").append(boundary).append(CRLF);
        sb.append("Content-Disposition: form-data; name=\"model\"").append(CRLF).append(CRLF);
        sb.append("whisper-large-v3").append(CRLF);

        // File field
        sb.append("--").append(boundary).append(CRLF);
        sb.append("Content-Disposition: form-data; name=\"file\"; filename=\"").append(fileName).append("\"").append(CRLF);
        sb.append("Content-Type: audio/webm").append(CRLF).append(CRLF);

        byte[] headerBytes = sb.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8);
        byte[] footerBytes = (CRLF + "--" + boundary + "--" + CRLF).getBytes(java.nio.charset.StandardCharsets.UTF_8);

        byte[] result = new byte[headerBytes.length + fileData.length + footerBytes.length];
        System.arraycopy(headerBytes, 0, result, 0, headerBytes.length);
        System.arraycopy(fileData, 0, result, headerBytes.length, fileData.length);
        System.arraycopy(footerBytes, 0, result, headerBytes.length + fileData.length, footerBytes.length);

        return result;
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────────
    private AIExerciseData buildExerciseData(Exercise exercise, List<ExerciseQuestion> questions) {
        AIExerciseData data = new AIExerciseData();
        data.setExerciseId(exercise.getId());
        data.setTitle(exercise.getTitle());
        data.setSkill(exercise.getType() != null ? exercise.getType().name() : null);
        data.setTopic(exercise.getTopic());
        data.setLevel(exercise.getLevel() != null ? exercise.getLevel().name() : null);
        data.setDurationMinutes(exercise.getDurationMinutes());
        data.setQuestionCount(questions.size());

        List<Map<String, Object>> questionList = questions.stream().map(q -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", q.getId());
            m.put("question", q.getQuestion());
            m.put("type", q.getType() != null ? q.getType().name() : null);
            m.put("content", q.getContent());
            m.put("options", parseOptions(q.getOptions()));
            m.put("points", q.getPoints());
            m.put("explanation", q.getExplanation());
            m.put("orderIndex", q.getOrderIndex());
            return m;
        }).collect(Collectors.toList());
        data.setQuestions(questionList);

        return data;
    }

    private GradingResult buildGradingResult(double score, int correctCount, int totalCount,
            int xpEarned, List<Map<String, Object>> questionResults,
            List<Map<String, Object>> aiDetails, String skill) {

        GradingResult result = new GradingResult();
        result.setScore(score);
        result.setCorrectCount(correctCount);
        result.setTotalCount(totalCount);
        result.setXpEarned((double) xpEarned);
        result.setQuestionResults(questionResults);

        if (!aiDetails.isEmpty()) {
            double avgAiScore = aiDetails.stream()
                .mapToDouble(m -> ((Number) m.get("score")).doubleValue())
                .average().orElse(0);
            result.setOverallFeedback(String.format(
                "Bạn đã được %.1f/10 điểm cho phần tự luận. Xem chi tiết từng câu bên dưới.", avgAiScore));
            result.setDetails(aiDetails);
        }

        result.setFeedback(getFeedbackForScore(score, skill));
        result.setSuggestions(getSuggestionsForScore(score, skill));

        return result;
    }

    private String getFeedbackForScore(double score, String skill) {
        if (score >= 9) return "Xuất sắc! Bạn đã thể hiện rất tốt kỹ năng " + skill.toLowerCase() + ".";
        if (score >= 7) return "Tốt lắm! Bạn nắm vững kiến thức. Cần cải thiện thêm một số điểm nhỏ.";
        if (score >= 5) return "Đạt yêu cầu. Hãy ôn lại các điểm còn yếu để cải thiện điểm số.";
        if (score >= 3) return "Cần cố gắng hơn. Bạn nên ôn lại bài và thực hành thêm.";
        return "Cần cải thiện nhiều. Hãy học lại từ cơ bản và thực hành mỗi ngày.";
    }

    private List<String> getSuggestionsForScore(double score, String skill) {
        List<String> suggestions = new ArrayList<>();
        if (score < 7) {
            suggestions.add("Ôn lại từ vựng và ngữ pháp liên quan đến chủ đề");
            suggestions.add("Thực hành đọc/nghe thêm các bài tương tự");
        }
        if (score < 5) {
            suggestions.add("Xem lại các cấu trúc câu cơ bản");
            suggestions.add("Học thêm từ vựng trong chủ đề này");
        }
        if ("WRITING".equals(skill) || "SPEAKING".equals(skill)) {
            if (score < 7) {
                suggestions.add("Chú ý đến ngữ pháp và cách diễn đạt tự nhiên");
                suggestions.add("Luyện viết/nói nhiều hơn với chủ đề tương tự");
            }
        }
        suggestions.add("Tiếp tục luyện tập đều đặn để cải thiện!");
        return suggestions;
    }

    private Exercise.ExerciseType mapSkillToExerciseType(String skill) {
        return switch (skill) {
            case "READING" -> Exercise.ExerciseType.READING;
            case "LISTENING" -> Exercise.ExerciseType.LISTENING;
            case "WRITING" -> Exercise.ExerciseType.WRITING;
            case "SPEAKING" -> Exercise.ExerciseType.SPEAKING;
            default -> Exercise.ExerciseType.MIXED;
        };
    }

    private String buildExerciseTitle(String skill, String topic, String level) {
        String topicLabel = switch (topic.toLowerCase()) {
            case "travel" -> "Du lịch";
            case "business" -> "Kinh doanh";
            case "daily-life" -> "Đời thường";
            case "technology" -> "Công nghệ";
            case "health" -> "Sức khỏe";
            case "education" -> "Giáo dục";
            case "environment" -> "Môi trường";
            case "entertainment" -> "Giải trí";
            case "science" -> "Khoa học";
            case "sports" -> "Thể thao";
            case "opinion" -> "Trình bày ý kiến";
            case "descriptive" -> "Miêu tả";
            case "formal-letter" -> "Thư formal";
            case "essay" -> "Essay";
            case "email" -> "Email";
            case "introduction" -> "Giới thiệu";
            case "describe-situation" -> "Mô tả tình huống";
            case "news" -> "Tin tức";
            case "interview" -> "Phỏng vấn";
            case "lecture" -> "Bài giảng";
            case "podcast" -> "Podcast";
            case "roleplay" -> "Đóng vai";
            case "summarize" -> "Tóm tắt";
            default -> "Tổng quát";
        };
        return String.format("Bài %s - %s (Cấp %s)", skill, topicLabel, level);
    }

    private String buildExerciseDescription(String skill, String topic, String level) {
        return String.format("Bài tập %s cấp độ %s với chủ đề %s. Hệ thống sẽ tự động chấm điểm và đưa ra phản hồi chi tiết.",
            skill.toLowerCase(), level, topic);
    }

    private String buildExerciseInstructions(String skill, String level) {
        return switch (skill) {
            case "READING" -> "Đọc kỹ đoạn văn và chọn đáp án đúng cho mỗi câu hỏi. Không được quay lại sửa sau khi nộp.";
            case "LISTENING" -> "Nghe kỹ audio và chọn đáp án đúng. Bạn chỉ có thể nghe 2 lần. Không dừng giữa chừng.";
            case "WRITING" -> "Viết bài luận ít nhất 100 từ theo yêu cầu. Bài viết sẽ được AI đánh giá chi tiết.";
            case "SPEAKING" -> "Nhấn nút ghi âm và trả lời câu hỏi bằng tiếng Anh. Bạn có thể ghi âm lại nếu cần.";
            default -> "Làm bài cẩn thận và nộp khi hoàn thành.";
        };
    }

    private int getDurationForSkill(String skill) {
        return switch (skill) {
            case "READING" -> 15;
            case "LISTENING" -> 10;
            case "WRITING" -> 30;
            case "SPEAKING" -> 10;
            default -> 15;
        };
    }

    private Object parseOptions(String options) {
        if (options == null || options.isBlank()) return null;
        try {
            return objectMapper.readValue(options, Object.class);
        } catch (Exception e) {
            return options;
        }
    }

    private String extractJsonBlock(String text) {
        int start = text.indexOf("{");
        int end = text.lastIndexOf("}");
        if (start >= 0 && end > start) {
            return text.substring(start, end + 1);
        }
        return null;
    }

    // ─── Default Reading Content ─────────────────────────────────────────────────
    private String getDefaultPassage(String topic, String level) {
        Map<String, String[]> passages = Map.ofEntries(
            Map.entry("travel", new String[]{
                "Last summer, my family and I traveled to Paris, France. We visited many famous landmarks including the Eiffel Tower and the Louvre Museum. The weather was beautiful, and we spent three days exploring the city. We tried local food like croissants and cheese, which were delicious. This trip was one of the most memorable experiences of my life.",
                "Paris is one of the most beautiful cities in the world. Every year, millions of tourists visit the French capital to see its famous landmarks and experience its unique culture. The city offers world-class museums, delicious cuisine, and stunning architecture. Whether you enjoy art, food, or history, Paris has something for everyone."
            }),
            Map.entry("business", new String[]{
                "Many companies now allow employees to work from home. This change has become very popular since the pandemic. Working from home has both advantages and disadvantages. On the positive side, people save time on commuting and can better balance their work and personal life. However, some workers feel isolated and struggle to stay motivated without direct contact with colleagues.",
                "Remote work has transformed how businesses operate in the 21st century. Companies are discovering that employees can be just as productive, if not more so, when working from home. This new way of working has led to cost savings on office space and has opened up opportunities for hiring talent from anywhere in the world."
            }),
            Map.entry("daily-life", new String[]{
                "I start my day at six in the morning. First, I exercise for thirty minutes, then I take a shower and have breakfast. I usually eat cereal with milk and drink a cup of coffee. After that, I get ready for work and leave my house at eight. I work from nine to five, and in the evening, I like to read books or watch movies.",
                "A typical weekday morning can be quite busy for most people. Many of us rush through our morning routines to get to work or school on time. Having a well-organized morning can make the entire day more productive and enjoyable. Simple habits like preparing clothes the night before or planning breakfast can save valuable time."
            }),
            Map.entry("technology", new String[]{
                "Artificial intelligence is changing the way we live and work. Every day, new applications of AI are being developed to solve problems in healthcare, education, and business. Some people worry that AI might replace human jobs, while others believe it will create new opportunities. Regardless of these concerns, AI is becoming an important part of our daily lives.",
                "Technology has advanced rapidly over the past few decades. Smartphones, computers, and the internet have transformed how we communicate, learn, and work. Young people today grow up with technology as a natural part of their lives. This digital generation is more comfortable with technology than any previous generation."
            }),
            Map.entry("health", new String[]{
                "Regular exercise is important for maintaining good health. Doctors recommend that adults get at least thirty minutes of physical activity every day. Exercise can help prevent diseases, improve mood, and increase energy levels. There are many ways to stay active, including walking, swimming, cycling, or playing sports.",
                "A healthy diet is essential for overall well-being. Eating a variety of fruits, vegetables, and whole grains provides the nutrients our bodies need. Drinking plenty of water and limiting processed foods can also contribute to better health. Many health problems can be prevented by making smart food choices."
            })
        );

        String[] passagesForTopic = passages.get(topic);
        if (passagesForTopic == null) {
            passagesForTopic = passages.get("daily-life");
        }

        return passagesForTopic[0];
    }

    private List<String[]> getDefaultReadingQuestions(String topic, String level) {
        return List.of(
            new String[]{
                "What is the main topic of the passage?",
                "The author talks about traveling to Paris",
                "The author discusses remote work",
                "The author describes daily morning routine",
                "The author explains how AI works",
                "A",
                "This passage is primarily about the author's travel experience."
            },
            new String[]{
                "According to the passage, what is mentioned as a benefit?",
                "Saving money on food",
                "Better work-life balance",
                "Learning new languages",
                "Finding new friends",
                "B",
                "The passage mentions that people save time on commuting and can better balance work and personal life."
            },
            new String[]{
                "What can be inferred from the passage?",
                "The author dislikes the activity described",
                "The author had a positive experience",
                "The author wants to travel again soon",
                "The author learned a new language",
                "B",
                "The author's positive language suggests they had a good experience."
            }
        );
    }

    // ─── Default Listening Content ───────────────────────────────────────────────
    private String getDefaultListeningScript(String topic, String level) {
        return switch (topic.toLowerCase()) {
            case "travel" -> "Man:Excuse me, could you tell me how to get to the train station?\nWoman:Of course! Go straight for two blocks, then turn left at the traffic light. The station is on your right.\nMan:Thank you! Is it far from here?\nWoman:It's about a ten-minute walk. Or you can take bus number 5.\nMan:Great, thanks for your help!\nWoman:You're welcome! Have a nice day!";
            case "business" -> "Woman:Good morning, John. Did you finish the quarterly report?\nMan:Morning, Sarah. Yes, I sent it to your email this morning.\nWoman:Wonderful! The client meeting is tomorrow at 10 AM. Can you prepare a short presentation?\nMan:Sure, I'll have it ready by this afternoon.\nWoman:Perfect. Also, don't forget we have the team meeting at 3 PM.\nMan:I'll be there. See you then!";
            case "daily-life" -> "Woman:Hi, I'd like to make a reservation for dinner tonight.\nMan:Certain! What time would you like?\nWoman:Around 7:30 PM. We have four people.\nMan:No problem. Can I get your name?\nWoman:Yes, it's Thompson. T-H-O-M-P-S-O-N.\nMan:Great, Mrs. Thompson. We'll see you at 7:30 tonight.\nWoman:Thank you so much!";
            case "restaurant" -> "Waiter:Good evening! Welcome to Italian Kitchen. Are you ready to order?\nMan:Yes, please. I'll have the spaghetti with meatballs.\nWoman:Can I get the grilled salmon, please?\nWaiter:Certain! Would you like any appetizers or drinks?\nMan:We'll have a Caesar salad and a bottle of red wine.\nWaiter:Excellent choices! I'll be right back with your order.";
            default -> "Man:Excuse me, do you know what time the library opens?\nWoman:It opens at 9 AM on weekdays and 10 AM on weekends.\nMan:And what time does it close?\nWoman:It closes at 8 PM every day.\nMan:Thank you!\nWoman:You're welcome!";
        };
    }

    private List<String[]> getDefaultListeningQuestions(String topic, String level) {
        return List.of(
            new String[]{
                "What is the man/woman asking about?",
                "The location of the train station",
                "The price of a ticket",
                "The time of the next train",
                "A restaurant recommendation",
                "A",
                "Listen carefully to identify the main topic of the conversation."
            },
            new String[]{
                "How can the person get to the destination?",
                "By taxi",
                "By bus number 5",
                "By subway",
                "By bicycle",
                "B",
                "The conversation mentions bus number 5 as an option."
            },
            new String[]{
                "What time does the place open/close?",
                "8 AM / 6 PM",
                "9 AM / 8 PM",
                "10 AM / 9 PM",
                "7 AM / 7 PM",
                "B",
                "Pay attention to the specific times mentioned in the conversation."
            }
        );
    }

    // ─── Default Writing Prompts ───────────────────────────────────────────────────
    private String[] getDefaultWritingPrompt(String topic, String level) {
        Map<String, String[]> prompts = Map.of(
            "opinion", new String[]{
                "Do you think social media has more advantages or disadvantages? Write an essay of at least 100 words expressing your opinion.",
                "Write at least 100 words. Include: introduction (state your opinion), body paragraphs (support with reasons), conclusion (summarize)."
            },
            "descriptive", new String[]{
                "Describe your favorite place to visit. Explain why this place is special to you and what you enjoy doing there. Write at least 100 words.",
                "Write at least 100 words. Include: description of the place, reasons why you like it, activities you do there."
            },
            "essay", new String[]{
                "Some people believe that children should start learning a foreign language at a very young age. Do you agree or disagree? Write an essay of at least 100 words.",
                "Write at least 100 words. Include: introduction (state your position), body (provide arguments and examples), conclusion."
            },
            "formal-letter", new String[]{
                "Write a formal letter to the manager of a hotel complaining about a recent stay. Describe the problems you experienced and suggest a solution. Write at least 100 words.",
                "Write at least 100 words. Use formal language. Include: introduction (state purpose), body (describe problems), conclusion (suggest solution)."
            },
            "email", new String[]{
                "Write an email to a colleague asking for help with a project. Explain what you need and when you need it. Write at least 100 words.",
                "Write at least 100 words. Be polite and clear. Include: greeting, purpose of the email, specific request, closing."
            }
        );

        String[] prompt = prompts.get(topic);
        if (prompt == null) {
            prompt = prompts.get("opinion");
        }
        return prompt;
    }

    // ─── Default Speaking Prompts ─────────────────────────────────────────────────
    private List<String> getDefaultSpeakingPrompts(String topic, String level) {
        return List.of(
            "Tell me about yourself. What do you do? What are your hobbies?",
            "What is your favorite thing to do on weekends? Describe it in detail.",
            "If you could travel anywhere in the world, where would you go and why?"
        );
    }
}
