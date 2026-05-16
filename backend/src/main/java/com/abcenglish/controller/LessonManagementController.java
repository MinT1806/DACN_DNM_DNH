package com.abcenglish.controller;

import com.abcenglish.dto.ApiResponse;
import com.abcenglish.dto.LessonManagementDTO.*;
import com.abcenglish.entity.MiniTest;
import com.abcenglish.service.CourseManagementService;
import com.abcenglish.service.JwtService;
import com.abcenglish.service.LessonManagementService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/lesson-management")
@CrossOrigin(origins = "*")
public class LessonManagementController {

    private final LessonManagementService lessonService;
    private final CourseManagementService courseService;
    private final JwtService jwtService;

    public LessonManagementController(
            LessonManagementService lessonService,
            CourseManagementService courseService,
            JwtService jwtService) {
        this.lessonService = lessonService;
        this.courseService = courseService;
        this.jwtService = jwtService;
    }

    // ===================== LESSON CRUD =====================

    @PostMapping("/lessons")
    public ResponseEntity<ApiResponse<LessonDetailDTO>> createLesson(
            @RequestBody CreateLessonRequest req,
            HttpServletRequest request) {
        Long userId = jwtService.extractUserId(request);
        if (userId == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Authentication required"));
        }
        try {
            LessonDetailDTO lesson = lessonService.createLesson(req);
            return ResponseEntity.ok(ApiResponse.ok("Lesson created successfully", lesson));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/lessons/{id}")
    public ResponseEntity<ApiResponse<LessonDetailDTO>> updateLesson(
            @PathVariable Long id,
            @RequestBody UpdateLessonRequest req,
            HttpServletRequest request) {
        Long userId = jwtService.extractUserId(request);
        if (userId == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Authentication required"));
        }
        try {
            LessonDetailDTO lesson = lessonService.updateLesson(id, req);
            return ResponseEntity.ok(ApiResponse.ok("Lesson updated successfully", lesson));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @DeleteMapping("/lessons/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteLesson(
            @PathVariable Long id,
            HttpServletRequest request) {
        Long userId = jwtService.extractUserId(request);
        if (userId == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Authentication required"));
        }
        try {
            lessonService.deleteLesson(id);
            return ResponseEntity.ok(ApiResponse.ok("Lesson deleted successfully", null));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/lessons/course/{courseId}")
    public ResponseEntity<ApiResponse<List<LessonDetailDTO>>> getLessonsByCourse(
            @PathVariable Long courseId) {
        return ResponseEntity.ok(ApiResponse.ok(lessonService.getLessonsByCourse(courseId)));
    }

    @GetMapping("/lessons/{id}")
    public ResponseEntity<ApiResponse<LessonDetailDTO>> getLessonById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(ApiResponse.ok(lessonService.getLessonById(id)));
        } catch (Exception e) {
            return ResponseEntity.status(404).body(ApiResponse.error("Lesson not found"));
        }
    }

    // ===================== LESSON CONTENT =====================

    @GetMapping("/lessons/{id}/content")
    public ResponseEntity<ApiResponse<LessonContentDTO>> getLessonContent(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(lessonService.getLessonContent(id)));
    }

    @PutMapping("/lessons/{id}/content")
    public ResponseEntity<ApiResponse<LessonContentDTO>> saveLessonContent(
            @PathVariable Long id,
            @RequestBody SaveContentRequest req,
            HttpServletRequest request) {
        Long userId = jwtService.extractUserId(request);
        if (userId == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Authentication required"));
        }
        LessonContentDTO content = lessonService.saveLessonContent(id, req);
        return ResponseEntity.ok(ApiResponse.ok("Content saved successfully", content));
    }

    // ===================== SUBTITLES =====================

    @GetMapping("/lessons/{lessonId}/subtitles")
    public ResponseEntity<ApiResponse<List<SubtitleDTO>>> getSubtitles(
            @PathVariable Long lessonId,
            @RequestParam(required = false) String language) {
        List<SubtitleDTO> subtitles;
        if (language != null && !language.isBlank()) {
            subtitles = lessonService.getSubtitlesByLanguage(lessonId, language);
        } else {
            subtitles = lessonService.getSubtitles(lessonId);
        }
        return ResponseEntity.ok(ApiResponse.ok(subtitles));
    }

    @PutMapping("/lessons/{lessonId}/subtitles")
    public ResponseEntity<ApiResponse<List<SubtitleDTO>>> saveSubtitles(
            @PathVariable Long lessonId,
            @RequestBody List<SaveSubtitleRequest> subtitles,
            HttpServletRequest request) {
        Long userId = jwtService.extractUserId(request);
        if (userId == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Authentication required"));
        }
        List<SubtitleDTO> saved = lessonService.saveSubtitles(lessonId, subtitles);
        return ResponseEntity.ok(ApiResponse.ok("Subtitles saved successfully", saved));
    }

    // ===================== VOCABULARY =====================

    @GetMapping("/lessons/{lessonId}/vocabulary")
    public ResponseEntity<ApiResponse<List<LessonVocabularyDTO>>> getVocabulary(
            @PathVariable Long lessonId) {
        return ResponseEntity.ok(ApiResponse.ok(lessonService.getVocabulary(lessonId)));
    }

    @PutMapping("/lessons/{lessonId}/vocabulary")
    public ResponseEntity<ApiResponse<List<LessonVocabularyDTO>>> saveVocabulary(
            @PathVariable Long lessonId,
            @RequestBody List<Map<String, Object>> words,
            HttpServletRequest request) {
        Long userId = jwtService.extractUserId(request);
        if (userId == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Authentication required"));
        }
        List<LessonVocabularyDTO> saved = lessonService.saveVocabulary(lessonId, words);
        return ResponseEntity.ok(ApiResponse.ok("Vocabulary saved successfully", saved));
    }

    // ===================== EXERCISES =====================

    @GetMapping("/lessons/{lessonId}/exercises")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getLessonExercises(
            @PathVariable Long lessonId) {
        return ResponseEntity.ok(ApiResponse.ok(lessonService.getExercisesByLesson(lessonId)));
    }

    @GetMapping("/exercises/{exerciseId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getExerciseDetail(
            @PathVariable Long exerciseId) {
        try {
            return ResponseEntity.ok(ApiResponse.ok(lessonService.getExerciseById(exerciseId)));
        } catch (Exception e) {
            return ResponseEntity.status(404).body(ApiResponse.error("Exercise not found"));
        }
    }

    @PostMapping("/exercises")
    public ResponseEntity<ApiResponse<Map<String, Object>>> createExercise(
            @RequestBody CreateExerciseRequest req,
            HttpServletRequest request) {
        Long userId = jwtService.extractUserId(request);
        if (userId == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Authentication required"));
        }
        try {
            var exercise = lessonService.createExercise(req, userId);
            Map<String, Object> result = Map.of(
                    "id", exercise.getId(),
                    "title", exercise.getTitle(),
                    "message", "Exercise created successfully"
            );
            return ResponseEntity.ok(ApiResponse.ok(result));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @DeleteMapping("/exercises/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteExercise(
            @PathVariable Long id,
            HttpServletRequest request) {
        Long userId = jwtService.extractUserId(request);
        if (userId == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Authentication required"));
        }
        lessonService.deleteExercise(id);
        return ResponseEntity.ok(ApiResponse.ok("Exercise deleted successfully", null));
    }

    // ===================== MINI TEST =====================

    @GetMapping("/lessons/{lessonId}/mini-test")
    public ResponseEntity<ApiResponse<MiniTestDTO>> getMiniTest(
            @PathVariable Long lessonId,
            HttpServletRequest request) {
        Long userId = jwtService.extractUserId(request);
        MiniTestDTO test = lessonService.getMiniTest(lessonId, userId != null ? userId : 0L);
        if (test == null) {
            return ResponseEntity.status(404).body(ApiResponse.error("Mini test not found for this lesson"));
        }
        return ResponseEntity.ok(ApiResponse.ok(test));
    }

    @PostMapping("/mini-tests")
    public ResponseEntity<ApiResponse<Map<String, Object>>> createMiniTest(
            @RequestBody CreateMiniTestRequest req,
            HttpServletRequest request) {
        Long userId = jwtService.extractUserId(request);
        if (userId == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Authentication required"));
        }
        try {
            MiniTest test = lessonService.createMiniTest(req);
            Map<String, Object> result = Map.of(
                    "id", test.getId(),
                    "title", test.getTitle(),
                    "message", "Mini test created successfully"
            );
            return ResponseEntity.ok(ApiResponse.ok(result));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/mini-tests/{testId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> updateMiniTest(
            @PathVariable Long testId,
            @RequestBody CreateMiniTestRequest req,
            HttpServletRequest request) {
        Long userId = jwtService.extractUserId(request);
        if (userId == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Authentication required"));
        }
        try {
            MiniTest test = lessonService.updateMiniTest(testId, req);
            Map<String, Object> result = Map.of(
                    "id", test.getId(),
                    "title", test.getTitle(),
                    "message", "Mini test updated successfully"
            );
            return ResponseEntity.ok(ApiResponse.ok(result));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/lessons/{lessonId}/mini-test/submit")
    public ResponseEntity<ApiResponse<MiniTestResultDTO>> submitMiniTest(
            @PathVariable Long lessonId,
            @RequestBody MiniTestSubmitRequest req,
            HttpServletRequest request) {
        Long userId = jwtService.extractUserId(request);
        if (userId == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Authentication required"));
        }
        try {
            MiniTestResultDTO result = lessonService.submitMiniTest(lessonId, userId, req);
            return ResponseEntity.ok(ApiResponse.ok(result));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    // ===================== COMPLETION SETTINGS =====================

    @GetMapping("/lessons/{lessonId}/completion-settings")
    public ResponseEntity<ApiResponse<CompletionSettingsDTO>> getCompletionSettings(
            @PathVariable Long lessonId) {
        return ResponseEntity.ok(ApiResponse.ok(lessonService.getCompletionSettings(lessonId)));
    }

    @PutMapping("/lessons/{lessonId}/completion-settings")
    public ResponseEntity<ApiResponse<CompletionSettingsDTO>> saveCompletionSettings(
            @PathVariable Long lessonId,
            @RequestBody SaveCompletionSettingsRequest req,
            HttpServletRequest request) {
        Long userId = jwtService.extractUserId(request);
        if (userId == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Authentication required"));
        }
        CompletionSettingsDTO saved = lessonService.saveCompletionSettings(lessonId, req);
        return ResponseEntity.ok(ApiResponse.ok("Completion settings saved successfully", saved));
    }

    // ===================== PROGRESS =====================

    @GetMapping("/lessons/{lessonId}/progress")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getLessonProgress(
            @PathVariable Long lessonId,
            HttpServletRequest request) {
        Long userId = jwtService.extractUserId(request);
        if (userId == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Authentication required"));
        }
        Map<String, Object> progress = lessonService.getLessonProgress(lessonId, userId);
        return ResponseEntity.ok(ApiResponse.ok(progress));
    }
}
