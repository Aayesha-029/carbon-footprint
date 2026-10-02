package com.ecotrack.carbon.dto.response;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class MemberResponse {
    private Long memberId;
    private Long userId;
    private String username;
    private String fullName;
    private String email;
    private String status;       // ACTIVE / INACTIVE
    private LocalDateTime joinedAt;
    private LocalDateTime invitedAt;
    private Long activityCount;
    private BigDecimal totalCO2e;
    private Integer badgeCount;
}