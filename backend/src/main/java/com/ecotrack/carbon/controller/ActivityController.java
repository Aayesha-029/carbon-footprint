package com.ecotrack.carbon.controller;

import com.ecotrack.carbon.entity.ActivityLog;
import com.ecotrack.carbon.entity.User;
import com.ecotrack.carbon.repository.ActivityLogRepository;
import com.ecotrack.carbon.repository.UserRepository;
import com.ecotrack.carbon.security.JwtUtil;
import com.ecotrack.carbon.service.EmissionCalculationService;
import com.ecotrack.carbon.service.GoalService;
import com.ecotrack.carbon.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/activities")
@RequiredArgsConstructor
public class ActivityController {

    private final ActivityLogRepository activityLogRepository;
    private final UserRepository userRepository;
    private final EmissionCalculationService emissionCalculationService;
    private final JwtUtil jwtUtil;
    private final NotificationService notificationService;
    private final GoalService goalService;

    @PostMapping
    @Transactional
    public Map<String, Object> logActivity(
            @RequestBody Map<String, Object> request,
            @RequestHeader("Authorization") String authHeader) {
        Map<String, Object> response = new HashMap<>();

        try {
            // Extract user from token
            Long userId = extractUserIdFromToken(authHeader);
            if (userId == null) {
                response.put("success", false);
                response.put("error", "Unauthorized");
                return response;
            }

            String category = request.get("category").toString();
            String activityType = request.get("activityType").toString();
            BigDecimal quantity = new BigDecimal(request.get("quantity").toString());
            String unit = request.get("unit").toString();
            String notes = request.get("notes") != null ? request.get("notes").toString() : null;

            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            LocalDate logDate = LocalDate.now();
            if (request.get("date") != null) {
                logDate = LocalDate.parse(request.get("date").toString());
            }

            // Calculate CO₂e using emission factors
            BigDecimal co2eKg = emissionCalculationService.calculateCo2e(category, activityType, unit, quantity, logDate);

            ActivityLog log = new ActivityLog();
            log.setUser(user);
            log.setCategory(category);
            log.setActivityType(activityType);
            log.setQuantity(quantity);
            log.setUnit(unit);
            log.setLogDate(logDate);
            log.setCo2eKg(co2eKg);
            log.setNotes(notes);
            log.setCreatedAt(LocalDateTime.now());
            log.setUpdatedAt(LocalDateTime.now());

            ActivityLog savedLog = activityLogRepository.save(log);

            // Send notification
            notificationService.notifyActivityLogged(
                    userId,
                    activityType,
                    co2eKg.doubleValue()
            );

            // Recalculate all goals for this user (update progress based on new activity)
            try {
                goalService.recalculateAllGoals(userId);
                System.out.println("✅ Goals recalculated after activity log");
            } catch (Exception e) {
                System.err.println("⚠️ Error recalculating goals: " + e.getMessage());
            }

            response.put("success", true);
            response.put("message", "Activity logged successfully");
            response.put("co2eKg", co2eKg);
            response.put("id", savedLog.getId());
            response.put("logDate", logDate.toString());

        } catch (Exception e) {
            System.err.println("❌ Error logging activity: " + e.getMessage());
            e.printStackTrace();
            response.put("success", false);
            response.put("error", e.getMessage());
        }

        return response;
    }

    @GetMapping("/user/{userId}")
    public List<ActivityLog> getUserActivities(
            @PathVariable Long userId,
            @RequestHeader("Authorization") String authHeader) {
        
        Long requestingUserId = extractUserIdFromToken(authHeader);
        String role = extractRoleFromToken(authHeader);
        
        // Allow admins to view any user's activities, or users to view their own
        if (!userId.equals(requestingUserId) && !"ADMIN".equals(role)) {
            throw new RuntimeException("You can only view your own activities");
        }
        return activityLogRepository.findByUserIdOrderByLogDateDesc(userId);
    }

    @GetMapping("/user/{userId}/date-range")
    public List<ActivityLog> getUserActivitiesByDateRange(
            @PathVariable Long userId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestHeader("Authorization") String authHeader) {
        
        Long requestingUserId = extractUserIdFromToken(authHeader);
        String role = extractRoleFromToken(authHeader);
        
        if (!userId.equals(requestingUserId) && !"ADMIN".equals(role)) {
            throw new RuntimeException("You can only view your own activities");
        }
        return activityLogRepository.findByUserIdAndLogDateBetweenOrderByLogDateDesc(userId, startDate, endDate);
    }

    @DeleteMapping("/{id}/user/{userId}")
    @Transactional
    public Map<String, Object> deleteActivity(
            @PathVariable Long id,
            @PathVariable Long userId,
            @RequestHeader("Authorization") String authHeader) {
        Map<String, Object> response = new HashMap<>();
        try {
            Long requestingUserId = extractUserIdFromToken(authHeader);
            String role = extractRoleFromToken(authHeader);
            
            if (!userId.equals(requestingUserId) && !"ADMIN".equals(role)) {
                response.put("success", false);
                response.put("error", "You can only delete your own activities");
                return response;
            }
            
            // Check if activity exists
            ActivityLog activity = activityLogRepository.findById(id).orElse(null);
            if (activity == null) {
                response.put("success", false);
                response.put("error", "Activity not found");
                return response;
            }
            
            // Check if activity belongs to the user
            if (!activity.getUser().getId().equals(userId) && !"ADMIN".equals(role)) {
                response.put("success", false);
                response.put("error", "You can only delete your own activities");
                return response;
            }
            
            // Store activity type for notification before deletion
            String activityType = activity.getActivityType();
            
            // Delete the activity
            activityLogRepository.delete(activity);
            System.out.println("✅ Activity deleted successfully: " + id);
            
            // Send notification
            notificationService.notifyActivityDeleted(
                    userId,
                    activityType
            );

            // Recalculate all goals for this user (update progress after deletion)
            try {
                goalService.recalculateAllGoals(userId);
                System.out.println("✅ Goals recalculated after activity deletion");
            } catch (Exception e) {
                System.err.println("⚠️ Error recalculating goals: " + e.getMessage());
            }
            
            response.put("success", true);
            response.put("message", "Activity deleted successfully");
            
        } catch (Exception e) {
            System.err.println("❌ Error deleting activity: " + e.getMessage());
            e.printStackTrace();
            response.put("success", false);
            response.put("error", e.getMessage());
        }
        return response;
    }

    @GetMapping("/user/{userId}/summary")
    public Map<String, Object> getUserSummary(
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
            
            List<ActivityLog> activities = activityLogRepository.findByUserIdOrderByLogDateDesc(userId);
            
            // Total CO2e
            BigDecimal totalCO2e = activities.stream()
                    .map(ActivityLog::getCo2eKg)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            
            // Category breakdown
            Map<String, BigDecimal> categoryBreakdown = new HashMap<>();
            for (ActivityLog log : activities) {
                categoryBreakdown.merge(log.getCategory(), log.getCo2eKg(), BigDecimal::add);
            }
            
            response.put("success", true);
            response.put("totalActivities", activities.size());
            response.put("totalCO2e", totalCO2e);
            response.put("categoryBreakdown", categoryBreakdown);
            
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