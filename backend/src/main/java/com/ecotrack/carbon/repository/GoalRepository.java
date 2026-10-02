package com.ecotrack.carbon.repository;

import com.ecotrack.carbon.entity.Goal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface GoalRepository extends JpaRepository<Goal, Long> {

    List<Goal> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<Goal> findByUserIdAndStatus(Long userId, String status);

    @Query("SELECT g FROM Goal g WHERE g.user.id = :userId AND g.startDate <= :date AND g.endDate >= :date")
    List<Goal> findActiveGoalsByDate(@Param("userId") Long userId, @Param("date") LocalDate date);

    @Query("SELECT g FROM Goal g WHERE g.user.id = :userId AND g.category = :category AND g.startDate <= :date AND g.endDate >= :date")
    List<Goal> findActiveGoalsByCategoryAndDate(@Param("userId") Long userId, @Param("category") String category, @Param("date") LocalDate date);
}