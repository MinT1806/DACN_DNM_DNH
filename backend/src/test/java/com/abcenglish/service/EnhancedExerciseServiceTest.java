package com.abcenglish.service;

import com.abcenglish.entity.*;
import com.abcenglish.repository.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for EnhancedExerciseService.
 * Tests exercise submission, AI grading, and vocabulary suggestion.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class EnhancedExerciseServiceTest {

    @Mock private ExerciseRepository exerciseRepository;
    @Mock private ExerciseQuestionRepository questionRepository;
    @Mock private QuizResultRepository quizResultRepository;
    @Mock private UserProgressRepository progressRepository;
    @Mock private ExerciseSubmissionRepository submissionRepository;
    @Mock private VocabularyRepository vocabularyRepository;
    @Mock private SavedWordRepository savedWordRepository;
    @Mock private AIService aiService;

    private EnhancedExerciseService exerciseService;
    private ObjectMapper objectMapper;

    private Exercise testExercise;
    private ExerciseQuestion mcQuestion;
    private ExerciseQuestion essayQuestion;

    @BeforeEach
    void setUp() {
        exerciseService = new EnhancedExerciseService(
            exerciseRepository, questionRepository, quizResultRepository,
            progressRepository, submissionRepository, vocabularyRepository,
            savedWordRepository, aiService
        );
        objectMapper = new ObjectMapper();

        testExercise = new Exercise();
        testExercise.setId(1L);
        testExercise.setTitle("Test Vocab Quiz");
        testExercise.setType(Exercise.ExerciseType.VOCAB_QUIZ);
        testExercise.setLevel(User.Level.A1);
        testExercise.setCategory("1");
        testExercise.setActive(true);

        mcQuestion = new ExerciseQuestion();
        mcQuestion.setId(1L);
        mcQuestion.setExerciseId(1L);
        mcQuestion.setQuestion("What does 'Hello' mean?");
        mcQuestion.setType(ExerciseQuestion.QuestionType.MULTIPLE_CHOICE);
        mcQuestion.setOptions("[\"Xin chào\",\"Tạm biệt\",\"Cảm ơn\",\"Xin lỗi\"]");
        mcQuestion.setCorrectAnswer("0");
        mcQuestion.setExplanation("Hello means Xin chào");
        mcQuestion.setOrderIndex(0);

        essayQuestion = new ExerciseQuestion();
        essayQuestion.setId(2L);
        essayQuestion.setExerciseId(1L);
        essayQuestion.setQuestion("Write a sentence using 'Hello'");
        essayQuestion.setType(ExerciseQuestion.QuestionType.ESSAY);
        essayQuestion.setCorrectAnswer("Hello, how are you?");
        essayQuestion.setOrderIndex(1);
    }

    // ─── Submit Exercise - Multiple Choice Tests ────────────────────────────

    @Test
    void submitExercise_correctMCAnswer_shouldScoreCorrectly() {
        when(exerciseRepository.findById(1L)).thenReturn(Optional.of(testExercise));
        when(questionRepository.findByExerciseIdOrderByOrderIndexAsc(1L))
            .thenReturn(List.of(mcQuestion));
        when(quizResultRepository.save(any(QuizResult.class))).thenAnswer(inv -> {
            QuizResult r = inv.getArgument(0);
            r.setId(1L);
            return r;
        });
        when(progressRepository.save(any(UserProgress.class))).thenReturn(new UserProgress());
        when(submissionRepository.save(any(ExerciseSubmission.class))).thenReturn(new ExerciseSubmission());

        java.util.Map<String, Object> answers = new java.util.LinkedHashMap<>();
        answers.put("q_1", "0"); // Correct answer

        var result = exerciseService.submitExercise(1L, answers, 1L);

        assertNotNull(result);
        assertEquals(1L, result.get("exerciseId"));
        assertEquals(1, result.get("totalQuestions"));
        assertEquals(1, result.get("correctAnswers"));
        assertTrue((Boolean) result.get("completed")); // 100% >= 5.0
    }

    @Test
    void submitExercise_wrongMCAnswer_shouldScoreZero() {
        when(exerciseRepository.findById(1L)).thenReturn(Optional.of(testExercise));
        when(questionRepository.findByExerciseIdOrderByOrderIndexAsc(1L))
            .thenReturn(List.of(mcQuestion));
        when(quizResultRepository.save(any(QuizResult.class))).thenAnswer(inv -> {
            QuizResult r = inv.getArgument(0);
            r.setId(1L);
            return r;
        });
        when(progressRepository.save(any(UserProgress.class))).thenReturn(new UserProgress());
        when(submissionRepository.save(any(ExerciseSubmission.class))).thenReturn(new ExerciseSubmission());

        java.util.Map<String, Object> answers = new java.util.LinkedHashMap<>();
        answers.put("q_1", "1"); // Wrong answer

        var result = exerciseService.submitExercise(1L, answers, 1L);

        assertEquals(1, result.get("totalQuestions"));
        assertEquals(0, result.get("correctAnswers"));
        assertFalse((Boolean) result.get("completed")); // 0% < 5.0
    }

    @Test
    void submitExercise_noAnswer_shouldTreatAsWrong() {
        when(exerciseRepository.findById(1L)).thenReturn(Optional.of(testExercise));
        when(questionRepository.findByExerciseIdOrderByOrderIndexAsc(1L))
            .thenReturn(List.of(mcQuestion));
        when(quizResultRepository.save(any(QuizResult.class))).thenAnswer(inv -> {
            QuizResult r = inv.getArgument(0);
            r.setId(1L);
            return r;
        });
        when(progressRepository.save(any(UserProgress.class))).thenReturn(new UserProgress());
        when(submissionRepository.save(any(ExerciseSubmission.class))).thenReturn(new ExerciseSubmission());

        java.util.Map<String, Object> answers = new java.util.LinkedHashMap<>();
        // No answer for q_1

        var result = exerciseService.submitExercise(1L, answers, 1L);

        assertEquals(0, result.get("correctAnswers"));
    }

    @Test
    void submitExercise_nonexistentExercise_shouldThrow() {
        when(exerciseRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () ->
            exerciseService.submitExercise(999L, new java.util.LinkedHashMap<>(), 1L)
        );
    }

    // ─── Submit Exercise - Mixed Question Types ───────────────────────────────

    @Test
    void submitExercise_multipleQuestions_shouldCalculateCorrectScore() {
        when(exerciseRepository.findById(1L)).thenReturn(Optional.of(testExercise));
        when(questionRepository.findByExerciseIdOrderByOrderIndexAsc(1L))
            .thenReturn(List.of(mcQuestion, mcQuestion)); // 2 identical MC questions
        when(quizResultRepository.save(any(QuizResult.class))).thenAnswer(inv -> {
            QuizResult r = inv.getArgument(0);
            r.setId(1L);
            return r;
        });
        when(progressRepository.save(any(UserProgress.class))).thenReturn(new UserProgress());
        when(submissionRepository.save(any(ExerciseSubmission.class))).thenReturn(new ExerciseSubmission());

        java.util.Map<String, Object> answers = new java.util.LinkedHashMap<>();
        answers.put("q_1", "0"); // Correct answer for q_1
        answers.put("q_2", "0"); // Correct answer for q_2

        var result = exerciseService.submitExercise(1L, answers, 1L);

        assertEquals(2, result.get("correctAnswers"));
    }

    // ─── Submit Exercise - XP Calculation ───────────────────────────────────

    @Test
    void submitExercise_fullScore_shouldEarnMaxXp() {
        when(exerciseRepository.findById(1L)).thenReturn(Optional.of(testExercise));
        when(questionRepository.findByExerciseIdOrderByOrderIndexAsc(1L))
            .thenReturn(List.of(mcQuestion, mcQuestion, mcQuestion, mcQuestion, mcQuestion));
        when(quizResultRepository.save(any(QuizResult.class))).thenAnswer(inv -> inv.getArgument(0));
        when(progressRepository.save(any(UserProgress.class))).thenReturn(new UserProgress());
        when(submissionRepository.save(any(ExerciseSubmission.class))).thenReturn(new ExerciseSubmission());

        java.util.Map<String, Object> answers = new java.util.LinkedHashMap<>();
        for (int i = 1; i <= 5; i++) {
            answers.put("q_" + i, "0"); // All correct
        }

        var result = exerciseService.submitExercise(1L, answers, 1L);

        assertEquals(10.0, result.get("score"));
        assertEquals(100, result.get("xpEarned")); // 10 * 10
    }

    @Test
    void submitExercise_halfScore_shouldEarnHalfXp() {
        when(exerciseRepository.findById(1L)).thenReturn(Optional.of(testExercise));

        // Create two questions with different IDs
        ExerciseQuestion q1 = new ExerciseQuestion();
        q1.setId(1L);
        q1.setExerciseId(1L);
        q1.setQuestion("Q1");
        q1.setType(ExerciseQuestion.QuestionType.MULTIPLE_CHOICE);
        q1.setCorrectAnswer("0");
        q1.setOptions("[\"A\",\"B\",\"C\",\"D\"]");
        q1.setOrderIndex(0);

        ExerciseQuestion q2 = new ExerciseQuestion();
        q2.setId(2L);
        q2.setExerciseId(1L);
        q2.setQuestion("Q2");
        q2.setType(ExerciseQuestion.QuestionType.MULTIPLE_CHOICE);
        q2.setCorrectAnswer("1");
        q2.setOptions("[\"A\",\"B\",\"C\",\"D\"]");
        q2.setOrderIndex(1);

        when(questionRepository.findByExerciseIdOrderByOrderIndexAsc(1L))
            .thenReturn(List.of(q1, q2));
        when(quizResultRepository.save(any(QuizResult.class))).thenAnswer(inv -> inv.getArgument(0));
        when(progressRepository.save(any(UserProgress.class))).thenReturn(new UserProgress());
        when(submissionRepository.save(any(ExerciseSubmission.class))).thenReturn(new ExerciseSubmission());

        java.util.Map<String, Object> answers = new java.util.LinkedHashMap<>();
        answers.put("q_1", "0"); // Correct for q1
        answers.put("q_2", "2"); // Wrong for q2 (correct is "1")

        var result = exerciseService.submitExercise(1L, answers, 1L);

        assertEquals(1, result.get("correctAnswers"));
        assertEquals(2, result.get("totalQuestions"));
        assertTrue((Integer) result.get("xpEarned") > 0);
    }

    // ─── AI Grading Tests ──────────────────────────────────────────────────

    @Test
    void gradeWithAI_withEssayQuestion_shouldCallAIService() {
        when(exerciseRepository.findById(1L)).thenReturn(Optional.of(testExercise));
        when(questionRepository.findByExerciseIdOrderByOrderIndexAsc(1L))
            .thenReturn(List.of(essayQuestion));
        when(aiService.chat(anyString(), any())).thenReturn("{\"score\": 8.0, \"feedback\": \"Good!\"}");
        when(quizResultRepository.save(any(QuizResult.class))).thenAnswer(inv -> inv.getArgument(0));
        when(progressRepository.save(any(UserProgress.class))).thenReturn(new UserProgress());
        when(submissionRepository.save(any(ExerciseSubmission.class))).thenReturn(new ExerciseSubmission());

        java.util.Map<String, Object> answers = new java.util.LinkedHashMap<>();
        answers.put("q_2", "Hello world"); // Essay answer
        answers.put("_subjective_answers", true);

        var result = exerciseService.submitExercise(1L, answers, 1L);

        verify(aiService).chat(anyString(), any());
        assertNotNull(result.get("aiGrading"));
    }

    // ─── Submission Persistence Tests ───────────────────────────────────────

    @Test
    void submitExercise_shouldPersistAllSubmissions() {
        when(exerciseRepository.findById(1L)).thenReturn(Optional.of(testExercise));
        when(questionRepository.findByExerciseIdOrderByOrderIndexAsc(1L))
            .thenReturn(List.of(mcQuestion));
        when(quizResultRepository.save(any(QuizResult.class))).thenAnswer(inv -> inv.getArgument(0));
        when(progressRepository.save(any(UserProgress.class))).thenReturn(new UserProgress());
        when(submissionRepository.save(any(ExerciseSubmission.class))).thenReturn(new ExerciseSubmission());

        java.util.Map<String, Object> answers = new java.util.LinkedHashMap<>();
        answers.put("q_1", "0");

        exerciseService.submitExercise(1L, answers, 1L);

        verify(submissionRepository).save(any(ExerciseSubmission.class));
        verify(quizResultRepository).save(any(QuizResult.class));
        verify(progressRepository).save(any(UserProgress.class));
    }

    @Test
    void submitExercise_shouldMarkProgressComplete_whenPassing() {
        when(exerciseRepository.findById(1L)).thenReturn(Optional.of(testExercise));
        when(questionRepository.findByExerciseIdOrderByOrderIndexAsc(1L))
            .thenReturn(List.of(mcQuestion));
        when(quizResultRepository.save(any(QuizResult.class))).thenAnswer(inv -> {
            QuizResult r = inv.getArgument(0);
            r.setScore(10.0);
            return r;
        });
        when(progressRepository.save(any(UserProgress.class))).thenAnswer(inv -> {
            UserProgress p = inv.getArgument(0);
            p.setId(1L);
            return p;
        });
        when(submissionRepository.save(any(ExerciseSubmission.class))).thenReturn(new ExerciseSubmission());

        java.util.Map<String, Object> answers = new java.util.LinkedHashMap<>();
        answers.put("q_1", "0");

        var result = exerciseService.submitExercise(1L, answers, 1L);

        assertTrue((Boolean) result.get("completed"));
    }
}
