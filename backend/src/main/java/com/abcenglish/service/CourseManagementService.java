package com.abcenglish.service;

import com.abcenglish.dto.LessonManagementDTO;
import com.abcenglish.dto.LessonManagementDTO.CourseDetailDTO;
import com.abcenglish.dto.LessonManagementDTO.CourseProgressDTO;
import com.abcenglish.dto.LessonManagementDTO.CreateCourseRequest;
import com.abcenglish.dto.LessonManagementDTO.LessonListDTO;
import com.abcenglish.dto.LessonManagementDTO.UpdateCourseRequest;
import com.abcenglish.entity.*;
import com.abcenglish.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class CourseManagementService {

    private final CourseRepository courseRepository;
    private final LessonRepository lessonRepository;
    private final LessonProgressRepository progressRepository;
    private final MiniTestResultRepository miniTestResultRepository;
    private final LessonCompletionSettingsRepository completionSettingsRepository;

    public CourseManagementService(
            CourseRepository courseRepository,
            LessonRepository lessonRepository,
            LessonProgressRepository progressRepository,
            MiniTestResultRepository miniTestResultRepository,
            LessonCompletionSettingsRepository completionSettingsRepository) {
        this.courseRepository = courseRepository;
        this.lessonRepository = lessonRepository;
        this.progressRepository = progressRepository;
        this.miniTestResultRepository = miniTestResultRepository;
        this.completionSettingsRepository = completionSettingsRepository;
    }

    // ===================== COURSE CRUD =====================

    public Course createCourse(CreateCourseRequest req) {
        Course course = new Course();
        course.setTitle(req.title());
        course.setDescription(req.description());
        course.setLevel(User.Level.valueOf(req.level().toUpperCase()));
        course.setInstructor(req.instructor());
        course.setInstructorAvatar(req.instructorAvatar());
        course.setThumbnailUrl(req.thumbnailUrl());
        course.setCategory(req.category());
        course.setFeatured(req.featured());
        course.setTotalLessons(0);
        course.setCompletedLessons(0);
        course.setEnrolledCount(0);
        course.setRating(0.0);
        return courseRepository.save(course);
    }

    public Course updateCourse(Long id, UpdateCourseRequest req) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Course not found"));
        if (req.title() != null) course.setTitle(req.title());
        if (req.description() != null) course.setDescription(req.description());
        if (req.level() != null) course.setLevel(User.Level.valueOf(req.level().toUpperCase()));
        if (req.instructor() != null) course.setInstructor(req.instructor());
        if (req.instructorAvatar() != null) course.setInstructorAvatar(req.instructorAvatar());
        if (req.thumbnailUrl() != null) course.setThumbnailUrl(req.thumbnailUrl());
        if (req.category() != null) course.setCategory(req.category());
        course.setFeatured(req.featured());
        return courseRepository.save(course);
    }

    public void deleteCourse(Long id) {
        List<Lesson> lessons = lessonRepository.findByCourseIdOrderByOrderIndex(id);
        for (Lesson lesson : lessons) {
            lessonRepository.deleteById(lesson.getId());
        }
        courseRepository.deleteById(id);
    }

    public List<Course> getAllCourses() {
        return courseRepository.findAll();
    }

    public Course getCourseById(Long id) {
        return courseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Course not found"));
    }

    public List<Course> getCoursesByLevel(String level) {
        User.Level lvl = User.Level.valueOf(level.toUpperCase());
        return courseRepository.findByLevel(lvl);
    }

    public List<Course> getFeaturedCourses() {
        return courseRepository.findByFeaturedTrue();
    }

    // ===================== DETAILED COURSE =====================

    public CourseDetailDTO getCourseDetail(Long courseId, Long userId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found"));

        List<Lesson> lessons = lessonRepository.findByCourseIdOrderByOrderIndex(courseId);
        List<LessonListDTO> lessonDTOs = new ArrayList<>();
        Set<Long> completedLessonIds = new HashSet<>();
        Map<Long, Integer> lessonScores = new HashMap<>();
        boolean hasProgress = userId != null;

        if (hasProgress) {
            List<LessonProgress> allProgress = progressRepository.findAll().stream()
                    .filter(p -> p.getLessonId() != null &&
                            lessons.stream().anyMatch(l -> l.getId().equals(p.getLessonId())))
                    .filter(p -> p.getUserId().equals(userId))
                    .toList();
            for (LessonProgress p : allProgress) {
                if (p.isLessonCompleted()) completedLessonIds.add(p.getLessonId());
                if (p.getTotalScore() > 0) lessonScores.put(p.getLessonId(), p.getTotalScore());
            }

            // Mini test results
            List<MiniTestResult> miniResults = miniTestResultRepository
                    .findByUserIdOrderByCompletedAtDesc(userId);
            for (MiniTestResult r : miniResults) {
                if (r.getScore() > 0) {
                    lessonScores.merge(r.getLessonId(), r.getScore(), Math::max);
                }
            }
        }

        int totalLessons = lessons.size();
        boolean firstLessonSeen = false;
        for (Lesson lesson : lessons) {
            boolean completed = completedLessonIds.contains(lesson.getId());
            boolean inProgress = hasProgress && !completed &&
                    (lessonScores.containsKey(lesson.getId()) ||
                            progressRepository.findByUserIdAndLessonId(userId, lesson.getId()).isPresent());

            // Locked: first lesson is always unlocked; others need previous completed
            boolean locked = !firstLessonSeen && !completed;
            if (completed || inProgress) locked = false;
            if (firstLessonSeen && !completed && !inProgress) locked = true;

            lessonDTOs.add(new LessonListDTO(
                    lesson.getId(),
                    lesson.getTitle(),
                    lesson.getOrderIndex(),
                    lesson.getDurationMinutes(),
                    completed,
                    locked,
                    inProgress,
                    lessonScores.getOrDefault(lesson.getId(), 0)
            ));

            if (completed || inProgress) {
                // Already started, next could be unlocked if firstSeen
            } else {
                firstLessonSeen = true;
            }
        }

        // Build progress
        CourseProgressDTO progressDTO = null;
        if (hasProgress) {
            int completed = (int) lessonDTOs.stream().filter(LessonListDTO::completed).count();
            double avgScore = lessonDTOs.stream()
                    .filter(l -> l.score() > 0)
                    .mapToInt(LessonListDTO::score)
                    .average().orElse(0.0);
            int totalTimeSpent = progressRepository.findAll().stream()
                    .filter(p -> p.getUserId().equals(userId) &&
                            lessons.stream().anyMatch(l -> l.getId().equals(p.getLessonId())))
                    .mapToInt(LessonProgress::getTimeSpentSeconds)
                    .sum();
            progressDTO = new CourseProgressDTO(
                    completed, totalLessons,
                    totalLessons > 0 ? Math.round((double) completed / totalLessons * 100) : 0,
                    totalTimeSpent, avgScore
            );
        }

        boolean enrolled = hasProgress && progressRepository.findAll().stream()
                .anyMatch(p -> p.getUserId().equals(userId) &&
                        lessons.stream().anyMatch(l -> l.getId().equals(p.getLessonId())));

        return LessonManagementDTO.fromCourse(course, lessonDTOs, progressDTO, enrolled);
    }

    // ===================== COURSE ENROLLMENT =====================

    @Transactional
    public void enrollInCourse(Long courseId, Long userId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found"));
        course.setEnrolledCount(course.getEnrolledCount() + 1);
        courseRepository.save(course);

        // Initialize progress for all lessons
        List<Lesson> lessons = lessonRepository.findByCourseIdOrderByOrderIndex(courseId);
        for (Lesson lesson : lessons) {
            if (progressRepository.findByUserIdAndLessonId(userId, lesson.getId()).isEmpty()) {
                LessonProgress progress = new LessonProgress();
                progress.setUserId(userId);
                progress.setLessonId(lesson.getId());
                progress.setCourseId(courseId);
                progressRepository.save(progress);
            }
        }
    }

    // ===================== LESSON ORDERING =====================

    @Transactional
    public void reorderLessons(Long courseId, List<Long> lessonIds) {
        for (int i = 0; i < lessonIds.size(); i++) {
            final Long lessonId = lessonIds.get(i);
            Lesson lesson = lessonRepository.findById(lessonId)
                    .orElseThrow(() -> new RuntimeException("Lesson not found: " + lessonId));
            if (!lesson.getCourseId().equals(courseId)) {
                throw new RuntimeException("Lesson does not belong to course");
            }
            lesson.setOrderIndex(i);
            lessonRepository.save(lesson);
        }
    }

    // ===================== STATISTICS =====================

    public Map<String, Object> getCourseStats(Long courseId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found"));
        List<Lesson> lessons = lessonRepository.findByCourseIdOrderByOrderIndex(courseId);

        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("courseId", courseId);
        stats.put("courseTitle", course.getTitle());
        stats.put("totalLessons", lessons.size());
        stats.put("totalDuration", lessons.stream().mapToInt(Lesson::getDurationMinutes).sum());
        stats.put("enrolledCount", course.getEnrolledCount());
        stats.put("averageProgress", course.getTotalLessons() > 0 ?
                (double) course.getCompletedLessons() / course.getTotalLessons() * 100 : 0);

        // Average score across all users
        List<LessonProgress> allProgress = progressRepository.findAll().stream()
                .filter(p -> lessons.stream().anyMatch(l -> l.getId().equals(p.getLessonId())))
                .toList();
        double avgScore = allProgress.stream()
                .filter(p -> p.getTotalScore() > 0)
                .mapToInt(LessonProgress::getTotalScore)
                .average().orElse(0.0);
        stats.put("averageScore", Math.round(avgScore * 10) / 10.0);

        return stats;
    }
}
