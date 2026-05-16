package com.abcenglish.controller;

import com.abcenglish.dto.ApiResponse;
import com.abcenglish.entity.Exercise;
import com.abcenglish.entity.ExerciseQuestion;
import com.abcenglish.entity.User;
import com.abcenglish.repository.ExerciseRepository;
import com.abcenglish.repository.ExerciseQuestionRepository;
import com.abcenglish.service.EnhancedExerciseService;
import com.abcenglish.service.JwtService;
import com.abcenglish.service.VocabularyService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/exercises")
@CrossOrigin(origins = "*")
public class EnhancedExerciseController {

    private final EnhancedExerciseService exerciseService;
    private final VocabularyService vocabularyService;
    private final JwtService jwtService;
    private final ExerciseRepository exerciseRepository;
    private final ExerciseQuestionRepository questionRepository;

    public EnhancedExerciseController(EnhancedExerciseService exerciseService,
                                    VocabularyService vocabularyService,
                                    JwtService jwtService,
                                    ExerciseRepository exerciseRepository,
                                    ExerciseQuestionRepository questionRepository) {
        this.exerciseService = exerciseService;
        this.vocabularyService = vocabularyService;
        this.jwtService = jwtService;
        this.exerciseRepository = exerciseRepository;
        this.questionRepository = questionRepository;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getAllExercises(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String level
    ) {
        List<Exercise> exercises;
        if (type != null && level != null) {
            try {
                Exercise.ExerciseType exType = Exercise.ExerciseType.valueOf(type.toUpperCase());
                User.Level exLevel = User.Level.valueOf(level.toUpperCase());
                exercises = exerciseRepository.findByActiveTrueAndTypeAndLevel(exType, exLevel);
            } catch (Exception e) {
                exercises = exerciseRepository.findByActiveTrue();
            }
        } else if (type != null) {
            try {
                Exercise.ExerciseType exType = Exercise.ExerciseType.valueOf(type.toUpperCase());
                exercises = exerciseRepository.findByType(exType);
            } catch (Exception e) {
                exercises = exerciseRepository.findByActiveTrue();
            }
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
            m.put("topic", e.getTopic());
            m.put("active", e.isActive());
            return m;
        }).toList();

        return ResponseEntity.ok(ApiResponse.ok(result));
    }

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
        result.put("topic", exercise.getTopic());
        result.put("instructions", exercise.getInstructions());

        List<Map<String, Object>> questionList = questions.stream().map(q -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", q.getId());
            m.put("question", q.getQuestion());
            m.put("type", q.getType() != null ? q.getType().name() : null);
            m.put("options", q.getOptions());
            m.put("orderIndex", q.getOrderIndex());
            m.put("points", q.getPoints());
            return m;
        }).toList();
        result.put("questions", questionList);

        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PostMapping("/{id}/submit")
    public ResponseEntity<ApiResponse<Map<String, Object>>> submitExercise(
            @PathVariable Long id,
            @RequestBody Map<String, Object> answers,
            HttpServletRequest request) {
        Long userId = jwtService.extractUserId(request);
        if (userId == null) return ResponseEntity.status(401).body(ApiResponse.error("Authentication required"));
        try {
            Map<String, Object> result = exerciseService.submitExercise(id, answers, userId);
            return ResponseEntity.ok(ApiResponse.ok(result));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/suggest-vocab")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> suggestVocabulary(
            @RequestBody Map<String, Object> body,
            HttpServletRequest request) {
        String word = (String) body.get("word");
        String level = body.get("level") != null ? body.get("level").toString() : null;
        if (word == null) return ResponseEntity.badRequest().body(ApiResponse.error("Word required"));

        Long userId = jwtService.extractUserId(request);
        if (userId == null) return ResponseEntity.status(401).body(ApiResponse.error("Authentication required"));

        var words = exerciseService.suggestVocabularyFromIncorrect(word, level);
        List<Map<String, Object>> result = words.stream().map(v -> {
            Map<String, Object> m = Map.of(
                    "id", v.getId(),
                    "word", v.getWord(),
                    "translation", v.getTranslation(),
                    "level", v.getLevel() != null ? v.getLevel().name() : null
            );
            return m;
        }).toList();
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PostMapping("/save-word")
    public ResponseEntity<ApiResponse<Void>> saveWordFromExercise(
            @RequestBody Map<String, Object> body,
            HttpServletRequest request) {
        Long userId = jwtService.extractUserId(request);
        if (userId == null) return ResponseEntity.status(401).body(ApiResponse.error("Authentication required"));
        Object vocabIdObj = body.get("vocabularyId");
        if (vocabIdObj == null) return ResponseEntity.badRequest().body(ApiResponse.error("vocabularyId required"));
        Long vocabularyId = vocabIdObj instanceof Number ? ((Number) vocabIdObj).longValue() : Long.parseLong(vocabIdObj.toString());
        exerciseService.saveWordFromExercise(userId, vocabularyId);
        vocabularyService.saveWord(userId, vocabularyId);
        return ResponseEntity.ok(ApiResponse.ok("Word saved", null));
    }

    @GetMapping("/results")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getMyResults(HttpServletRequest request) {
        Long userId = jwtService.extractUserId(request);
        if (userId == null) return ResponseEntity.status(401).body(ApiResponse.error("Authentication required"));
        var results = exerciseService.getUserResults(userId);
        List<Map<String, Object>> resultList = results.stream().map(r -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", r.getId());
            m.put("exerciseId", r.getLessonId());
            m.put("score", r.getScore());
            m.put("totalQuestions", r.getTotalQuestions());
            m.put("correctAnswers", r.getCorrectAnswers());
            m.put("completedAt", r.getCompletedAt());
            m.put("quizType", r.getQuizType());
            return m;
        }).toList();
        return ResponseEntity.ok(ApiResponse.ok(resultList));
    }
}
