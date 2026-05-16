package com.abcenglish.repository;

import com.abcenglish.entity.ExerciseQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ExerciseQuestionRepository extends JpaRepository<ExerciseQuestion, Long> {
    List<ExerciseQuestion> findByExerciseIdOrderByOrderIndexAsc(Long exerciseId);
    List<ExerciseQuestion> findByExerciseId(Long exerciseId);
    void deleteByExerciseId(Long exerciseId);
}
