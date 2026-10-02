package com.ecotrack.carbon.dto.response;

import lombok.Data;
import java.time.LocalDateTime;

@Data  // Add this
public class BadgeResponse {
    private Long id;
    private Long userId;
    private String userName;
    private String badgeType;
    private String badgeName;
    private String badgeIcon;
    private String description;
    private LocalDateTime earnedAt;
}