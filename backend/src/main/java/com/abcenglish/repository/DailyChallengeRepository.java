package com.abcenglish.repository;

import com.abcenglish.entity.DailyChallenge;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface DailyChallengeRepository extends JpaRepository<DailyChallenge, Long> {
    Optional<DailyChallenge> findByChallengeDateAndActiveTrue(LocalDate date);
    List<DailyChallenge> findByActiveTrueOrderByChallengeDateDesc();
    List<DailyChallenge> findByChallengeDateBetweenOrderByChallengeDateAsc(LocalDate start, LocalDate end);
}
