package com.ecotrack.carbon.service;

import com.ecotrack.carbon.dto.request.SystemSettingsRequest;
import com.ecotrack.carbon.dto.response.SystemSettingsResponse;

import java.util.Map;

public interface SystemSettingsService {
    
    SystemSettingsResponse getSettings();
    
    SystemSettingsResponse updateSettings(SystemSettingsRequest request, String updatedBy);
    
    String getSettingValue(String key);
    
    void updateSetting(String key, String value, String updatedBy);
    
    Map<String, String> getAllSettings();
    
    void resetToDefaults(String updatedBy);
}