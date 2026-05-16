package com.abcenglish.repository;

import com.abcenglish.entity.Test;
import com.abcenglish.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TestRepository extends JpaRepository<Test, Long> {
    List<Test> findByActiveTrue();
    List<Test> findByActiveTrueAndLevel(User.Level level);
    List<Test> findByActiveTrueAndType(Test.TestType type);
    List<Test> findByActiveTrueAndLevelAndType(User.Level level, Test.TestType type);
}
