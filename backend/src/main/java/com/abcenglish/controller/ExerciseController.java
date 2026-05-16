package com.abcenglish.controller;

import com.abcenglish.dto.ApiResponse;
import com.abcenglish.entity.Exercise;
import com.abcenglish.entity.ExerciseQuestion;
import com.abcenglish.entity.User;
import com.abcenglish.repository.ExerciseQuestionRepository;
import com.abcenglish.repository.ExerciseRepository;
import com.abcenglish.repository.QuizResultRepository;
import com.abcenglish.repository.UserProgressRepository;
import com.abcenglish.service.AIGradingService;
import com.abcenglish.service.ExerciseService;
import com.abcenglish.service.JwtService;
import com.abcenglish.service.VocabularyService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/exercises/v2")
@CrossOrigin(origins = "*")
public class ExerciseController {

    private final ExerciseRepository exerciseRepository;
    private final ExerciseQuestionRepository questionRepository;
    private final QuizResultRepository quizResultRepository;
    private final UserProgressRepository progressRepository;
    private final ExerciseService exerciseService;
    private final AIGradingService aiGradingService;
    private final VocabularyService vocabularyService;
    private final JwtService jwtService;

    public ExerciseController(
            ExerciseRepository exerciseRepository,
            ExerciseQuestionRepository questionRepository,
            QuizResultRepository quizResultRepository,
            UserProgressRepository progressRepository,
            ExerciseService exerciseService,
            AIGradingService aiGradingService,
            VocabularyService vocabularyService,
            JwtService jwtService) {
        this.exerciseRepository = exerciseRepository;
        this.questionRepository = questionRepository;
        this.quizResultRepository = quizResultRepository;
        this.progressRepository = progressRepository;
        this.exerciseService = exerciseService;
        this.aiGradingService = aiGradingService;
        this.vocabularyService = vocabularyService;
        this.jwtService = jwtService;
    }

