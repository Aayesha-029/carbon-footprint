package com.ecotrack.carbon.dto.response;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class ProfileResponse {
    private Long userId;
    private String email;
    private String fullName;
    private String bio;
    private String avatarUrl;
    private String preferredUnits;
    private String dietType;
    private String primaryTransportMode;
    private String energySource;
    private Boolean notificationsEnabled;
    private String theme;
    private String language;
    private BigDecimal totalCO2e;
    private Long totalActivities;
    private Integer badgeCount;
    private Integer carbonScore;
    private String createdAt;
}