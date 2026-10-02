package com.ecotrack.carbon.controller;

import com.ecotrack.carbon.dto.request.SystemSettingsRequest;
import com.ecotrack.carbon.dto.response.SystemSettingsResponse;
import com.ecotrack.carbon.service.SystemSettingsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/settings")
@RequiredArgsConstructor
@Tag(name = "Admin Settings", description = "Admin settings management API")
@SecurityRequirement(name = "bearerAuth")
@Slf4j
public class AdminSettingsController {

    private final SystemSettingsService settingsService;

    @GetMapping
    @Operation(summary = "Get all system settings")
    public ResponseEntity<Map<String, Object>> getSettings() {
        log.info("📊 GET /api/admin/settings");
        
        Map<String, Object> response = new HashMap<>();
        try {
            SystemSettingsResponse settings = settingsService.getSettings();
            
            response.put("success", true);
            response.put("data", settings);
            response.put("message", "Settings retrieved successfully");
            
            log.info("✅ Settings retrieved: {}", settings.getAppName());
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("❌ Error fetching settings: {}", e.getMessage());
            response.put("success", false);
            response.put("error", e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }

    @PutMapping
    @Operation(summary = "Update all system settings")
    public ResponseEntity<Map<String, Object>> updateSettings(
            @Valid @RequestBody SystemSettingsRequest request) {
        
        log.info("📤 PUT /api/admin/settings");
        log.info("📤 Request body: {}", request);
        
        Map<String, Object> response = new HashMap<>();
        try {
            String updatedBy = getCurrentUsername();
            SystemSettingsResponse updatedSettings = settingsService.updateSettings(request, updatedBy);
            
            response.put("success", true);
            response.put("data", updatedSettings);
            response.put("message", "Settings updated successfully");
            
            log.info("✅ Settings updated successfully by: {}", updatedBy);
            log.info("✅ Updated settings: {}", updatedSettings);
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("❌ Error updating settings: {}", e.getMessage());
            e.printStackTrace();
            response.put("success", false);
            response.put("error", e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }

    @GetMapping("/{key}")
    @Operation(summary = "Get specific setting by key")
    public ResponseEntity<Map<String, Object>> getSetting(@PathVariable String key) {
        log.info("📊 GET /api/admin/settings/{}", key);
        
        Map<String, Object> response = new HashMap<>();
        try {
            String value = settingsService.getSettingValue(key);
            
            response.put("success", true);
            response.put("data", Map.of("key", key, "value", value));
            response.put("message", "Setting retrieved successfully");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("❌ Error fetching setting: {}", e.getMessage());
            response.put("success", false);
            response.put("error", e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }

    @PutMapping("/{key}")
    @Operation(summary = "Update specific setting")
    public ResponseEntity<Map<String, Object>> updateSetting(
            @PathVariable String key,
            @RequestBody Map<String, String> request) {
        
        log.info("📤 PUT /api/admin/settings/{}", key);
        
        Map<String, Object> response = new HashMap<>();
        try {
            String value = request.get("value");
            String updatedBy = getCurrentUsername();
            
            settingsService.updateSetting(key, value, updatedBy);
            
            response.put("success", true);
            response.put("data", Map.of("key", key, "value", value));
            response.put("message", "Setting updated successfully");
            
            log.info("✅ Setting {} updated successfully", key);
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("❌ Error updating setting: {}", e.getMessage());
            response.put("success", false);
            response.put("error", e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }

    @PostMapping("/reset")
    @Operation(summary = "Reset settings to defaults")
    public ResponseEntity<Map<String, Object>> resetSettings() {
        log.info("🔄 POST /api/admin/settings/reset");
        
        Map<String, Object> response = new HashMap<>();
        try {
            String updatedBy = getCurrentUsername();
            settingsService.resetToDefaults(updatedBy);
            
            response.put("success", true);
            response.put("message", "Settings reset to defaults successfully");
            
            log.info("✅ Settings reset by: {}", updatedBy);
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("❌ Error resetting settings: {}", e.getMessage());
            response.put("success", false);
            response.put("error", e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }

    private String getCurrentUsername() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()) {
            return authentication.getName();
        }
        return "system";
    }
}