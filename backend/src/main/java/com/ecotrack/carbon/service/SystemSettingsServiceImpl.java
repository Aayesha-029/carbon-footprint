package com.ecotrack.carbon.service;

import com.ecotrack.carbon.dto.request.SystemSettingsRequest;
import com.ecotrack.carbon.dto.response.SystemSettingsResponse;
import com.ecotrack.carbon.entity.SystemSettings;
import com.ecotrack.carbon.repository.SystemSettingsRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class SystemSettingsServiceImpl implements SystemSettingsService {

    private final SystemSettingsRepository settingsRepository;
    private final ObjectMapper objectMapper;

    private static final String SETTINGS_KEY = "platform_settings";

    @Override
    public SystemSettingsResponse getSettings() {
        log.info("📊 Fetching system settings");
        
        SystemSettings settings = settingsRepository.findByKey(SETTINGS_KEY)
                .orElseGet(() -> {
                    log.info("⚠️ Settings not found, creating default settings...");
                    return createDefaultSettings();
                });
        
        log.info("✅ Settings retrieved: {}", settings.getValue());
        return parseSettingsToResponse(settings);
    }

    private SystemSettings createDefaultSettings() {
        Map<String, String> defaultMap = getDefaultSettings();
        try {
            String jsonValue = objectMapper.writeValueAsString(defaultMap);
            log.info("📝 Creating default settings: {}", jsonValue);
            
            SystemSettings settings = new SystemSettings();
            settings.setKey(SETTINGS_KEY);
            settings.setValue(jsonValue);
            settings.setDescription("Platform-wide system settings stored as JSON");
            settings.setIsEditable(true);
            settings.setUpdatedBy("system");
            settings.setCreatedAt(LocalDateTime.now());
            settings.setUpdatedAt(LocalDateTime.now());
            return settingsRepository.save(settings);
        } catch (Exception e) {
            log.error("❌ Failed to create default settings: {}", e.getMessage());
            throw new RuntimeException("Failed to initialize settings");
        }
    }

    @Override
    @Transactional
    public SystemSettingsResponse updateSettings(SystemSettingsRequest request, String updatedBy) {
        log.info("📤 Updating system settings by: {}", updatedBy);
        log.info("📤 Request data - AppName: {}, Theme: {}, Maintenance: {}", 
            request.getAppName(), request.getTheme(), request.getMaintenanceMode());
        
        SystemSettings settings = settingsRepository.findByKey(SETTINGS_KEY)
                .orElseGet(this::createDefaultSettings);
        
        // Convert request to Map
        Map<String, String> settingsMap = convertRequestToMap(request);
        
        try {
            String jsonValue = objectMapper.writeValueAsString(settingsMap);
            log.info("📤 Saving JSON: {}", jsonValue);
            
            settings.setValue(jsonValue);
            settings.setUpdatedAt(LocalDateTime.now());
            settings.setUpdatedBy(updatedBy);
            
            SystemSettings saved = settingsRepository.save(settings);
            log.info("✅ System settings updated successfully, ID: {}", saved.getId());
            
            // Return updated settings
            return parseSettingsToResponse(saved);
            
        } catch (Exception e) {
            log.error("❌ Error updating settings: {}", e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to update settings: " + e.getMessage());
        }
    }

    @Override
    public String getSettingValue(String key) {
        Map<String, String> allSettings = getAllSettings();
        return allSettings.getOrDefault(key, null);
    }

    @Override
    @Transactional
    public void updateSetting(String key, String value, String updatedBy) {
        log.info("📤 Updating individual setting: {} = {} by: {}", key, value, updatedBy);
        
        SystemSettings settings = settingsRepository.findByKey(SETTINGS_KEY)
                .orElseGet(this::createDefaultSettings);
        
        try {
            Map<String, String> settingsMap = objectMapper.readValue(
                    settings.getValue(), 
                    new TypeReference<Map<String, String>>() {}
            );
            
            settingsMap.put(key, value);
            
            String jsonValue = objectMapper.writeValueAsString(settingsMap);
            settings.setValue(jsonValue);
            settings.setUpdatedAt(LocalDateTime.now());
            settings.setUpdatedBy(updatedBy);
            
            settingsRepository.save(settings);
            log.info("✅ Individual setting updated successfully");
            
        } catch (Exception e) {
            log.error("❌ Error updating individual setting: {}", e.getMessage());
            throw new RuntimeException("Failed to update setting: " + e.getMessage());
        }
    }

    @Override
    public Map<String, String> getAllSettings() {
        SystemSettings settings = settingsRepository.findByKey(SETTINGS_KEY)
                .orElseGet(this::createDefaultSettings);
        
        try {
            return objectMapper.readValue(
                    settings.getValue(),
                    new TypeReference<Map<String, String>>() {}
            );
        } catch (Exception e) {
            log.error("❌ Error parsing settings: {}", e.getMessage());
            throw new RuntimeException("Failed to parse settings");
        }
    }

    @Override
    @Transactional
    public void resetToDefaults(String updatedBy) {
        log.info("🔄 Resetting settings to defaults by: {}", updatedBy);
        
        Map<String, String> defaultSettings = getDefaultSettings();
        
        try {
            String jsonValue = objectMapper.writeValueAsString(defaultSettings);
            
            SystemSettings settings = settingsRepository.findByKey(SETTINGS_KEY)
                    .orElse(new SystemSettings());
            
            settings.setKey(SETTINGS_KEY);
            settings.setValue(jsonValue);
            settings.setDescription("Platform-wide system settings stored as JSON");
            settings.setIsEditable(true);
            settings.setUpdatedAt(LocalDateTime.now());
            settings.setUpdatedBy(updatedBy);
            
            settingsRepository.save(settings);
            log.info("✅ Settings reset to defaults successfully");
            
        } catch (Exception e) {
            log.error("❌ Error resetting settings: {}", e.getMessage());
            throw new RuntimeException("Failed to reset settings: " + e.getMessage());
        }
    }

    private SystemSettingsResponse parseSettingsToResponse(SystemSettings settings) {
        try {
            Map<String, String> settingsMap = objectMapper.readValue(
                    settings.getValue(),
                    new TypeReference<Map<String, String>>() {}
            );
            
            log.info("📊 Parsed settings: {}", settingsMap);
            
            return SystemSettingsResponse.builder()
                    .id(settings.getId())
                    .appName(settingsMap.getOrDefault("appName", "CarbonTrack"))
                    .appDescription(settingsMap.getOrDefault("appDescription", "Track your carbon footprint. Make a difference."))
                    .emailNotifications(Boolean.parseBoolean(settingsMap.getOrDefault("emailNotifications", "true")))
                    .userRegistration(Boolean.parseBoolean(settingsMap.getOrDefault("userRegistration", "true")))
                    .defaultRole(settingsMap.getOrDefault("defaultRole", "USER"))
                    .carbonGoalEnabled(Boolean.parseBoolean(settingsMap.getOrDefault("carbonGoalEnabled", "true")))
                    .leaderboardEnabled(Boolean.parseBoolean(settingsMap.getOrDefault("leaderboardEnabled", "true")))
                    .badgesEnabled(Boolean.parseBoolean(settingsMap.getOrDefault("badgesEnabled", "true")))
                    .allowSocialLogin(Boolean.parseBoolean(settingsMap.getOrDefault("allowSocialLogin", "true")))
                    .maintenanceMode(Boolean.parseBoolean(settingsMap.getOrDefault("maintenanceMode", "false")))
                    .theme(settingsMap.getOrDefault("theme", "light"))
                    .language(settingsMap.getOrDefault("language", "en"))
                    .additionalSettings(settingsMap)
                    .updatedAt(settings.getUpdatedAt())
                    .updatedBy(settings.getUpdatedBy())
                    .build();
                    
        } catch (Exception e) {
            log.error("❌ Error parsing settings: {}", e.getMessage());
            throw new RuntimeException("Failed to parse settings");
        }
    }

    private Map<String, String> convertRequestToMap(SystemSettingsRequest request) {
        Map<String, String> map = new HashMap<>();
        map.put("appName", request.getAppName() != null ? request.getAppName() : "CarbonTrack");
        map.put("appDescription", request.getAppDescription() != null ? request.getAppDescription() : "");
        map.put("emailNotifications", String.valueOf(request.getEmailNotifications() != null && request.getEmailNotifications()));
        map.put("userRegistration", String.valueOf(request.getUserRegistration() != null && request.getUserRegistration()));
        map.put("defaultRole", request.getDefaultRole() != null ? request.getDefaultRole() : "USER");
        map.put("carbonGoalEnabled", String.valueOf(request.getCarbonGoalEnabled() != null && request.getCarbonGoalEnabled()));
        map.put("leaderboardEnabled", String.valueOf(request.getLeaderboardEnabled() != null && request.getLeaderboardEnabled()));
        map.put("badgesEnabled", String.valueOf(request.getBadgesEnabled() != null && request.getBadgesEnabled()));
        map.put("allowSocialLogin", String.valueOf(request.getAllowSocialLogin() != null && request.getAllowSocialLogin()));
        map.put("maintenanceMode", String.valueOf(request.getMaintenanceMode() != null && request.getMaintenanceMode()));
        map.put("theme", request.getTheme() != null ? request.getTheme() : "light");
        map.put("language", request.getLanguage() != null ? request.getLanguage() : "en");
        
        if (request.getAdditionalSettings() != null) {
            map.putAll(request.getAdditionalSettings());
        }
        
        log.info("📤 Converted request to map: {}", map);
        return map;
    }

    private Map<String, String> getDefaultSettings() {
        Map<String, String> defaults = new HashMap<>();
        defaults.put("appName", "CarbonTrack");
        defaults.put("appDescription", "Track your carbon footprint. Make a difference.");
        defaults.put("emailNotifications", "true");
        defaults.put("userRegistration", "true");
        defaults.put("defaultRole", "USER");
        defaults.put("carbonGoalEnabled", "true");
        defaults.put("leaderboardEnabled", "true");
        defaults.put("badgesEnabled", "true");
        defaults.put("allowSocialLogin", "true");
        defaults.put("maintenanceMode", "false");
        defaults.put("theme", "light");
        defaults.put("language", "en");
        return defaults;
    }
}