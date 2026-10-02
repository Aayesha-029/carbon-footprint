package com.ecotrack.carbon.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotBlank;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SystemSettingsRequest {
    
    @NotBlank(message = "App name is required")
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
    
    // Map for any additional settings
    private Map<String, String> additionalSettings;
}
