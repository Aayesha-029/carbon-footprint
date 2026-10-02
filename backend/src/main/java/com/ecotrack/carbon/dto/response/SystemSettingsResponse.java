package com.ecotrack.carbon.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SystemSettingsResponse {
    
    private Long id;
    private String appName;
    private String appDescription;
    private Boolean emailNotifications;
    private Boolean userRegistration;
    private String defaultRole;
    private Boolean carbonGoalEnabled;
    private Boolean leaderboardEnabled;
    private Boolean badgesEnabled;
    private Boolean allowSocialLogin;
    private Boolean maintenanceMode;
    private String theme;
    private String language;
    private Map<String, String> additionalSettings;
    private LocalDateTime updatedAt;
    private String updatedBy;
}
