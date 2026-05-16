package com.abcenglish.repository;

import com.abcenglish.entity.Story;
import com.abcenglish.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface StoryRepository extends JpaRepository<Story, Long> {
    List<Story> findByActiveTrueOrderByCreatedAtDesc();
    List<Story> findByLevelAndActiveTrueOrderByCreatedAtDesc(User.Level level);
    List<Story> findByCategoryAndActiveTrueOrderByCreatedAtDesc(String category);
    Optional<Story> findByIdAndActiveTrue(Long id);
}
