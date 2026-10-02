package com.ecotrack.carbon.dto.request;

import lombok.Data;

@Data
public class ProfileUpdateRequest {
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
}