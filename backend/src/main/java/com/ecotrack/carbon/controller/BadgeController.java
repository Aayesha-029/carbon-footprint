package com.ecotrack.carbon.controller;

import com.ecotrack.carbon.dto.request.BadgeRequest;
import com.ecotrack.carbon.dto.response.BadgeResponse;
import com.ecotrack.carbon.security.JwtUtil;
import com.ecotrack.carbon.service.BadgeService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/badges")
@RequiredArgsConstructor
public class BadgeController {

    private final BadgeService badgeService;
    private final JwtUtil jwtUtil;

    @PostMapping("/assign")
    public Map<String, Object> assignBadge(
            @RequestBody BadgeRequest request,
            @RequestHeader(value = "Authorization", required = true) String authHeader) {
        Map<String, Object> response = new HashMap<>();
        try {
            // Extract and validate admin user from token
            Long adminUserId = extractUserIdFromToken(authHeader);
            if (adminUserId == null) {
                response.put("success", false);
                response.put("error", "Unauthorized - Invalid token");
                return response;
            }

            // Check if user is admin (you may want to add admin role check)
            String role = extractRoleFromToken(authHeader);
            if (!"ADMIN".equals(role)) {
                response.put("success", false);
                response.put("error", "Unauthorized - Admin access required");
                return response;
            }

            BadgeResponse badge = badgeService.assignBadge(request.getUserId(), request.getBadgeType());
            response.put("success", true);
            response.put("badge", badge);
            response.put("message", "Badge assigned successfully");
        } catch (Exception e) {
            response.put("success", false);
            response.put("error", e.getMessage());
        }
        return response;
    }

    @GetMapping("/user/{userId}")
    public List<BadgeResponse> getUserBadges(
            @PathVariable Long userId,
            @RequestHeader("Authorization") String authHeader) {
        Long requestingUserId = extractUserIdFromToken(authHeader);
        String role = extractRoleFromToken(authHeader);
        
        // Allow users to view their own badges or admin to view any
        if (!userId.equals(requestingUserId) && !"ADMIN".equals(role)) {
            throw new RuntimeException("You can only view your own badges");
        }
        return badgeService.getUserBadges(userId);
    }

    @GetMapping("/user/{userId}/progress")
    public Map<String, Object> getBadgeProgress(
            @PathVariable Long userId,
            @RequestHeader("Authorization") String authHeader) {
        Long requestingUserId = extractUserIdFromToken(authHeader);
        String role = extractRoleFromToken(authHeader);
        
        if (!userId.equals(requestingUserId) && !"ADMIN".equals(role)) {
            throw new RuntimeException("You can only view your own badge progress");
        }
        return badgeService.getBadgeProgress(userId);
    }

    @PostMapping("/check/{userId}")
    public Map<String, Object> checkAndAwardBadges(
            @PathVariable Long userId,
            @RequestHeader("Authorization") String authHeader) {
        Map<String, Object> response = new HashMap<>();
        try {
            Long requestingUserId = extractUserIdFromToken(authHeader);
            String role = extractRoleFromToken(authHeader);
            
            if (!userId.equals(requestingUserId) && !"ADMIN".equals(role)) {
                response.put("success", false);
                response.put("error", "Unauthorized");
                return response;
            }
            List<BadgeResponse> awarded = badgeService.checkAndAwardBadges(userId);
            response.put("success", true);
            response.put("awarded", awarded);
            response.put("message", awarded.isEmpty() ? "No new badges" : "New badges awarded!");
        } catch (Exception e) {
            response.put("success", false);
            response.put("error", e.getMessage());
        }
        return response;
    }

    @DeleteMapping("/{id}/user/{userId}")
    public Map<String, Object> deleteBadge(
            @PathVariable Long id,
            @PathVariable Long userId,
            @RequestHeader("Authorization") String authHeader) {
        Map<String, Object> response = new HashMap<>();
        try {
            Long requestingUserId = extractUserIdFromToken(authHeader);
            String role = extractRoleFromToken(authHeader);
            
            // Only admin can delete badges
            if (!"ADMIN".equals(role)) {
                response.put("success", false);
                response.put("error", "Unauthorized - Admin access required");
                return response;
            }
            
            badgeService.deleteBadge(id, userId);
            response.put("success", true);
            response.put("message", "Badge deleted successfully");
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