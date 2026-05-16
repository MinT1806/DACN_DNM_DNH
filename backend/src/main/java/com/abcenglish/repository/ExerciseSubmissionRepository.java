package com.abcenglish.repository;

import com.abcenglish.entity.ExerciseSubmission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ExerciseSubmissionRepository extends JpaRepository<ExerciseSubmission, Long> {
    List<ExerciseSubmission> findByUserIdAndExerciseIdOrderBySubmittedAtAsc(Long userId, Long exerciseId);
    List<ExerciseSubmission> findByUserIdOrderBySubmittedAtDesc(Long userId);
    Optional<ExerciseSubmission> findTopByUserIdAndQuestionIdOrderBySubmittedAtDesc(Long userId, Long questionId);
    boolean existsByUserIdAndExerciseId(Long userId, Long exerciseId);
}
