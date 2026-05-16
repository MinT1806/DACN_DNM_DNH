package com.abcenglish.repository;

import com.abcenglish.entity.StoryStep;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface StoryStepRepository extends JpaRepository<StoryStep, Long> {
    List<StoryStep> findByStoryIdOrderByStepOrderAsc(Long storyId);
}