    /**
     * GET /api/exercises/v2 - List all exercises, filterable
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getAllExercises(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String level,
            @RequestParam(required = false) String skill,
            @RequestParam(required = false) String topic) {
        List<Exercise> exercises;

        if (type != null && level != null) {
            try {
                Exercise.ExerciseType exType = Exercise.ExerciseType.valueOf(type.toUpperCase());
                User.Level exLevel = User.Level.valueOf(level.toUpperCase());
                if (topic != null && !topic.isBlank()) {
                    exercises = exerciseRepository.findByActiveTrueAndTypeAndLevelAndTopicContainingIgnoreCase(exType, exLevel, topic);
                } else {
                    exercises = exerciseRepository.findByActiveTrueAndTypeAndLevel(exType, exLevel);
                }
            } catch (Exception e) {
                exercises = exerciseRepository.findByActiveTrue();
            }
        } else if (type != null) {
            try {
                Exercise.ExerciseType exType = Exercise.ExerciseType.valueOf(type.toUpperCase());
                if (topic != null && !topic.isBlank()) {
                    exercises = exerciseRepository.findByActiveTrueAndTypeAndTopicContainingIgnoreCase(exType, topic);
                } else {
                    exercises = exerciseRepository.findByType(exType);
                }
            } catch (Exception e) {
                exercises = exerciseRepository.findByActiveTrue();
            }
        } else if (topic != null && !topic.isBlank()) {
            exercises = exerciseRepository.findByTopicContainingIgnoreCase(topic);
        } else {
            exercises = exerciseRepository.findByActiveTrue();
        }

        List<Map<String, Object>> result = exercises.stream().map(e -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", e.getId());
            m.put("title", e.getTitle());
            m.put("description", e.getDescription());
            m.put("type", e.getType() != null ? e.getType().name() : null);
            m.put("level", e.getLevel() != null ? e.getLevel().name() : null);
            m.put("duration", e.getDurationMinutes());
            m.put("maxScore", e.getMaxScore());
            m.put("topic", e.getTopic());
            m.put("category", e.getCategory());
            m.put("instructions", e.getInstructions());
            return m;
        }).toList();

        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /**
     * GET /api/exercises/v2/{id} - Get exercise with questions
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getExerciseById(@PathVariable Long id) {
        Exercise exercise = exerciseRepository.findById(id).orElse(null);
        if (exercise == null) {
            return ResponseEntity.status(404).body(ApiResponse.error("Exercise not found"));
        }

        List<ExerciseQuestion> questions = questionRepository.findByExerciseIdOrderByOrderIndexAsc(id);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("id", exercise.getId());
        result.put("title", exercise.getTitle());
        result.put("description", exercise.getDescription());
        result.put("type", exercise.getType() != null ? exercise.getType().name() : null);
        result.put("level", exercise.getLevel() != null ? exercise.getLevel().name() : null);
        result.put("duration", exercise.getDurationMinutes());
        result.put("maxScore", exercise.getMaxScore());
        result.put("topic", exercise.getTopic());
        result.put("category", exercise.getCategory());
        result.put("instructions", exercise.getInstructions());
        result.put("answerKey", exercise.getAnswerKey());

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
            // Include correctAnswer for drag-drop (to validate positions on server)
            // Only include for non-sensitive types
            if (q.getType() != null && (q.getType() == ExerciseQuestion.QuestionType.MATCHING)) {
                m.put("correctAnswer", q.getCorrectAnswer());
            }
            return m;
        }).toList();
        result.put("questions", questionList);
        result.put("questionCount", questionList.size());

        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /**
     * POST /api/exercises/v2/{id}/submit - Submit exercise answers
     * Handles all 5 types: MultipleChoice, Essay, Writing, Speaking, DragDrop(Matching)
     */
    @PostMapping("/{id}/submit")
    public ResponseEntity<ApiResponse<Map<String, Object>>> submitExercise(
            @PathVariable Long id,
            @RequestBody Map<String, Object> answers,
            HttpServletRequest request) {
        Long userId = jwtService.extractUserId(request);
        if (userId == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Authentication required"));
        }

        try {
            Map<String, Object> result = exerciseService.submitExercise(id, answers, userId);
            return ResponseEntity.ok(ApiResponse.ok(result));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * POST /api/exercises/v2/{id}/grade-single - Grade a single question with AI
     * Used for real-time grading of essay/writing/speaking
     */
    @PostMapping("/{id}/grade-single")
    public ResponseEntity<ApiResponse<Map<String, Object>>> gradeSingleQuestion(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body,
            HttpServletRequest request) {
        Long userId = jwtService.extractUserId(request);
        if (userId == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Authentication required"));
        }

        Long questionId = body.get("questionId") != null ?
                ((Number) body.get("questionId")).longValue() : null;
        String userAnswer = body.get("answer") != null ?
                body.get("answer").toString() : "";

        if (questionId == null) {
            return ResponseEntity.badRequest().body(ApiResponse.error("questionId required"));
        }

        ExerciseQuestion question = questionRepository.findById(questionId).orElse(null);
        if (question == null || question.getExerciseId() == null ||
                !question.getExerciseId().equals(id)) {
            return ResponseEntity.status(404).body(ApiResponse.error("Question not found"));
        }

        Exercise exercise = exerciseRepository.findById(id).orElse(null);

        AIGradingService.GradingResult gradingResult = null;

        try {
            switch (question.getType()) {
                case ESSAY -> {
                    gradingResult = aiGradingService.gradeEssay(
                            question.getQuestion(),
                            userAnswer,
                            exercise != null ? exercise.getContent() : null
                    );
                }
                case TRANSLATION -> {
                    gradingResult = aiGradingService.gradeTranslation(
                            question.getQuestion(),
                            userAnswer,
                            question.getCorrectAnswer()
                    );
                }
                case PRONUNCIATION -> {
                    gradingResult = aiGradingService.gradeSpeaking(
                            question.getQuestion(),
                            userAnswer,
                            exercise != null ? exercise.getContent() : null
                    );
                }
                default -> {
                    return ResponseEntity.badRequest()
                            .body(ApiResponse.error("This question type does not need AI grading"));
                }
            }
        } catch (Exception e) {
            return ResponseEntity.status(500)
                    .body(ApiResponse.error("AI grading failed: " + e.getMessage()));
        }

        Map<String, Object> result = new LinkedHashMap<>();
        if (gradingResult != null) {
            result.put("score", gradingResult.score());
            result.put("feedback", gradingResult.feedback());
            result.put("details", gradingResult.details());
        }

        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /**
     * POST /api/exercises/v2/create - Create a new exercise (for teachers/admins)
     */
    @PostMapping("/create")
    public ResponseEntity<ApiResponse<Map<String, Object>>> createExercise(
            @RequestBody Map<String, Object> body,
            HttpServletRequest request) {
        Long userId = jwtService.extractUserId(request);
        if (userId == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Authentication required"));
        }

        try {
            Exercise exercise = new Exercise();
            exercise.setTitle((String) body.get("title"));
            exercise.setDescription((String) body.get("description"));
            exercise.setContent((String) body.get("content"));
            exercise.setInstructions((String) body.get("instructions"));
            exercise.setAnswerKey((String) body.get("answerKey"));
            exercise.setExplanation((String) body.get("explanation"));

            String typeStr = body.get("type") != null ? body.get("type").toString() : "VOCAB_QUIZ";
            exercise.setType(Exercise.ExerciseType.valueOf(typeStr.toUpperCase()));

            String levelStr = body.get("level") != null ? body.get("level").toString() : "A1";
            exercise.setLevel(User.Level.valueOf(levelStr.toUpperCase()));

            exercise.setTopic((String) body.get("topic"));
            exercise.setCategory((String) body.get("category"));
            exercise.setCreatedBy(userId);

            if (body.get("duration") != null) {
                exercise.setDurationMinutes(((Number) body.get("duration")).intValue());
            }
            if (body.get("maxScore") != null) {
                exercise.setMaxScore(((Number) body.get("maxScore")).intValue());
            }

            Exercise saved = exerciseRepository.save(exercise);

            // Save questions
            List<Map<String, Object>> questions = (List<Map<String, Object>>) body.get("questions");
            if (questions != null) {
                for (int i = 0; i < questions.size(); i++) {
                    Map<String, Object> qData = questions.get(i);
                    ExerciseQuestion q = new ExerciseQuestion();
                    q.setExerciseId(saved.getId());
                    q.setQuestion((String) qData.get("question"));
                    q.setContent((String) qData.get("content"));

                    String qType = qData.get("type") != null ?
                            qData.get("type").toString() : "MULTIPLE_CHOICE";
                    q.setType(ExerciseQuestion.QuestionType.valueOf(qType.toUpperCase()));

                    Object opts = qData.get("options");
                    if (opts instanceof List) {
                        q.setOptions(new com.fasterxml.jackson.databind.ObjectMapper()
                                .writeValueAsString(opts));
                    }

                    q.setCorrectAnswer(qData.get("correctAnswer") != null ?
                            qData.get("correctAnswer").toString() : null);
                    q.setExplanation((String) qData.get("explanation"));
                    q.setOrderIndex(i);
                    if (qData.get("points") != null) {
                        q.setPoints(((Number) qData.get("points")).intValue());
                    }
                    questionRepository.save(q);
                }
            }

            Map<String, Object> result = new LinkedHashMap<>();
            result.put("id", saved.getId());
            result.put("title", saved.getTitle());
            result.put("message", "Exercise created successfully");

            return ResponseEntity.ok(ApiResponse.ok(result));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Failed to create exercise: " + e.getMessage()));
        }
    }

    /**
     * GET /api/exercises/v2/results - Get user's exercise history
     */
    @GetMapping("/results")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getUserResults(HttpServletRequest request) {
        Long userId = jwtService.extractUserId(request);
        if (userId == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Authentication required"));
        }

        var results = quizResultRepository.findByUserId(userId);
        List<Map<String, Object>> result = results.stream().map(r -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", r.getId());
            m.put("exerciseId", r.getLessonId());
            m.put("score", r.getScore());
            m.put("correctAnswers", r.getCorrectAnswers());
            m.put("totalQuestions", r.getTotalQuestions());
            m.put("type", r.getQuizType());
            m.put("completedAt", r.getCompletedAt() != null ? r.getCompletedAt().toString() : null);
            return m;
        }).toList();

        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    private Object parseOptions(String options) {
        if (options == null || options.isBlank()) return null;
        try {
            return new com.fasterxml.jackson.databind.ObjectMapper()
                    .readValue(options, Object.class);
        } catch (Exception e) {
            return options;
        }
    }
}
