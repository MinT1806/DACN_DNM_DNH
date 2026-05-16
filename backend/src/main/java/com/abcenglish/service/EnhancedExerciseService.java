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
public class EnhancedExerciseService {

    private final ExerciseRepository exerciseRepository;
    private final ExerciseQuestionRepository questionRepository;
    private final QuizResultRepository quizResultRepository;
    private final UserProgressRepository progressRepository;
    private final ExerciseSubmissionRepository submissionRepository;
    private final VocabularyRepository vocabularyRepository;
    private final SavedWordRepository savedWordRepository;
    private final AIService aiService;
    private final ObjectMapper objectMapper;

    public EnhancedExerciseService(ExerciseRepository exerciseRepository,
                                   ExerciseQuestionRepository questionRepository,
                                   QuizResultRepository quizResultRepository,
                                   UserProgressRepository progressRepository,
                                   ExerciseSubmissionRepository submissionRepository,
                                   VocabularyRepository vocabularyRepository,
                                   SavedWordRepository savedWordRepository,
                                   AIService aiService) {
        this.exerciseRepository = exerciseRepository;
        this.questionRepository = questionRepository;
        this.quizResultRepository = quizResultRepository;
        this.progressRepository = progressRepository;
        this.submissionRepository = submissionRepository;
        this.vocabularyRepository = vocabularyRepository;
        this.savedWordRepository = savedWordRepository;
        this.aiService = aiService;
        this.objectMapper = new ObjectMapper();
    }

    public Map<String, Object> submitExercise(Long exerciseId, Map<String, Object> answers, Long userId) {
        Exercise exercise = exerciseRepository.findById(exerciseId).orElse(null);
        if (exercise == null) throw new RuntimeException("Exercise not found: " + exerciseId);

        List<ExerciseQuestion> questions = questionRepository.findByExerciseIdOrderByOrderIndexAsc(exerciseId);

        int totalQuestions = questions.size();
        int correctCount = 0;
        List<Map<String, Object>> results = new ArrayList<>();
        List<String> incorrectWords = new ArrayList<>();

        for (ExerciseQuestion question : questions) {
            String answerKey = "q_" + question.getId();
            String userAnswer = answers.get(answerKey) != null ? answers.get(answerKey).toString() : "";
            String correct = question.getCorrectAnswer() != null ? question.getCorrectAnswer().trim() : "";

            boolean isObjective = isObjectiveType(question.getType());
            boolean correct_answer = false;

            if (isObjective) {
                correct_answer = userAnswer.trim().equalsIgnoreCase(correct);
                if (correct_answer) correctCount++;
            }

            // Save submission
            ExerciseSubmission submission = new ExerciseSubmission();
            submission.setUserId(userId);
            submission.setExerciseId(exerciseId);
            submission.setQuestionId(question.getId());
            submission.setUserAnswer(userAnswer);
            submission.setCorrectAnswer(correct);
            submission.setCorrect(correct_answer);
            submission.setQuestionType(question.getType() != null ? question.getType().name() : "UNKNOWN");
            submissionRepository.save(submission);

            // For vocabulary quiz: track incorrect words
            if (!correct_answer && question.getType() == ExerciseQuestion.QuestionType.MULTIPLE_CHOICE) {
                String word = extractWordFromQuestion(question.getQuestion());
                if (word != null) incorrectWords.add(word);
            }

            Map<String, Object> qResult = new LinkedHashMap<>();
            qResult.put("questionId", question.getId());
            qResult.put("question", question.getQuestion());
            qResult.put("userAnswer", userAnswer);
            qResult.put("correctAnswer", correct);
            qResult.put("correct", correct_answer);
            qResult.put("explanation", question.getExplanation());

            if (question.getOptions() != null) {
                try {
                    List<String> opts = objectMapper.readValue(question.getOptions(), new TypeReference<List<String>>() {});
                    qResult.put("options", opts);
                } catch (Exception e) {
                    qResult.put("options", List.of(question.getOptions().split(",")));
                }
            }

            results.add(qResult);
        }

        // Determine if AI grading is needed for subjective questions
        boolean needsAiGrading = answers.containsKey("_subjective_answers") ||
                                  questions.stream().anyMatch(q -> !isObjectiveType(q.getType()));

        Map<String, Object> gradingResult = null;
        if (needsAiGrading) {
            gradingResult = gradeWithAI(exercise, questions, answers);
        }

        double score = totalQuestions > 0 ? (double) correctCount / totalQuestions * 10 : 0;
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
            try { progress.setCourseId(Long.parseLong(exercise.getCategory())); } catch (Exception ignored) {}
        }
        progress.setScore((int) score);
        progress.setCompleted(score >= 5.0);
        if (score >= 5.0) {
            progress.setCompletedAt(LocalDateTime.now());
        }
        progressRepository.save(progress);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("exerciseId", exerciseId);
        response.put("totalQuestions", totalQuestions);
        response.put("correctAnswers", correctCount);
        response.put("score", Math.round(score * 10.0) / 10.0);
        response.put("xpEarned", xpEarned);
        response.put("completed", score >= 5.0);
        response.put("completedAt", LocalDateTime.now().toString());
        response.put("questionResults", results);

        if (gradingResult != null) {
            response.put("aiGrading", gradingResult);
            Double aiScore = (Double) gradingResult.get("score");
            if (aiScore != null) {
                double finalScore = (score + aiScore) / 2;
                response.put("finalScore", Math.round(finalScore * 10.0) / 10.0);
            }
        }

