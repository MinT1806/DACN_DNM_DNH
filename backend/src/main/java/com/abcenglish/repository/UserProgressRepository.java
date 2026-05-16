package com.abcenglish.repository;

import com.abcenglish.entity.UserProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface UserProgressRepository extends JpaRepository<UserProgress, Long> {
    List<UserProgress> findByUserId(Long userId);
    List<UserProgress> findByUserIdAndCourseId(Long userId, Long courseId);
    List<UserProgress> findByUserIdAndCompletedTrueOrderByCompletedAtDesc(Long userId);
    Optional<UserProgress> findByUserIdAndLessonId(Long userId, Long lessonId);
}
