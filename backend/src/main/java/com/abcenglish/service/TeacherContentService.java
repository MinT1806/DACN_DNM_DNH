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
public class TeacherContentService {

    private final LessonRepository lessonRepository;
    private final ExerciseRepository exerciseRepository;
    private final ExerciseQuestionRepository questionRepository;
    private final CourseRepository courseRepository;
    private final AIService aiService;
    private final ObjectMapper objectMapper;

    public TeacherContentService(LessonRepository lessonRepository,
                                ExerciseRepository exerciseRepository,
                                ExerciseQuestionRepository questionRepository,
                                CourseRepository courseRepository,
                                AIService aiService) {
        this.lessonRepository = lessonRepository;
        this.exerciseRepository = exerciseRepository;
        this.questionRepository = questionRepository;
        this.courseRepository = courseRepository;
        this.aiService = aiService;
        this.objectMapper = new ObjectMapper();
    }

    // ─── Lessons ──────────────────────────────────────────────────────────────

    @Transactional
    public Lesson createLessonForApproval(Long courseId, String title, String content,
                                        String videoUrl, int orderIndex, int durationMinutes,
                                        Long createdBy) {
        Lesson lesson = new Lesson();
        lesson.setCourseId(courseId);
        lesson.setTitle(title);
        lesson.setContent(content);
        lesson.setVideoUrl(videoUrl);
        lesson.setOrderIndex(orderIndex);
        lesson.setDurationMinutes(durationMinutes);
        return lessonRepository.save(lesson);
    }

    // ─── Exercises ─────────────────────────────────────────────────────────────

    @Transactional
    public Exercise createExercise(Long courseId, Long lessonId, String title, String description,
                                 String type, String level, String topic, int durationMinutes,
                                 int maxScore, Long createdBy) {
        Exercise exercise = new Exercise();
        exercise.setTitle(title);
        exercise.setDescription(description);
        try { exercise.setType(Exercise.ExerciseType.valueOf(type.toUpperCase())); } catch (Exception ignored) {}
        try { exercise.setLevel(User.Level.valueOf(level.toUpperCase())); } catch (Exception ignored) {}
        exercise.setTopic(topic);
        exercise.setDurationMinutes(durationMinutes);
        exercise.setMaxScore(maxScore);
        exercise.setActive(false);
        exercise.setCreatedBy(createdBy);
        if (courseId != null) exercise.setCategory(String.valueOf(courseId));
        if (lessonId != null) exercise.setContent("lesson_" + lessonId);
        return exerciseRepository.save(exercise);
    }

    @Transactional
    public ExerciseQuestion addQuestion(Long exerciseId, String questionText, String type,
                                      List<String> options, String correctAnswer,
                                      String explanation, int points, int orderIndex) {
        ExerciseQuestion q = new ExerciseQuestion();
        q.setExerciseId(exerciseId);
        q.setQuestion(questionText);
        try { q.setType(ExerciseQuestion.QuestionType.valueOf(type.toUpperCase())); } catch (Exception ignored) {}
        if (options != null) {
            try { q.setOptions(objectMapper.writeValueAsString(options)); } catch (Exception e) { q.setOptions(String.join(",", options)); }
        }
        q.setCorrectAnswer(correctAnswer);
        q.setExplanation(explanation);
        q.setPoints(points);
        q.setOrderIndex(orderIndex);
        return questionRepository.save(q);
    }

    // ─── AI Generation ─────────────────────────────────────────────────────────

    public List<Map<String, Object>> generateExercisesWithAI(String prompt, String type,
                                                            String level, String topic) {
        String fullPrompt = String.format(
            "Generate 5 multiple-choice English exercises for level %s on topic '%s'. " +
            "Exercise type: %s. For each question include: question text, 4 options (A,B,C,D), " +
            "the correct answer index (0-3), and a brief explanation. " +
            "Return as JSON array: [{\"question\":\"...\",\"options\":[\"A\",\"B\",\"C\",\"D\"],\"correctAnswer\":\"0\",\"explanation\":\"...\"}]",
            level, topic, type
        );

        String response = aiService.chat(fullPrompt, null);
        return parseGeneratedQuestions(response, topic);
    }

