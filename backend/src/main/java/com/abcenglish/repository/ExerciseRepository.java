package com.abcenglish.repository;

import com.abcenglish.entity.Exercise;
import com.abcenglish.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ExerciseRepository extends JpaRepository<Exercise, Long> {
    List<Exercise> findByType(Exercise.ExerciseType type);
    List<Exercise> findByLevel(User.Level level);
    List<Exercise> findByTypeAndLevel(Exercise.ExerciseType type, User.Level level);
    List<Exercise> findByActiveTrue();
    List<Exercise> findByActiveTrueAndTypeAndLevel(Exercise.ExerciseType type, User.Level level);
    List<Exercise> findByTopicContainingIgnoreCase(String topic);
    List<Exercise> findByTitleContainingIgnoreCase(String title);
    List<Exercise> findByActiveTrueAndTypeAndLevelAndTopicContainingIgnoreCase(Exercise.ExerciseType type, User.Level level, String topic);
    List<Exercise> findByActiveTrueAndTypeAndTopicContainingIgnoreCase(Exercise.ExerciseType type, String topic);
}
