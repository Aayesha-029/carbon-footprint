package com.ecotrack.carbon.repository;

import com.ecotrack.carbon.entity.ActivityLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public interface ActivityLogRepository extends JpaRepository<ActivityLog, Long> {

    List<ActivityLog> findByUserIdOrderByLogDateDesc(Long userId);

    List<ActivityLog> findByUserIdAndLogDateBetweenOrderByLogDateDesc(Long userId, LocalDate startDate, LocalDate endDate);

    @Query("SELECT a FROM ActivityLog a WHERE a.user.id = :userId AND a.category = :category AND a.logDate BETWEEN :startDate AND :endDate ORDER BY a.logDate DESC")
    List<ActivityLog> findByUserIdAndCategoryAndLogDateBetween(
            @Param("userId") Long userId,
            @Param("category") String category,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    @Query("SELECT SUM(a.co2eKg) FROM ActivityLog a WHERE a.user.id = :userId AND a.category = :category AND a.logDate BETWEEN :startDate AND :endDate")
    BigDecimal sumCO2ByUserIdAndCategoryAndDateRange(
            @Param("userId") Long userId,
            @Param("category") String category,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    @Query("SELECT SUM(a.co2eKg) FROM ActivityLog a WHERE a.user.id = :userId AND a.logDate BETWEEN :startDate AND :endDate")
    BigDecimal sumCO2ByUserIdAndDateRange(
            @Param("userId") Long userId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    void deleteByIdAndUserId(Long id, Long userId);

    // ===== NEW: For organization analytics (find activities for multiple users in date range) =====
    List<ActivityLog> findByUserIdInAndLogDateBetween(List<Long> userIds, LocalDate startDate, LocalDate endDate);
}