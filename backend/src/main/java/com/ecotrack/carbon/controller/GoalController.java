package com.ecotrack.carbon.controller;

import com.ecotrack.carbon.dto.request.GoalRequest;
import com.ecotrack.carbon.dto.response.GoalResponse;
import com.ecotrack.carbon.security.JwtUtil;
import com.ecotrack.carbon.service.GoalService;
import com.ecotrack.carbon.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/goals")
@RequiredArgsConstructor
@Slf4j
public class GoalController {

    private final GoalService goalService;
    private final JwtUtil jwtUtil;
    private final NotificationService notificationService;
    private final UserDetailsService userDetailsService;

    // ===== Helper: extract userId with fallback authentication =====
    private Long extractUserIdFromToken(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            log.error("❌ No Bearer token in request header");
            throw new RuntimeException("Unauthorized: no token");
        }
        String token = authHeader.substring(7);
        try {
            // If authentication is not set, manually validate and set it
            if (SecurityContextHolder.getContext().getAuthentication() == null) {
                String username = jwtUtil.extractUsername(token);
                if (username != null && jwtUtil.validateToken(token)) {
                    UserDetails userDetails = userDetailsService.loadUserByUsername(username);
                    UsernamePasswordAuthenticationToken auth =
                            new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
                    SecurityContextHolder.getContext().setAuthentication(auth);
                    log.info("✅ Authentication manually set in GoalController for user: {}", username);
                } else {
                    throw new RuntimeException("Invalid token");
                }
            }
            Long userId = jwtUtil.extractUserId(token);
            log.info("✅ Extracted userId: {}", userId);
            return userId;
        } catch (Exception e) {
            log.error("❌ Failed to extract userId from token: {}", e.getMessage());
            throw new RuntimeException("Unauthorized: invalid token");
        }
    }

    @PostMapping
    public Map<String, Object> createGoal(
            @RequestBody GoalRequest request,
            @RequestHeader("Authorization") String authHeader) {
        Map<String, Object> response = new HashMap<>();
        try {
            Long userId = extractUserIdFromToken(authHeader);
            if (!userId.equals(request.getUserId())) {
                response.put("success", false);
                response.put("error", "Unauthorized");
                return response;
            }
            GoalResponse goal = goalService.createGoal(request);
            notificationService.notifyGoalCreated(userId, goal.getGoalName(), goal.getTargetCO2().doubleValue());
            response.put("success", true);
            response.put("goal", goal);
            response.put("message", "Goal created successfully");
        } catch (Exception e) {
            log.error("Error in createGoal: {}", e.getMessage());
            response.put("success", false);
            response.put("error", e.getMessage());
        }
        return response;
    }

    @GetMapping("/user/{userId}")
    public List<GoalResponse> getUserGoals(
            @PathVariable Long userId,
            @RequestHeader("Authorization") String authHeader) {
        log.info("📥 GET /api/goals/user/{} called", userId);
        Long requestingUserId = extractUserIdFromToken(authHeader);
        if (!userId.equals(requestingUserId)) {
            log.warn("❌ User {} tried to access goals of user {}", requestingUserId, userId);
            throw new RuntimeException("You can only view your own goals");
        }
        List<GoalResponse> goals = goalService.getUserGoals(userId);
        log.info("✅ Returning {} goals for user {}", goals.size(), userId);
        return goals;
    }

    @GetMapping("/{id}")
    public GoalResponse getGoal(@PathVariable Long id) {
        return goalService.getGoal(id);
    }

    @PutMapping("/{id}")
    public Map<String, Object> updateGoal(
            @PathVariable Long id,
            @RequestBody GoalRequest request,
            @RequestHeader("Authorization") String authHeader) {
        Map<String, Object> response = new HashMap<>();
        try {
            Long userId = extractUserIdFromToken(authHeader);
            if (!userId.equals(request.getUserId())) {
                response.put("success", false);
                response.put("error", "Unauthorized");
                return response;
            }
            GoalResponse goal = goalService.updateGoal(id, request);
            response.put("success", true);
            response.put("goal", goal);
            response.put("message", "Goal updated successfully");
        } catch (Exception e) {
            log.error("Error in updateGoal: {}", e.getMessage());
            response.put("success", false);
            response.put("error", e.getMessage());
        }
        return response;
    }

    @DeleteMapping("/{id}/user/{userId}")
    public Map<String, Object> deleteGoal(
            @PathVariable Long id,
            @PathVariable Long userId,
            @RequestHeader("Authorization") String authHeader) {
        Map<String, Object> response = new HashMap<>();
        try {
            Long requestingUserId = extractUserIdFromToken(authHeader);
            if (!userId.equals(requestingUserId)) {
                response.put("success", false);
                response.put("error", "Unauthorized");
                return response;
            }
            GoalResponse goal = goalService.getGoal(id);
            String goalName = goal.getGoalName();
            goalService.deleteGoal(id, userId);
            notificationService.notifyGoalDeleted(userId, goalName);
            response.put("success", true);
            response.put("message", "Goal deleted successfully");
        } catch (Exception e) {
            log.error("Error in deleteGoal: {}", e.getMessage());
            response.put("success", false);
            response.put("error", e.getMessage());
        }
        return response;
    }

    @PostMapping("/{id}/recalculate")
    public Map<String, Object> recalculateGoal(
            @PathVariable Long id,
            @RequestHeader("Authorization") String authHeader) {
        Map<String, Object> response = new HashMap<>();
        try {
            GoalResponse goal = goalService.calculateAndUpdateProgress(id);
            if ("COMPLETED".equals(goal.getStatus())) {
                notificationService.notifyGoalCompleted(goal.getUserId(), goal.getGoalName());
            }
            response.put("success", true);
            response.put("goal", goal);
            response.put("message", "Goal progress recalculated");
        } catch (Exception e) {
            log.error("Error in recalculateGoal: {}", e.getMessage());
            response.put("success", false);
            response.put("error", e.getMessage());
        }
        return response;
    }

    @PostMapping("/user/{userId}/recalculate-all")
    public Map<String, Object> recalculateAllGoals(
            @PathVariable Long userId,
            @RequestHeader("Authorization") String authHeader) {
        Map<String, Object> response = new HashMap<>();
        try {
            Long requestingUserId = extractUserIdFromToken(authHeader);
            if (!userId.equals(requestingUserId)) {
                response.put("success", false);
                response.put("error", "Unauthorized");
                return response;
            }
            goalService.recalculateAllGoals(userId);
            response.put("success", true);
            response.put("message", "All goals recalculated successfully");
        } catch (Exception e) {
            log.error("Error in recalculateAllGoals: {}", e.getMessage());
            response.put("success", false);
            response.put("error", e.getMessage());
        }
        return response;
    }

    @GetMapping("/categories")
    public Map<String, Object> getValidCategories() {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("categories", goalService.getValidCategories());
        return response;
    }
}