        if (!incorrectWords.isEmpty()) {
            response.put("suggestedVocab", incorrectWords);
            response.put("suggestionMessage", "Bạn đã sai một số từ vựng. Bạn có muốn lưu lại để học không?");
        }

        return response;
    }

    private boolean isObjectiveType(ExerciseQuestion.QuestionType type) {
        return type == ExerciseQuestion.QuestionType.MULTIPLE_CHOICE ||
               type == ExerciseQuestion.QuestionType.FILL_BLANK ||
               type == ExerciseQuestion.QuestionType.MATCHING;
    }

    private Map<String, Object> gradeWithAI(Exercise exercise, List<ExerciseQuestion> questions,
                                             Map<String, Object> answers) {
        List<Map<String, Object>> subjectiveAnswers = new ArrayList<>();

        for (ExerciseQuestion q : questions) {
            if (!isObjectiveType(q.getType())) {
                String userAnswer = answers.get("q_" + q.getId()) != null ?
                        answers.get("q_" + q.getId()).toString() : "";
                subjectiveAnswers.add(Map.of(
                        "question", q.getQuestion(),
                        "userAnswer", userAnswer,
                        "correctAnswer", q.getCorrectAnswer() != null ? q.getCorrectAnswer() : "",
                        "type", q.getType() != null ? q.getType().name() : "UNKNOWN"
                ));
            }
        }

        if (subjectiveAnswers.isEmpty()) return null;

        String prompt = buildGradingPrompt(exercise, subjectiveAnswers);
        String aiResponse = aiService.chat(prompt, null);

        return parseGradingResponse(aiResponse);
    }

    private String buildGradingPrompt(Exercise exercise, List<Map<String, Object>> subjectiveAnswers) {
        StringBuilder prompt = new StringBuilder();
        prompt.append("You are an English teacher grading a student's answers.\n");
        prompt.append("Exercise: ").append(exercise.getTitle()).append("\n");
        prompt.append("Instructions: ").append(exercise.getInstructions() != null ? exercise.getInstructions() : "").append("\n\n");
        prompt.append("Grade each answer from 0 to 10 and provide feedback.\n");
        prompt.append("Return your response as a JSON object with this exact format:\n");
        prompt.append("{\n  \"score\": [average score 0-10],\n  \"feedback\": \"[overall feedback summary]\",\n  \"details\": [\n    {\"question\": \"...\", \"score\": 0-10, \"feedback\": \"...\"}\n  ]\n}\n\n");
        prompt.append("Answers to grade:\n");

        for (int i = 0; i < subjectiveAnswers.size(); i++) {
            Map<String, Object> ans = subjectiveAnswers.get(i);
            prompt.append((i + 1)).append(". Q: ").append(ans.get("question")).append("\n");
            prompt.append("   Student Answer: ").append(ans.get("userAnswer")).append("\n");
            prompt.append("   Type: ").append(ans.get("type")).append("\n\n");
        }
        return prompt.toString();
    }

    private Map<String, Object> parseGradingResponse(String aiResponse) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("score", 7.5);
        result.put("feedback", aiResponse != null ? aiResponse : "No feedback available");
        result.put("details", List.of());

        if (aiResponse == null || aiResponse.isBlank()) {
            return result;
        }

        try {
            String jsonBlock = extractJsonBlock(aiResponse);
            if (jsonBlock != null) {
                Map<String, Object> parsed = objectMapper.readValue(jsonBlock, new TypeReference<Map<String, Object>>() {});

                Object scoreObj = parsed.get("score");
                if (scoreObj != null) {
                    double score;
                    if (scoreObj instanceof Number) {
                        score = ((Number) scoreObj).doubleValue();
                    } else {
                        score = Double.parseDouble(scoreObj.toString());
                    }
                    score = Math.max(0, Math.min(10, score));
                    result.put("score", Math.round(score * 10.0) / 10.0);
                }

                Object feedbackObj = parsed.get("feedback");
                if (feedbackObj != null && !feedbackObj.toString().isBlank()) {
                    result.put("feedback", feedbackObj.toString());
                }

                Object detailsObj = parsed.get("details");
                if (detailsObj instanceof List) {
                    result.put("details", detailsObj);
                }
            }
        } catch (Exception e) {
            result.put("parseError", "Could not parse AI response as JSON: " + e.getMessage());
            result.put("rawResponse", aiResponse);
        }

        return result;
    }

    private String extractJsonBlock(String text) {
        int start = text.indexOf("{");
        int end = text.lastIndexOf("}");
        if (start >= 0 && end > start) {
            return text.substring(start, end + 1);
        }
        return null;
    }

    private String extractWordFromQuestion(String question) {
        if (question == null) return null;
        String[] tokens = question.split("\\s+");
        for (String token : tokens) {
            if (token.length() > 3 && !token.matches(".*\\d+.*")) {
                return token.replaceAll("[^a-zA-Z]", "");
            }
        }
        return null;
    }

    @Transactional
    public List<VocabularyWord> suggestVocabularyFromIncorrect(String word, String level) {
        return vocabularyRepository.findAll().stream()
                .filter(v -> {
                    if (v.getWord() == null) return false;
                    return v.getWord().equalsIgnoreCase(word) ||
                           (level != null && v.getLevel() != null && v.getLevel().name().equalsIgnoreCase(level));
                })
                .limit(5)
                .toList();
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

    public List<QuizResult> getUserResults(Long userId) {
        return quizResultRepository.findByUserIdOrderByCompletedAtDesc(userId);
    }
}
