package com.abcenglish.repository;

import com.abcenglish.entity.UserChallenge;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserChallengeRepository extends JpaRepository<UserChallenge, Long> {
    Optional<UserChallenge> findByUserIdAndChallengeId(Long userId, Long challengeId);
    List<UserChallenge> findByUserId(Long userId);
    List<UserChallenge> findByUserIdAndCompletedTrue(Long userId);
    boolean existsByUserIdAndChallengeIdAndCompletedTrue(Long userId, Long challengeId);
}
