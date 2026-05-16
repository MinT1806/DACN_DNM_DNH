package com.abcenglish.repository;

import com.abcenglish.entity.TestSection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TestSectionRepository extends JpaRepository<TestSection, Long> {
    List<TestSection> findByTestIdOrderByOrderIndexAsc(Long testId);
    void deleteByTestId(Long testId);
    long countByTestId(Long testId);
}
