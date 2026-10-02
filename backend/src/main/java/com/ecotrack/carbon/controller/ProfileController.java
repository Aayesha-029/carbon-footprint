package com.ecotrack.carbon.controller;

import com.ecotrack.carbon.dto.request.ProfileUpdateRequest;
import com.ecotrack.carbon.dto.response.ProfileResponse;
import com.ecotrack.carbon.security.JwtUtil;
import com.ecotrack.carbon.service.ProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/profile")
@RequiredArgsConstructor
public class ProfileController {

    private final ProfileService profileService;
    private final JwtUtil jwtUtil;

    @GetMapping("/user/{userId}")
    public ProfileResponse getProfile(
            @PathVariable Long userId,
            @RequestHeader("Authorization") String authHeader) {
        Long requestingUserId = extractUserIdFromToken(authHeader);
        String role = extractRoleFromToken(authHeader);
        
        if (!userId.equals(requestingUserId) && !"ADMIN".equals(role)) {
            throw new RuntimeException("You can only view your own profile");
        }
        return profileService.getProfile(userId);
    }

    @PutMapping("/user/{userId}")
    public ProfileResponse updateProfile(
            @PathVariable Long userId,
            @RequestBody ProfileUpdateRequest request,
            @RequestHeader("Authorization") String authHeader) {
        Long requestingUserId = extractUserIdFromToken(authHeader);
        if (!userId.equals(requestingUserId)) {
            throw new RuntimeException("You can only update your own profile");
        }
        return profileService.updateProfile(userId, request);
    }

    @PostMapping("/user/{userId}/reset")
    public Map<String, Object> resetSettings(
            @PathVariable Long userId,
            @RequestHeader("Authorization") String authHeader) {
        Map<String, Object> response = new HashMap<>();
        Long requestingUserId = extractUserIdFromToken(authHeader);
        if (!userId.equals(requestingUserId)) {
            response.put("success", false);
            response.put("error", "Unauthorized");
            return response;
        }
        
        try {
            // Reset to default settings
            ProfileUpdateRequest resetRequest = new ProfileUpdateRequest();
            resetRequest.setPreferredUnits("METRIC");
            resetRequest.setDietType("OMNIVORE");
            resetRequest.setPrimaryTransportMode("CAR");
            resetRequest.setEnergySource("GRID");
            resetRequest.setNotificationsEnabled(true);
            resetRequest.setTheme("light");
            resetRequest.setLanguage("en");
            
            profileService.updateProfile(userId, resetRequest);
            response.put("success", true);
            response.put("message", "Settings reset to default");
        } catch (Exception e) {
            response.put("success", false);
            response.put("error", e.getMessage());
        }
        return response;
    }

    private Long extractUserIdFromToken(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return null;
        }
        String token = authHeader.substring(7);
        try {
            return jwtUtil.extractUserId(token);
        } catch (Exception e) {
            return null;
        }
    }

    private String extractRoleFromToken(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return null;
        }
        String token = authHeader.substring(7);
        try {
            return jwtUtil.extractRole(token);
        } catch (Exception e) {
            return null;
        }
    }
}