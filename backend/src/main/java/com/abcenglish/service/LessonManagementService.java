package com.abcenglish.service;

import com.abcenglish.dto.LessonManagementDTO;
import com.abcenglish.dto.LessonManagementDTO.CompletionSettingsDTO;
import com.abcenglish.dto.LessonManagementDTO.CourseDetailDTO;
import com.abcenglish.dto.LessonManagementDTO.CourseProgressDTO;
import com.abcenglish.dto.LessonManagementDTO.CreateExerciseRequest;
import com.abcenglish.dto.LessonManagementDTO.CreateLessonRequest;
import com.abcenglish.dto.LessonManagementDTO.CreateMiniTestRequest;
import com.abcenglish.dto.LessonManagementDTO.CreateCourseRequest;
import com.abcenglish.dto.LessonManagementDTO.KeyPointDTO;
import com.abcenglish.dto.LessonManagementDTO.LessonContentDTO;
import com.abcenglish.dto.LessonManagementDTO.LessonDetailDTO;
import com.abcenglish.dto.LessonManagementDTO.LessonListDTO;
import com.abcenglish.dto.LessonManagementDTO.LessonVocabularyDTO;
import com.abcenglish.dto.LessonManagementDTO.MiniTestDTO;
import com.abcenglish.dto.LessonManagementDTO.MiniTestQuestionDTO;
import com.abcenglish.dto.LessonManagementDTO.MiniTestQuestionRequest;
import com.abcenglish.dto.LessonManagementDTO.MiniTestResultDTO;
import com.abcenglish.dto.LessonManagementDTO.MiniTestSubmitRequest;
import com.abcenglish.dto.LessonManagementDTO.QuestionRequest;
import com.abcenglish.dto.LessonManagementDTO.QuestionResultDTO;
import com.abcenglish.dto.LessonManagementDTO.SaveCompletionSettingsRequest;
import com.abcenglish.dto.LessonManagementDTO.SaveContentRequest;
import com.abcenglish.dto.LessonManagementDTO.SaveSubtitleRequest;
import com.abcenglish.dto.LessonManagementDTO.SubtitleDTO;
import com.abcenglish.dto.LessonManagementDTO.UpdateLessonRequest;
import com.abcenglish.entity.*;
import com.abcenglish.repository.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class LessonManagementService {

    private final LessonRepository lessonRepository;
    private final LessonContentRepository lessonContentRepository;
    private final LessonVocabularyRepository lessonVocabularyRepository;
    private final VideoSubtitleRepository subtitleRepository;
    private final MiniTestRepository miniTestRepository;
    private final MiniTestQuestionRepository miniTestQuestionRepository;
    private final MiniTestResultRepository miniTestResultRepository;
    private final LessonCompletionSettingsRepository completionSettingsRepository;
    private final ExerciseRepository exerciseRepository;
    private final ExerciseQuestionRepository questionRepository;
    private final LessonProgressRepository progressRepository;
    private final CourseRepository courseRepository;
    private final ObjectMapper objectMapper;

    public LessonManagementService(
            LessonRepository lessonRepository,
            LessonContentRepository lessonContentRepository,
            LessonVocabularyRepository lessonVocabularyRepository,
            VideoSubtitleRepository subtitleRepository,
            MiniTestRepository miniTestRepository,
            MiniTestQuestionRepository miniTestQuestionRepository,
            MiniTestResultRepository miniTestResultRepository,
            LessonCompletionSettingsRepository completionSettingsRepository,
            ExerciseRepository exerciseRepository,
            ExerciseQuestionRepository questionRepository,
            LessonProgressRepository progressRepository,
            CourseRepository courseRepository) {
        this.lessonRepository = lessonRepository;
        this.lessonContentRepository = lessonContentRepository;
        this.lessonVocabularyRepository = lessonVocabularyRepository;
        this.subtitleRepository = subtitleRepository;
        this.miniTestRepository = miniTestRepository;
        this.miniTestQuestionRepository = miniTestQuestionRepository;
        this.miniTestResultRepository = miniTestResultRepository;
        this.completionSettingsRepository = completionSettingsRepository;
        this.exerciseRepository = exerciseRepository;
        this.questionRepository = questionRepository;
        this.progressRepository = progressRepository;
        this.courseRepository = courseRepository;
        this.objectMapper = new ObjectMapper();
    }

    // ===================== LESSON CRUD =====================

    public LessonDetailDTO createLesson(CreateLessonRequest req) {
        Lesson lesson = new Lesson();
        lesson.setTitle(req.title());
        lesson.setContent(req.content());
        lesson.setVideoUrl(req.videoUrl());
        lesson.setOrderIndex(req.orderIndex());
        lesson.setDurationMinutes(req.durationMinutes());
        lesson.setCourseId(req.courseId());
        if (req.level() != null) {
            lesson.setLevel(User.Level.valueOf(req.level().toUpperCase()));
        }
        lesson.setActive(true);
        Lesson saved = lessonRepository.save(lesson);

        // Create empty content
        LessonContent content = new LessonContent();
        content.setLessonId(saved.getId());
        lessonContentRepository.save(content);

        // Create default completion settings
        LessonCompletionSettings settings = new LessonCompletionSettings();
        settings.setLessonId(saved.getId());
        completionSettingsRepository.save(settings);

        String courseTitle = courseRepository.findById(req.courseId())
                .map(c -> c.getTitle()).orElse(null);
        return LessonManagementDTO.fromLesson(saved, courseTitle);
    }

    public LessonDetailDTO updateLesson(Long id, UpdateLessonRequest req) {
        Lesson lesson = lessonRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Lesson not found"));
        if (req.title() != null) lesson.setTitle(req.title());
        if (req.content() != null) lesson.setContent(req.content());
        if (req.videoUrl() != null) lesson.setVideoUrl(req.videoUrl());
        if (req.orderIndex() >= 0) lesson.setOrderIndex(req.orderIndex());
        if (req.durationMinutes() > 0) lesson.setDurationMinutes(req.durationMinutes());
        if (req.level() != null) lesson.setLevel(User.Level.valueOf(req.level().toUpperCase()));
        lesson.setActive(req.active());
        Lesson saved = lessonRepository.save(lesson);
        String courseTitle = courseRepository.findById(saved.getCourseId())
                .map(c -> c.getTitle()).orElse(null);
        return LessonManagementDTO.fromLesson(saved, courseTitle);
    }

    public void deleteLesson(Long id) {
        lessonRepository.deleteById(id);
        lessonContentRepository.deleteByLessonId(id);
        lessonVocabularyRepository.deleteByLessonId(id);
        subtitleRepository.deleteByLessonId(id);
        miniTestRepository.findByLessonId(id).ifPresent(t -> {
            miniTestQuestionRepository.deleteByTestId(t.getId());
            miniTestRepository.delete(t);
        });
        completionSettingsRepository.findByLessonId(id).ifPresent(completionSettingsRepository::delete);
    }

    public List<LessonDetailDTO> getLessonsByCourse(Long courseId) {
        List<Lesson> lessons = lessonRepository.findByCourseIdOrderByOrderIndex(courseId);
        String courseTitle = courseRepository.findById(courseId)
                .map(c -> c.getTitle()).orElse(null);
        return lessons.stream()
                .map(l -> LessonManagementDTO.fromLesson(l, courseTitle))
                .collect(Collectors.toList());
    }

    public LessonDetailDTO getLessonById(Long id) {
        Lesson lesson = lessonRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Lesson not found"));
        String courseTitle = courseRepository.findById(lesson.getCourseId())
                .map(c -> c.getTitle()).orElse(null);
        return LessonManagementDTO.fromLesson(lesson, courseTitle);
    }

    // ===================== LESSON CONTENT =====================

    public LessonContentDTO getLessonContent(Long lessonId) {
        LessonContent content = lessonContentRepository.findByLessonId(lessonId)
                .orElse(null);
        if (content == null) {
            content = new LessonContent();
            content.setLessonId(lessonId);
            content = lessonContentRepository.save(content);
        }

        List<VideoSubtitle> subtitles = subtitleRepository.findByLessonIdOrderByOrderIndex(lessonId);
        String subtitlesJson = subtitles.isEmpty() ? null :
                subtitles.stream().map(s -> Map.of(
                        "id", s.getId(),
                        "language", s.getLanguage(),
                        "content", s.getContent(),
                        "startTime", s.getStartTime(),
                        "endTime", s.getEndTime(),
                        "orderIndex", s.getOrderIndex()
                )).toList().toString();

        return new LessonContentDTO(
                content.getId(),
                lessonId,
                content.getTextContent(),
                content.getGrammarRules(),
                content.getVocabulary(),
                content.getKeyPoints(),
                content.getAudioUrl(),
                content.getImageUrl(),
                subtitlesJson
        );
    }

    public LessonContentDTO saveLessonContent(Long lessonId, SaveContentRequest req) {
        LessonContent content = lessonContentRepository.findByLessonId(lessonId)
                .orElseGet(() -> {
                    LessonContent c = new LessonContent();
                    c.setLessonId(lessonId);
                    return c;
                });
        if (req.textContent() != null) content.setTextContent(req.textContent());
        if (req.grammarRules() != null) content.setGrammarRules(req.grammarRules());
        if (req.vocabulary() != null) content.setVocabulary(req.vocabulary());
        if (req.keyPoints() != null) content.setKeyPoints(req.keyPoints());
        if (req.audioUrl() != null) content.setAudioUrl(req.audioUrl());
        if (req.imageUrl() != null) content.setImageUrl(req.imageUrl());
        LessonContent saved = lessonContentRepository.save(content);

        // Save subtitles if provided
        if (req.videoSubtitles() != null && !req.videoSubtitles().isBlank()) {
            subtitleRepository.deleteByLessonId(lessonId);
            try {
                List<Map<String, Object>> subs = objectMapper.readValue(
                        req.videoSubtitles(), List.class);
                int idx = 0;
                for (Map<String, Object> s : subs) {
                    VideoSubtitle sub = new VideoSubtitle();
                    sub.setLessonId(lessonId);
                    sub.setLanguage(s.get("language") != null ? s.get("language").toString() : "en");
                    sub.setContent(s.get("content") != null ? s.get("content").toString() : "");
                    sub.setStartTime(s.get("startTime") != null ? ((Number) s.get("startTime")).intValue() : 0);
                    sub.setEndTime(s.get("endTime") != null ? ((Number) s.get("endTime")).intValue() : 0);
                    sub.setOrderIndex(idx++);
                    subtitleRepository.save(sub);
                }
            } catch (Exception ignored) {}
        }

        return new LessonContentDTO(
                saved.getId(), lessonId,
                saved.getTextContent(), saved.getGrammarRules(),
                saved.getVocabulary(), saved.getKeyPoints(),
                saved.getAudioUrl(), saved.getImageUrl(),
                req.videoSubtitles()
        );
    }

    // ===================== SUBTITLES =====================

    public List<SubtitleDTO> getSubtitles(Long lessonId) {
        return subtitleRepository.findByLessonIdOrderByOrderIndex(lessonId).stream()
                .map(s -> new SubtitleDTO(s.getId(), s.getLessonId(), s.getLanguage(),
                        s.getContent(), s.getStartTime(), s.getEndTime()))
                .collect(Collectors.toList());
    }

    public List<SubtitleDTO> getSubtitlesByLanguage(Long lessonId, String language) {
        return subtitleRepository.findByLessonIdAndLanguageOrderByOrderIndex(lessonId, language).stream()
                .map(s -> new SubtitleDTO(s.getId(), s.getLessonId(), s.getLanguage(),
                        s.getContent(), s.getStartTime(), s.getEndTime()))
                .collect(Collectors.toList());
    }

    @Transactional
    public List<SubtitleDTO> saveSubtitles(Long lessonId, List<SaveSubtitleRequest> subtitles) {
        subtitleRepository.deleteByLessonId(lessonId);
        List<SubtitleDTO> saved = new ArrayList<>();
        int idx = 0;
        for (SaveSubtitleRequest req : subtitles) {
            VideoSubtitle sub = new VideoSubtitle();
            sub.setLessonId(lessonId);
            sub.setLanguage(req.language() != null ? req.language() : "en");
            sub.setContent(req.content());
            sub.setStartTime(req.startTime());
            sub.setEndTime(req.endTime());
            sub.setOrderIndex(idx++);
            VideoSubtitle result = subtitleRepository.save(sub);
            saved.add(new SubtitleDTO(result.getId(), lessonId, result.getLanguage(),
                    result.getContent(), result.getStartTime(), result.getEndTime()));
        }
        return saved;
    }

    // ===================== VOCABULARY =====================

    public List<LessonVocabularyDTO> getVocabulary(Long lessonId) {
        return lessonVocabularyRepository.findByLessonIdOrderByOrderIndex(lessonId).stream()
                .map(v -> new LessonVocabularyDTO(v.getId(), v.getLessonId(), v.getWord(),
                        v.getPronunciation(), v.getTranslation(), v.getDefinition(),
                        v.getExample(), v.getAudioUrl()))
                .collect(Collectors.toList());
    }

    @Transactional
    public List<LessonVocabularyDTO> saveVocabulary(Long lessonId, List<Map<String, Object>> words) {
        lessonVocabularyRepository.deleteByLessonId(lessonId);
        List<LessonVocabularyDTO> saved = new ArrayList<>();
        int idx = 0;
        for (Map<String, Object> w : words) {
            LessonVocabulary v = new LessonVocabulary();
            v.setLessonId(lessonId);
            v.setWord(w.get("word") != null ? w.get("word").toString() : "");
            v.setPronunciation(w.get("pronunciation") != null ? w.get("pronunciation").toString() : null);
            v.setTranslation(w.get("translation") != null ? w.get("translation").toString() : null);
            v.setDefinition(w.get("definition") != null ? w.get("definition").toString() : null);
            v.setExample(w.get("example") != null ? w.get("example").toString() : null);
            v.setAudioUrl(w.get("audioUrl") != null ? w.get("audioUrl").toString() : null);
            v.setOrderIndex(idx++);
            LessonVocabulary result = lessonVocabularyRepository.save(v);
            saved.add(new LessonVocabularyDTO(result.getId(), lessonId, result.getWord(),
                    result.getPronunciation(), result.getTranslation(), result.getDefinition(),
                    result.getExample(), result.getAudioUrl()));
        }
        return saved;
    }

    // ===================== MINI TEST =====================

    public MiniTestDTO getMiniTest(Long lessonId, Long userId) {
        MiniTest test = miniTestRepository.findByLessonIdAndActiveTrue(lessonId).orElse(null);
        if (test == null) return null;

        List<MiniTestQuestion> questions = miniTestQuestionRepository.findByTestIdOrderByOrderIndexAsc(test.getId());
        List<MiniTestQuestionDTO> questionDTOs = questions.stream().map(q -> {
            List<String> opts = parseOptions(q.getOptions());
            return new MiniTestQuestionDTO(q.getId(), q.getQuestion(), q.getType().name(),
                    q.getContent(), opts, q.getOrderIndex(), q.getPoints(), q.getExplanation());
        }).collect(Collectors.toList());

        var lastResult = miniTestResultRepository.findTopByLessonIdAndUserIdOrderByScoreDesc(lessonId, userId)
                .orElse(null);

        return new MiniTestDTO(
                test.getId(), lessonId, test.getTitle(), test.getDescription(),
                test.getDurationMinutes(), test.getPassingScore(), test.getMaxScore(),
                questions.size(), questionDTOs,
                lastResult != null,
                lastResult != null ? (double) lastResult.getScore() : null
        );
    }

    public MiniTest createMiniTest(CreateMiniTestRequest req) {
        MiniTest test = new MiniTest();
        test.setLessonId(req.lessonId());
        test.setTitle(req.title());
        test.setDescription(req.description());
        test.setDurationMinutes(req.durationMinutes());
        test.setPassingScore(req.passingScore());
        test.setActive(true);
        MiniTest saved = miniTestRepository.save(test);

        int idx = 0;
        int totalPoints = 0;
        for (MiniTestQuestionRequest qr : req.questions()) {
            MiniTestQuestion q = new MiniTestQuestion();
            q.setTestId(saved.getId());
            q.setQuestion(qr.question());
            q.setType(MiniTestQuestion.QuestionType.valueOf(
                    qr.type() != null ? qr.type().toUpperCase() : "MULTIPLE_CHOICE"));
            q.setContent(qr.content());
            if (qr.options() != null) {
                try { q.setOptions(objectMapper.writeValueAsString(qr.options())); } catch (Exception ignored) {}
            }
            q.setCorrectAnswer(qr.correctAnswer());
            q.setExplanation(qr.explanation());
            q.setPoints(qr.points() > 0 ? qr.points() : 10);
            q.setOrderIndex(idx++);
            totalPoints += q.getPoints();
            miniTestQuestionRepository.save(q);
        }
        saved.setMaxScore(totalPoints);
        return miniTestRepository.save(saved);
    }

    public MiniTest updateMiniTest(Long testId, CreateMiniTestRequest req) {
        MiniTest test = miniTestRepository.findById(testId)
                .orElseThrow(() -> new RuntimeException("Test not found"));
        test.setTitle(req.title());
        test.setDescription(req.description());
        test.setDurationMinutes(req.durationMinutes());
        test.setPassingScore(req.passingScore());
        MiniTest saved = miniTestRepository.save(test);

        miniTestQuestionRepository.deleteByTestId(testId);
        int idx = 0;
        int totalPoints = 0;
        for (MiniTestQuestionRequest qr : req.questions()) {
            MiniTestQuestion q = new MiniTestQuestion();
            q.setTestId(testId);
            q.setQuestion(qr.question());
            q.setType(MiniTestQuestion.QuestionType.valueOf(
                    qr.type() != null ? qr.type().toUpperCase() : "MULTIPLE_CHOICE"));
            q.setContent(qr.content());
            if (qr.options() != null) {
                try { q.setOptions(objectMapper.writeValueAsString(qr.options())); } catch (Exception ignored) {}
            }
            q.setCorrectAnswer(qr.correctAnswer());
            q.setExplanation(qr.explanation());
            q.setPoints(qr.points() > 0 ? qr.points() : 10);
            q.setOrderIndex(idx++);
            totalPoints += q.getPoints();
            miniTestQuestionRepository.save(q);
        }
        saved.setMaxScore(totalPoints);
        return miniTestRepository.save(saved);
    }

    public MiniTestResultDTO submitMiniTest(Long lessonId, Long userId, MiniTestSubmitRequest req) {
        MiniTest test = miniTestRepository.findByLessonIdAndActiveTrue(lessonId)
                .orElseThrow(() -> new RuntimeException("Mini test not found"));
        List<MiniTestQuestion> questions = miniTestQuestionRepository.findByTestIdOrderByOrderIndexAsc(test.getId());

        int correct = 0;
        int totalEarned = 0;
        int totalPossible = 0;
        List<QuestionResultDTO> qResults = new ArrayList<>();

        for (MiniTestQuestion q : questions) {
            totalPossible += q.getPoints();
            Object userAnswer = req.answers() != null ? req.answers().get(q.getId()) : null;
            String userAnswerStr = userAnswer != null ? userAnswer.toString() : "";
            boolean isCorrect = checkAnswer(q, userAnswerStr);
            int earned = isCorrect ? q.getPoints() : 0;
            if (isCorrect) correct++;
            totalEarned += earned;

            qResults.add(new QuestionResultDTO(
                    q.getId(), q.getQuestion(), userAnswerStr,
                    q.getCorrectAnswer(), isCorrect, q.getPoints(), earned, q.getExplanation()
            ));
        }

        int score = totalPossible > 0 ? (int) Math.round((double) totalEarned / totalPossible * 100) : 0;
        boolean passed = score >= test.getPassingScore();

        MiniTestResult result = new MiniTestResult();
        result.setUserId(userId);
        result.setLessonId(lessonId);
        result.setTestId(test.getId());
        result.setTestTitle(test.getTitle());
        result.setTotalQuestions(questions.size());
        result.setCorrectAnswers(correct);
        result.setScore(score);
        result.setPercentage(score + "%");
        result.setPassed(passed);
        result.setTimeSpentSeconds(req.timeSpentSeconds());
        try { result.setQuestionResults(objectMapper.writeValueAsString(qResults)); } catch (Exception ignored) {}
        miniTestResultRepository.save(result);

        return new MiniTestResultDTO(
                result.getId(), lessonId, test.getId(), test.getTitle(),
                questions.size(), correct, score, score + "%", passed,
                req.timeSpentSeconds(),
                result.getCompletedAt() != null ? result.getCompletedAt().toString() : null,
                qResults, null
        );
    }

    private boolean checkAnswer(MiniTestQuestion q, String userAnswer) {
        if (q.getCorrectAnswer() == null || userAnswer == null) return false;
        String correct = q.getCorrectAnswer().trim().toLowerCase();
        String given = userAnswer.trim().toLowerCase();
        if (q.getType() == MiniTestQuestion.QuestionType.DRAG_DROP ||
                q.getType() == MiniTestQuestion.QuestionType.MULTIPLE_CHOICE) {
            return correct.equals(given);
        }
        return correct.equals(given);
    }

    // ===================== COMPLETION SETTINGS =====================

    public CompletionSettingsDTO getCompletionSettings(Long lessonId) {
        LessonCompletionSettings settings = completionSettingsRepository.findByLessonId(lessonId)
                .orElseGet(() -> {
                    LessonCompletionSettings s = new LessonCompletionSettings();
                    s.setLessonId(lessonId);
                    return completionSettingsRepository.save(s);
                });
        return new CompletionSettingsDTO(
                lessonId,
                settings.isRequireContentView(),
                settings.isRequireExercises(),
                settings.isRequireMiniTest(),
                settings.getMinTestScore(),
                settings.getMinExerciseScore(),
                settings.isAutoUnlockNext(),
                settings.getCompletionMessage(),
                settings.getCertificateTemplate()
        );
    }

    public CompletionSettingsDTO saveCompletionSettings(Long lessonId, SaveCompletionSettingsRequest req) {
        LessonCompletionSettings settings = completionSettingsRepository.findByLessonId(lessonId)
                .orElseGet(() -> {
                    LessonCompletionSettings s = new LessonCompletionSettings();
                    s.setLessonId(lessonId);
                    return s;
                });
        settings.setRequireContentView(req.requireContentView());
        settings.setRequireExercises(req.requireExercises());
        settings.setRequireMiniTest(req.requireMiniTest());
        settings.setMinTestScore(req.minTestScore());
        settings.setMinExerciseScore(req.minExerciseScore());
        settings.setAutoUnlockNext(req.autoUnlockNext());
        settings.setCompletionMessage(req.completionMessage());
        settings.setCertificateTemplate(req.certificateTemplate());
        LessonCompletionSettings saved = completionSettingsRepository.save(settings);
        return new CompletionSettingsDTO(
                lessonId,
                saved.isRequireContentView(),
                saved.isRequireExercises(),
                saved.isRequireMiniTest(),
                saved.getMinTestScore(),
                saved.getMinExerciseScore(),
                saved.isAutoUnlockNext(),
                saved.getCompletionMessage(),
                saved.getCertificateTemplate()
        );
    }

    // ===================== EXERCISES =====================

    public Map<String, Object> getExerciseById(Long id) {
        Exercise exercise = exerciseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Exercise not found"));
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
        result.put("content", exercise.getContent());

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
            if (q.getType() == ExerciseQuestion.QuestionType.MATCHING ||
                    q.getType() == ExerciseQuestion.QuestionType.DRAG_DROP) {
                m.put("correctAnswer", q.getCorrectAnswer());
            }
            return m;
        }).toList();
        result.put("questions", questionList);
        result.put("questionCount", questionList.size());
        return result;
    }

    public Exercise createExercise(CreateExerciseRequest req, Long userId) {
        Exercise exercise = new Exercise();
        exercise.setTitle(req.title());
        exercise.setDescription(req.description());
        exercise.setContent(req.content());
        exercise.setInstructions(req.instructions());
        exercise.setTopic(req.topic());
        exercise.setCategory(req.category());
        exercise.setType(Exercise.ExerciseType.valueOf(req.type().toUpperCase()));
        exercise.setLevel(User.Level.valueOf(req.level().toUpperCase()));
        exercise.setDurationMinutes(req.durationMinutes());
        exercise.setMaxScore(req.maxScore());
        exercise.setCreatedBy(userId);
        exercise.setActive(true);
        Exercise saved = exerciseRepository.save(exercise);

        if (req.questions() != null) {
            int idx = 0;
            for (QuestionRequest qr : req.questions()) {
                ExerciseQuestion q = new ExerciseQuestion();
                q.setExerciseId(saved.getId());
                q.setQuestion(qr.question());
                q.setType(ExerciseQuestion.QuestionType.valueOf(
                        qr.type() != null ? qr.type().toUpperCase() : "MULTIPLE_CHOICE"));
                q.setContent(qr.content());
                if (qr.options() != null) {
                    try { q.setOptions(objectMapper.writeValueAsString(qr.options())); } catch (Exception ignored) {}
                }
                q.setCorrectAnswer(qr.correctAnswer());
                q.setExplanation(qr.explanation());
                q.setPoints(qr.points() > 0 ? qr.points() : 1);
                q.setOrderIndex(idx++);
                questionRepository.save(q);
            }
        }
        return saved;
    }

    public void deleteExercise(Long id) {
        exerciseRepository.deleteById(id);
    }

    public List<Map<String, Object>> getExercisesByLesson(Long lessonId) {
        Lesson lesson = lessonRepository.findById(lessonId).orElse(null);
        if (lesson == null) return Collections.emptyList();

        List<Exercise> exercises = exerciseRepository.findByActiveTrue();
        return exercises.stream()
                .filter(e -> {
                    String cat = e.getCategory();
                    if (cat == null) return false;
                    return cat.equals(String.valueOf(lesson.getCourseId())) ||
                            cat.contains("lesson_" + lessonId);
                })
                .map(e -> {
                    Map<String, Object> ex = new LinkedHashMap<>();
                    ex.put("id", e.getId());
                    ex.put("title", e.getTitle());
                    ex.put("type", e.getType() != null ? e.getType().name() : null);
                    ex.put("description", e.getDescription());
                    ex.put("duration", e.getDurationMinutes());
                    ex.put("maxScore", e.getMaxScore());
                    ex.put("instructions", e.getInstructions());
                    ex.put("questionsCount", questionRepository.findByExerciseId(e.getId()).size());
                    return ex;
                })
                .collect(Collectors.toList());
    }

    // ===================== PROGRESS =====================

    public Map<String, Object> getLessonProgress(Long lessonId, Long userId) {
        Lesson lesson = lessonRepository.findById(lessonId).orElse(null);
        if (lesson == null) return Collections.emptyMap();

        LessonProgress progress = progressRepository.findByUserIdAndLessonId(userId, lessonId)
                .orElse(null);
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("lessonId", lessonId);
        result.put("title", lesson.getTitle());
        result.put("courseId", lesson.getCourseId());

        if (progress != null) {
            result.put("contentViewed", progress.isContentViewed());
            result.put("exercisesCompleted", progress.isExercisesCompleted());
            result.put("testCompleted", progress.isTestCompleted());
            result.put("lessonCompleted", progress.isLessonCompleted());
            result.put("contentScore", progress.getContentScore());
            result.put("exerciseScore", progress.getExerciseScore());
            result.put("testScore", progress.getTestScore());
            result.put("totalScore", progress.getTotalScore());
            result.put("timeSpentSeconds", progress.getTimeSpentSeconds());
            result.put("contentViewedAt", progress.getContentViewedAt());
            result.put("exercisesCompletedAt", progress.getExercisesCompletedAt());
            result.put("testCompletedAt", progress.getTestCompletedAt());
            result.put("lessonCompletedAt", progress.getLessonCompletedAt());
        } else {
            result.put("contentViewed", false);
            result.put("exercisesCompleted", false);
            result.put("testCompleted", false);
            result.put("lessonCompleted", false);
            result.put("contentScore", 0);
            result.put("exerciseScore", 0);
            result.put("testScore", 0);
            result.put("totalScore", 0);
            result.put("timeSpentSeconds", 0);
        }

        // Check mini test
        var miniTest = miniTestRepository.findByLessonIdAndActiveTrue(lessonId).orElse(null);
        result.put("hasMiniTest", miniTest != null);
        if (miniTest != null) {
            var lastResult = miniTestResultRepository.findTopByLessonIdAndUserIdOrderByScoreDesc(lessonId, userId)
                    .orElse(null);
            result.put("miniTestPassed", lastResult != null && lastResult.isPassed());
            result.put("miniTestScore", lastResult != null ? lastResult.getScore() : null);
        }

        // Check completion settings
        var settings = completionSettingsRepository.findByLessonId(lessonId).orElse(null);
        if (settings != null) {
            result.put("completionSettings", Map.of(
                    "requireContentView", settings.isRequireContentView(),
                    "requireExercises", settings.isRequireExercises(),
                    "requireMiniTest", settings.isRequireMiniTest(),
                    "minTestScore", settings.getMinTestScore(),
                    "minExerciseScore", settings.getMinExerciseScore(),
                    "autoUnlockNext", settings.isAutoUnlockNext(),
                    "completionMessage", settings.getCompletionMessage() != null ? settings.getCompletionMessage() : ""
            ));
        }

        return result;
    }

    // ===================== UTILITY =====================

    private List<String> parseOptions(String options) {
        if (options == null || options.isBlank()) return null;
        try {
            Object parsed = objectMapper.readValue(options, Object.class);
            if (parsed instanceof List) {
                return ((List<?>) parsed).stream().map(Object::toString).collect(Collectors.toList());
            }
            return List.of(options);
        } catch (Exception e) {
            return null;
        }
    }
}
