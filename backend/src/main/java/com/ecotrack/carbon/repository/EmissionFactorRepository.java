package com.ecotrack.carbon.repository;

import com.ecotrack.carbon.entity.EmissionFactor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.Optional;

public interface EmissionFactorRepository extends JpaRepository<EmissionFactor, Long> {

    @Query("SELECT e FROM EmissionFactor e WHERE " +
           "LOWER(e.category) = LOWER(:category) AND " +
           "LOWER(e.activityType) = LOWER(:activityType) AND " +
           "LOWER(e.unit) = LOWER(:unit) AND " +
           "e.effectiveDate <= :effectiveDate " +
           "ORDER BY e.effectiveDate DESC")
    Optional<EmissionFactor> findFirstByCategoryAndActivityTypeAndUnitAndEffectiveDateLessThanEqualOrderByEffectiveDateDesc(
            @Param("category") String category,
            @Param("activityType") String activityType,
            @Param("unit") String unit,
            @Param("effectiveDate") LocalDate effectiveDate);
}