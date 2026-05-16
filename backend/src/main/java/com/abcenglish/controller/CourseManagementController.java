package com.abcenglish.controller;

import com.abcenglish.dto.ApiResponse;
import com.abcenglish.dto.LessonManagementDTO.*;
import com.abcenglish.entity.Course;
import com.abcenglish.service.CourseManagementService;
import com.abcenglish.service.JwtService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/course-management")
@CrossOrigin(origins = "*")
public class CourseManagementController {

    private final CourseManagementService courseService;
    private final JwtService jwtService;

    public CourseManagementController(CourseManagementService courseService, JwtService jwtService) {
        this.courseService = courseService;
        this.jwtService = jwtService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> createCourse(
            @RequestBody CreateCourseRequest req,
            HttpServletRequest request) {
        Long userId = jwtService.extractUserId(request);
        if (userId == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Authentication required"));
        }
        try {
            Course course = courseService.createCourse(req);
            Map<String, Object> result = Map.of(
                    "id", course.getId(),
                    "title", course.getTitle(),
                    "message", "Course created successfully"
            );
            return ResponseEntity.ok(ApiResponse.ok(result));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> updateCourse(
            @PathVariable Long id,
            @RequestBody UpdateCourseRequest req,
            HttpServletRequest request) {
        Long userId = jwtService.extractUserId(request);
        if (userId == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Authentication required"));
        }
        try {
            Course course = courseService.updateCourse(id, req);
            Map<String, Object> result = Map.of(
                    "id", course.getId(),
                    "title", course.getTitle(),
                    "message", "Course updated successfully"
            );
            return ResponseEntity.ok(ApiResponse.ok(result));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteCourse(
            @PathVariable Long id,
            HttpServletRequest request) {
        Long userId = jwtService.extractUserId(request);
        if (userId == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Authentication required"));
        }
        try {
            courseService.deleteCourse(id);
            return ResponseEntity.ok(ApiResponse.ok("Course deleted successfully", null));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<List<Course>> getAllCourses() {
        return ResponseEntity.ok(courseService.getAllCourses());
    }

    @GetMapping("/{id}")
    public ResponseEntity<CourseDetailDTO> getCourseById(@PathVariable Long id) {
        try {
            // Default: no user context (anonymous)
            return ResponseEntity.ok(courseService.getCourseDetail(id, null));
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/{id}/detail")
    public ResponseEntity<ApiResponse<CourseDetailDTO>> getCourseDetail(
            @PathVariable Long id,
            HttpServletRequest request) {
        Long userId = jwtService.extractUserId(request);
        try {
            CourseDetailDTO detail = courseService.getCourseDetail(id, userId);
            return ResponseEntity.ok(ApiResponse.ok(detail));
        } catch (Exception e) {
            return ResponseEntity.status(404).body(ApiResponse.error("Course not found"));
        }
    }

    @GetMapping("/level/{level}")
    public ResponseEntity<List<Course>> getCoursesByLevel(@PathVariable String level) {
        return ResponseEntity.ok(courseService.getCoursesByLevel(level));
    }

    @GetMapping("/featured")
    public ResponseEntity<List<Course>> getFeaturedCourses() {
        return ResponseEntity.ok(courseService.getFeaturedCourses());
    }

    @PostMapping("/{courseId}/enroll")
    public ResponseEntity<ApiResponse<Void>> enrollInCourse(
            @PathVariable Long courseId,
            HttpServletRequest request) {
        Long userId = jwtService.extractUserId(request);
        if (userId == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Authentication required"));
        }
        try {
            courseService.enrollInCourse(courseId, userId);
            return ResponseEntity.ok(ApiResponse.ok("Enrolled successfully", null));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/{courseId}/lessons/order")
    public ResponseEntity<ApiResponse<Void>> reorderLessons(
            @PathVariable Long courseId,
            @RequestBody List<Long> lessonIds,
            HttpServletRequest request) {
        Long userId = jwtService.extractUserId(request);
        if (userId == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Authentication required"));
        }
        try {
            courseService.reorderLessons(courseId, lessonIds);
            return ResponseEntity.ok(ApiResponse.ok("Lessons reordered successfully", null));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/{courseId}/stats")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getCourseStats(
            @PathVariable Long courseId) {
        try {
            return ResponseEntity.ok(ApiResponse.ok(courseService.getCourseStats(courseId)));
        } catch (Exception e) {
            return ResponseEntity.status(404).body(ApiResponse.error("Course not found"));
        }
    }
}