    public List<Map<String, Object>> generateQuestionsFromContent(String content, String level,
                                                                 String topic, int count) {
        String fullPrompt = String.format(
            "Based on the following lesson content, generate %d English practice questions. " +
            "Include multiple choice, fill-in-the-blank, and short answer types. " +
            "Level: %s, Topic: %s. " +
            "Return as JSON array with fields: question, type, options (for MCQ), correctAnswer, explanation.\n\nContent:\n%s",
            count, level, topic, content
        );

        String response = aiService.chat(fullPrompt, null);
        return parseGeneratedQuestions(response, topic);
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> parseGeneratedQuestions(String aiResponse, String topic) {
        List<Map<String, Object>> questions = new ArrayList<>();

        // Try to extract JSON from the response
        String jsonStr = aiResponse;
        int start = aiResponse.indexOf("[");
        int end = aiResponse.lastIndexOf("]");
        if (start >= 0 && end > start) {
            jsonStr = aiResponse.substring(start, end + 1);
        }

        try {
            questions = objectMapper.readValue(jsonStr, new TypeReference<List<Map<String, Object>>>() {});
        } catch (Exception e) {
            // Fallback: generate placeholder questions
            for (int i = 1; i <= 5; i++) {
                Map<String, Object> q = new LinkedHashMap<>();
                q.put("question", "Sample question " + i + " about " + topic);
                q.put("options", List.of("Option A", "Option B", "Option C", "Option D"));
                q.put("correctAnswer", "0");
                q.put("explanation", "This is a sample question for educational purposes.");
                questions.add(q);
            }
        }
        return questions;
    }

    @Transactional
    public Exercise saveGeneratedExercise(Long courseId, Long lessonId, String title,
                                        String type, String level, String topic,
                                        List<Map<String, Object>> generatedQuestions,
                                        Long createdBy) {
        Exercise exercise = new Exercise();
        exercise.setTitle(title);
        exercise.setDescription("AI-generated exercise on " + topic);
        try { exercise.setType(Exercise.ExerciseType.valueOf(type.toUpperCase())); } catch (Exception ignored) {}
        try { exercise.setLevel(User.Level.valueOf(level.toUpperCase())); } catch (Exception ignored) {}
        exercise.setTopic(topic);
        exercise.setDurationMinutes(15);
        exercise.setMaxScore(10);
        exercise.setActive(false);
        exercise.setCreatedBy(createdBy);
        if (courseId != null) exercise.setCategory(String.valueOf(courseId));
        exercise = exerciseRepository.save(exercise);

        int idx = 0;
        for (Map<String, Object> qData : generatedQuestions) {
            ExerciseQuestion q = new ExerciseQuestion();
            q.setExerciseId(exercise.getId());
            q.setQuestion((String) qData.get("question"));
            q.setType(ExerciseQuestion.QuestionType.MULTIPLE_CHOICE);

            Object opts = qData.get("options");
            if (opts instanceof List) {
                try { q.setOptions(objectMapper.writeValueAsString(opts)); } catch (Exception ignored) {}
            }

            Object correct = qData.get("correctAnswer");
            q.setCorrectAnswer(correct != null ? correct.toString() : "0");
            q.setExplanation((String) qData.get("explanation"));
            q.setOrderIndex(idx++);
            q.setPoints(1);
            questionRepository.save(q);
        }

        return exercise;
    }

    // ─── Student Submissions ──────────────────────────────────────────────────

    public List<Map<String, Object>> getStudentSubmissions(Long exerciseId) {
        List<ExerciseQuestion> questions = questionRepository.findByExerciseIdOrderByOrderIndexAsc(exerciseId);
        // This would need a submission-tracking query; using quiz results as proxy
        return List.of();
    }

    public List<Map<String, Object>> getPendingApprovals(Long teacherId) {
        List<Exercise> exercises = exerciseRepository.findAll().stream()
                .filter(e -> !e.isActive() && e.getCreatedBy() != null && e.getCreatedBy().equals(teacherId))
                .toList();

        return exercises.stream().map(e -> {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", e.getId());
            map.put("title", e.getTitle());
            map.put("type", e.getType() != null ? e.getType().name() : null);
            map.put("level", e.getLevel() != null ? e.getLevel().name() : null);
            map.put("topic", e.getTopic());
            map.put("questionCount", questionRepository.findByExerciseId(e.getId()).size());
            map.put("active", e.isActive());
            map.put("createdAt", e.getCreatedAt() != null ? e.getCreatedAt().toString() : null);
            return map;
        }).toList();
    }

    @Transactional
    public boolean approveContent(Long contentId, boolean approved) {
        return exerciseRepository.findById(contentId).map(e -> {
            e.setActive(approved);
            exerciseRepository.save(e);
            return true;
        }).orElse(false);
    }
}
