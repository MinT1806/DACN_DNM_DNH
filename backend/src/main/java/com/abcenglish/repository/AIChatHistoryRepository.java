package com.abcenglish.repository;

import com.abcenglish.entity.AIChatHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface AIChatHistoryRepository extends JpaRepository<AIChatHistory, Long> {
    List<AIChatHistory> findByUserIdOrderByCreatedAtDesc(Long userId);
}
