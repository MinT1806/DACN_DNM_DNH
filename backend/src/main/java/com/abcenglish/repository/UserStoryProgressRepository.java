package com.abcenglish.repository;

import com.abcenglish.entity.UserStoryProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserStoryProgressRepository extends JpaRepository<UserStoryProgress, Long> {
    Optional<UserStoryProgress> findByUserIdAndStoryId(Long userId, Long storyId);
    List<UserStoryProgress> findByUserIdOrderByLastAccessedAtDesc(Long userId);
    List<UserStoryProgress> findByUserIdAndCompletedFalseOrderByLastAccessedAtDesc(Long userId);
}
