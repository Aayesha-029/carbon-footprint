package com.ecotrack.carbon.repository;

import com.ecotrack.carbon.entity.Badge;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BadgeRepository extends JpaRepository<Badge, Long> {

    List<Badge> findByUserId(Long userId);

    boolean existsByUserIdAndBadgeType(Long userId, String badgeType);

    // ===== NEW: Batch query to fetch badges for multiple users at once =====
    List<Badge> findByUserIdIn(List<Long> userIds);
}