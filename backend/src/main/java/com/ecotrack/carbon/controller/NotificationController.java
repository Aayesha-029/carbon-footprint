package com.ecotrack.carbon.controller;

import com.ecotrack.carbon.dto.response.NotificationResponse;
import com.ecotrack.carbon.security.JwtUtil;
import com.ecotrack.carbon.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final JwtUtil jwtUtil;

    @GetMapping("/user/{userId}")
    public List<NotificationResponse> getUserNotifications(
            @PathVariable Long userId,
            @RequestHeader("Authorization") String authHeader) {
        Long requestingUserId = extractUserIdFromToken(authHeader);
        if (!userId.equals(requestingUserId)) {
            throw new RuntimeException("You can only view your own notifications");
        }
        return notificationService.getUserNotifications(userId);
    }

    @GetMapping("/user/{userId}/unread")
    public List<NotificationResponse> getUnreadNotifications(
            @PathVariable Long userId,
            @RequestHeader("Authorization") String authHeader) {
        Long requestingUserId = extractUserIdFromToken(authHeader);
        if (!userId.equals(requestingUserId)) {
            throw new RuntimeException("You can only view your own notifications");
        }
        return notificationService.getUnreadNotifications(userId);
    }

    @GetMapping("/user/{userId}/count")
    public Map<String, Object> getUnreadCount(
            @PathVariable Long userId,
            @RequestHeader("Authorization") String authHeader) {
        Map<String, Object> response = new HashMap<>();
        Long requestingUserId = extractUserIdFromToken(authHeader);
        if (!userId.equals(requestingUserId)) {
            response.put("error", "Unauthorized");
            return response;
        }
        response.put("count", notificationService.getUnreadCount(userId));
        return response;
    }

    @PostMapping("/user/{userId}/mark-all-read")
    public Map<String, Object> markAllAsRead(
            @PathVariable Long userId,
            @RequestHeader("Authorization") String authHeader) {
        Map<String, Object> response = new HashMap<>();
        Long requestingUserId = extractUserIdFromToken(authHeader);
        if (!userId.equals(requestingUserId)) {
            response.put("success", false);
            response.put("error", "Unauthorized");
            return response;
        }
        notificationService.markAllAsRead(userId);
        response.put("success", true);
        response.put("message", "All notifications marked as read");
        return response;
    }

    @DeleteMapping("/user/{userId}")
    public Map<String, Object> deleteAllNotifications(
            @PathVariable Long userId,
            @RequestHeader("Authorization") String authHeader) {
        Map<String, Object> response = new HashMap<>();
        Long requestingUserId = extractUserIdFromToken(authHeader);
        if (!userId.equals(requestingUserId)) {
            response.put("success", false);
            response.put("error", "Unauthorized");
            return response;
        }
        notificationService.deleteAllNotifications(userId);
        response.put("success", true);
        response.put("message", "All notifications cleared");
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
}
