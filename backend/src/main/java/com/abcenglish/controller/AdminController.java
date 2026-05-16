package com.abcenglish.controller;

import com.abcenglish.entity.Course;
import com.abcenglish.entity.User;
import com.abcenglish.repository.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final UserRepository userRepository;
    private final CourseRepository courseRepository;
    private final QuizResultRepository quizResultRepository;
    private final VocabularyRepository vocabularyRepository;
    private final ExerciseRepository exerciseRepository;
    private final LessonRepository lessonRepository;

    public AdminController(
            UserRepository userRepository,
            CourseRepository courseRepository,
            QuizResultRepository quizResultRepository,
            VocabularyRepository vocabularyRepository,
            ExerciseRepository exerciseRepository,
            LessonRepository lessonRepository
    ) {
        this.userRepository = userRepository;
        this.courseRepository = courseRepository;
        this.quizResultRepository = quizResultRepository;
        this.vocabularyRepository = vocabularyRepository;
        this.exerciseRepository = exerciseRepository;
        this.lessonRepository = lessonRepository;
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        Map<String, Object> stats = new LinkedHashMap<>();

        List<User> allUsers = userRepository.findAll();

        long totalUsers = allUsers.size();
        long totalStudents = allUsers.stream().filter(u -> u.getRole() == User.Role.STUDENT).count();
        long totalTeachers = allUsers.stream().filter(u -> u.getRole() == User.Role.TEACHER).count();
        long totalAdmins = allUsers.stream().filter(u -> u.getRole() == User.Role.ADMIN).count();

        Map<String, Long> usersByRole = new LinkedHashMap<>();
        usersByRole.put("STUDENT", totalStudents);
        usersByRole.put("TEACHER", totalTeachers);
        usersByRole.put("ADMIN", totalAdmins);

        Map<String, Long> usersByLevel = new LinkedHashMap<>();
        for (User.Level level : User.Level.values()) {
            long count = allUsers.stream().filter(u -> u.getLevel() == level).count();
            usersByLevel.put(level.name(), count);
        }

        double avgScore = 0.0;
        List<Double> scores = quizResultRepository.findAll().stream()
                .map(q -> q.getScore())
                .filter(Objects::nonNull)
                .filter(s -> s > 0)
                .toList();
        if (!scores.isEmpty()) {
            avgScore = scores.stream().mapToDouble(Double::doubleValue).average().orElse(0.0);
        }

        long completedLessons = allUsers.stream().mapToLong(User::getForumPosts).sum();

        stats.put("totalUsers", totalUsers);
        stats.put("totalStudents", totalStudents);
        stats.put("totalTeachers", totalTeachers);
        stats.put("totalAdmins", totalAdmins);
        stats.put("totalCourses", courseRepository.count());
        stats.put("totalLessons", lessonRepository.count());
        stats.put("totalExercises", exerciseRepository.count());
        stats.put("totalVocabulary", vocabularyRepository.count());
        stats.put("totalQuizzes", quizResultRepository.count());
        stats.put("totalResults", quizResultRepository.count());
        stats.put("activeUsers", totalUsers);
        stats.put("usersByRole", usersByRole);
        stats.put("usersByLevel", usersByLevel);
        stats.put("avgScore", Math.round(avgScore * 10.0) / 10.0);
        stats.put("newUsersThisWeek", 0);
        stats.put("newUsersThisMonth", 0);
        stats.put("completionRate", totalUsers > 0 ? Math.round((double) completedLessons / totalUsers * 100) : 0);

        return ResponseEntity.ok(stats);
    }

    @GetMapping("/users")
    public ResponseEntity<Map<String, Object>> getUsers(
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String level,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Page<User> userPage;
        if (role != null && !role.isEmpty()) {
            try {
                User.Role userRole = User.Role.valueOf(role.toUpperCase());
                userPage = userRepository.findByRole(userRole, PageRequest.of(page, size));
            } catch (IllegalArgumentException e) {
                userPage = userRepository.findAll(PageRequest.of(page, size));
            }
        } else {
            userPage = userRepository.findAll(PageRequest.of(page, size));
        }

        List<Map<String, Object>> userDtos = userPage.getContent().stream()
                .filter(u -> level == null || level.isEmpty() ||
                        (u.getLevel() != null && u.getLevel().name().equalsIgnoreCase(level)))
                .filter(u -> search == null || search.isEmpty() ||
                        u.getUsername().toLowerCase().contains(search.toLowerCase()) ||
                        (u.getEmail() != null && u.getEmail().toLowerCase().contains(search.toLowerCase())) ||
                        (u.getFullName() != null && u.getFullName().toLowerCase().contains(search.toLowerCase())))
                .map(this::userToDto)
                .toList();

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("users", userDtos);
        response.put("page", userPage.getNumber());
        response.put("size", userPage.getSize());
        response.put("total", userPage.getTotalElements());
        response.put("totalPages", userPage.getTotalPages());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/users/{userId}")
    public ResponseEntity<Map<String, Object>> getUserById(@PathVariable Long userId) {
        return userRepository.findById(userId)
                .map(u -> {
                    Map<String, Object> dto = userToDto(u);
                    return ResponseEntity.ok(dto);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/users/{userId}")
    public ResponseEntity<Map<String, Object>> updateUser(
            @PathVariable Long userId,
            @RequestBody Map<String, Object> body
    ) {
        Optional<User> optUser = userRepository.findById(userId);
        if (optUser.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        User user = optUser.get();
        if (body.containsKey("fullName")) user.setFullName((String) body.get("fullName"));
        if (body.containsKey("email")) user.setEmail((String) body.get("email"));
        if (body.containsKey("level")) {
            try {
                user.setLevel(User.Level.valueOf((String) body.get("level")));
            } catch (IllegalArgumentException ignored) {}
        }
        userRepository.save(user);
        Map<String, Object> dto = userToDto(user);
        return ResponseEntity.ok(dto);
    }

    @PutMapping("/users/{userId}/role")
    public ResponseEntity<Map<String, Object>> updateUserRole(
            @PathVariable Long userId,
            @RequestBody Map<String, String> body
    ) {
        Optional<User> optUser = userRepository.findById(userId);
        if (optUser.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        User user = optUser.get();
        String newRole = body.get("role");
        if (newRole == null || newRole.isEmpty()) {
            Map<String, Object> err = new LinkedHashMap<>();
            err.put("success", false);
            err.put("message", "Role is required");
            return ResponseEntity.badRequest().body(err);
        }
        try {
            user.setRole(User.Role.valueOf(newRole.toUpperCase()));
            userRepository.save(user);

            Map<String, Object> result = new LinkedHashMap<>();
            result.put("success", true);
            result.put("userId", userId);
            result.put("newRole", user.getRole().name());
            result.put("message", "Role updated successfully");
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            Map<String, Object> err = new LinkedHashMap<>();
            err.put("success", false);
            err.put("message", "Invalid role: " + newRole);
            return ResponseEntity.badRequest().body(err);
        }
    }

    @PutMapping("/users/{userId}/status")
    public ResponseEntity<Map<String, Object>> updateUserStatus(
            @PathVariable Long userId,
            @RequestBody Map<String, Boolean> body
    ) {
        Optional<User> optUser = userRepository.findById(userId);
        if (optUser.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        User user = optUser.get();
        Boolean enabled = body.get("enabled");
        if (enabled != null) user.setEnabled(enabled);
        userRepository.save(user);
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("success", true);
        result.put("userId", userId);
        result.put("enabled", user.isEnabled());
        return ResponseEntity.ok(result);
    }

    @DeleteMapping("/users/{userId}")
    public ResponseEntity<Map<String, Object>> deleteUser(@PathVariable Long userId) {
        if (!userRepository.existsById(userId)) {
            return ResponseEntity.notFound().build();
        }
        userRepository.deleteById(userId);
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("success", true);
        result.put("userId", userId);
        result.put("message", "User deleted successfully");
        return ResponseEntity.ok(result);
    }

    @GetMapping("/reports")
    public ResponseEntity<Map<String, Object>> getReports() {
        Map<String, Object> reports = new LinkedHashMap<>();

        long totalUsers = userRepository.count();
        long totalCourses = courseRepository.count();
        long totalLessons = lessonRepository.count();
        long totalExercises = exerciseRepository.count();
        long totalQuizzes = quizResultRepository.count();

        reports.put("totalUsers", totalUsers);
        reports.put("totalCourses", totalCourses);
        reports.put("totalLessons", totalLessons);
        reports.put("totalExercises", totalExercises);
        reports.put("totalQuizzes", totalQuizzes);
        reports.put("dailyActiveUsers", totalUsers);
        reports.put("weeklyActiveUsers", totalUsers);
        reports.put("monthlyActiveUsers", totalUsers);
        reports.put("avgSessionDuration", 25);

        List<Map<String, Object>> topCourses = new ArrayList<>();
        List<Course> allCourses = courseRepository.findAll();
        for (Course c : allCourses) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("id", c.getId());
            item.put("name", c.getTitle() != null ? c.getTitle() : "Untitled");
            item.put("enrollments", c.getEnrolledCount());
            topCourses.add(item);
        }
        topCourses.sort((a, b) -> Long.compare(
                ((Number) b.get("enrollments")).longValue(),
                ((Number) a.get("enrollments")).longValue()
        ));
        if (topCourses.size() > 10) topCourses = topCourses.subList(0, 10);
        reports.put("topCourses", topCourses);

        return ResponseEntity.ok(reports);
    }

    private Map<String, Object> userToDto(User u) {
        Map<String, Object> dto = new LinkedHashMap<>();
        dto.put("id", u.getId());
        dto.put("username", u.getUsername());
        dto.put("email", u.getEmail());
        dto.put("fullName", u.getFullName());
        dto.put("role", u.getRole() != null ? u.getRole().name() : null);
        dto.put("level", u.getLevel() != null ? u.getLevel().name() : null);
        dto.put("ageGroup", u.getAgeGroup() != null ? u.getAgeGroup().name() : null);
        dto.put("avatarUrl", u.getAvatarUrl());
        dto.put("enabled", u.isEnabled());
        dto.put("createdAt", u.getCreatedAt());
        dto.put("totalExercises", u.getForumPosts());
        dto.put("totalPoints", u.getForumReputation());
        return dto;
    }
}
