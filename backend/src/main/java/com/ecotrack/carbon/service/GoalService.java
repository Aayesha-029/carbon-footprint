package com.ecotrack.carbon.service;

import com.ecotrack.carbon.dto.request.GoalRequest;
import com.ecotrack.carbon.dto.response.GoalResponse;
import com.ecotrack.carbon.entity.ActivityLog;
import com.ecotrack.carbon.entity.Goal;
import com.ecotrack.carbon.entity.User;
import com.ecotrack.carbon.repository.ActivityLogRepository;
import com.ecotrack.carbon.repository.GoalRepository;
import com.ecotrack.carbon.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GoalService {

    private final GoalRepository goalRepository;
    private final UserRepository userRepository;
    private final ActivityLogRepository activityLogRepository;

    private static final List<String> VALID_CATEGORIES = List.of(
        "Transport", "Transportation", "Electricity", "Food", "Waste", "Shopping", "Water", "Overall"
    );

    @Transactional
    public GoalResponse createGoal(GoalRequest request) {
        // Validate user
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Validate category
        if (!VALID_CATEGORIES.contains(request.getCategory())) {
            throw new RuntimeException("Invalid category. Valid categories: " + String.join(", ", VALID_CATEGORIES));
        }

        // Validate dates
        if (request.getStartDate().isAfter(request.getEndDate())) {
            throw new RuntimeException("Start date must be before end date");
        }

        if (request.getTargetCO2().compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("Target CO₂ must be greater than 0");
        }

        // Create goal
        Goal goal = new Goal();
        goal.setUser(user);
        goal.setGoalName(request.getGoalName());
        goal.setCategory(request.getCategory());
        goal.setTargetCO2(request.getTargetCO2());
        goal.setStartDate(request.getStartDate());
        goal.setEndDate(request.getEndDate());
        goal.setCurrentCO2(BigDecimal.ZERO);
        goal.setStatus("NOT_STARTED");
        goal.setProgressPercentage(BigDecimal.ZERO);
        goal.setCreatedAt(LocalDateTime.now());
        goal.setUpdatedAt(LocalDateTime.now());

        Goal saved = goalRepository.save(goal);
        
        // Calculate initial progress
        return calculateAndUpdateProgress(saved.getId());
    }

    public List<GoalResponse> getUserGoals(Long userId) {
        return goalRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public GoalResponse getGoal(Long id) {
        Goal goal = goalRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Goal not found"));
        return calculateAndUpdateProgress(id);
    }

    @Transactional
    public GoalResponse updateGoal(Long id, GoalRequest request) {
        Goal goal = goalRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Goal not found"));

        // Validate user
        if (!goal.getUser().getId().equals(request.getUserId())) {
            throw new RuntimeException("You can only update your own goals");
        }

        // Validate category
        if (!VALID_CATEGORIES.contains(request.getCategory())) {
            throw new RuntimeException("Invalid category. Valid categories: " + String.join(", ", VALID_CATEGORIES));
        }

        // Validate dates
        if (request.getStartDate().isAfter(request.getEndDate())) {
            throw new RuntimeException("Start date must be before end date");
        }

        if (request.getTargetCO2().compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("Target CO₂ must be greater than 0");
        }

        goal.setGoalName(request.getGoalName());
        goal.setCategory(request.getCategory());
        goal.setTargetCO2(request.getTargetCO2());
        goal.setStartDate(request.getStartDate());
        goal.setEndDate(request.getEndDate());
        goal.setUpdatedAt(LocalDateTime.now());

        Goal updated = goalRepository.save(goal);
        return calculateAndUpdateProgress(updated.getId());
    }

    @Transactional
    public void deleteGoal(Long id, Long userId) {
        Goal goal = goalRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Goal not found"));
        
        if (!goal.getUser().getId().equals(userId)) {
            throw new RuntimeException("You can only delete your own goals");
        }
        
        goalRepository.delete(goal);
    }

    @Transactional
    public GoalResponse calculateAndUpdateProgress(Long goalId) {
        Goal goal = goalRepository.findById(goalId)
                .orElseThrow(() -> new RuntimeException("Goal not found"));

        LocalDate today = LocalDate.now();
        BigDecimal currentCO2 = BigDecimal.ZERO;

        System.out.println("📊 Calculating progress for goal: " + goal.getId() + " - " + goal.getGoalName());
        System.out.println("📊 Category: " + goal.getCategory() + ", Date Range: " + goal.getStartDate() + " to " + goal.getEndDate());

        // Calculate current CO₂ based on category
        if ("Overall".equals(goal.getCategory())) {
            // For Overall, sum all activities within date range
            currentCO2 = activityLogRepository.sumCO2ByUserIdAndDateRange(
                    goal.getUser().getId(),
                    goal.getStartDate(),
                    goal.getEndDate()
            );
            System.out.println("📊 Overall CO2: " + currentCO2);
        } else {
            // For specific category, sum only activities in that category
            currentCO2 = activityLogRepository.sumCO2ByUserIdAndCategoryAndDateRange(
                    goal.getUser().getId(),
                    goal.getCategory(),
                    goal.getStartDate(),
                    goal.getEndDate()
            );
            System.out.println("📊 Category CO2: " + currentCO2 + " for category: " + goal.getCategory());
        }

        if (currentCO2 == null) {
            currentCO2 = BigDecimal.ZERO;
        }

        goal.setCurrentCO2(currentCO2.setScale(4, RoundingMode.HALF_UP));

        // Calculate progress percentage
        BigDecimal progress = BigDecimal.ZERO;
        String status = "NOT_STARTED";

        if (goal.getTargetCO2().compareTo(BigDecimal.ZERO) > 0) {
            // Calculate progress: (current / target) * 100, capped at 100%
            progress = currentCO2.divide(goal.getTargetCO2(), 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100))
                    .min(BigDecimal.valueOf(100))
                    .max(BigDecimal.ZERO);
            
            goal.setProgressPercentage(progress.setScale(2, RoundingMode.HALF_UP));
        }

        // Determine status based on progress and dates
        if (today.isBefore(goal.getStartDate())) {
            status = "NOT_STARTED";
        } else if (today.isAfter(goal.getEndDate())) {
            if (currentCO2.compareTo(goal.getTargetCO2()) <= 0) {
                status = "COMPLETED";
            } else {
                status = "FAILED";
            }
        } else {
            // Within date range
            if (currentCO2.compareTo(BigDecimal.ZERO) == 0) {
                status = "NOT_STARTED";
            } else if (currentCO2.compareTo(goal.getTargetCO2()) >= 0) {
                status = "COMPLETED";
            } else {
                status = "IN_PROGRESS";
            }
        }

        goal.setStatus(status);
        goal.setUpdatedAt(LocalDateTime.now());

        System.out.println("📊 Goal progress: " + progress + "%, Status: " + status);
        System.out.println("📊 Current CO2: " + currentCO2 + ", Target: " + goal.getTargetCO2());

        Goal updated = goalRepository.save(goal);
        return toResponse(updated);
    }

    @Transactional
    public void recalculateAllGoals(Long userId) {
        System.out.println("📊 Recalculating all goals for user: " + userId);
        List<Goal> goals = goalRepository.findByUserIdOrderByCreatedAtDesc(userId);
        for (Goal goal : goals) {
            calculateAndUpdateProgress(goal.getId());
        }
        System.out.println("📊 Recalculated " + goals.size() + " goals");
    }

    private GoalResponse toResponse(Goal goal) {
        GoalResponse response = new GoalResponse();
        response.setId(goal.getId());
        response.setUserId(goal.getUser().getId());
        response.setUserName(goal.getUser().getFullName());
        response.setGoalName(goal.getGoalName());
        response.setCategory(goal.getCategory());
        response.setTargetCO2(goal.getTargetCO2().setScale(2, RoundingMode.HALF_UP));
        response.setCurrentCO2(goal.getCurrentCO2().setScale(2, RoundingMode.HALF_UP));
        
        // Calculate remaining
        BigDecimal remaining = goal.getTargetCO2().subtract(goal.getCurrentCO2());
        response.setRemainingCO2(remaining.max(BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP));
        
        response.setStartDate(goal.getStartDate());
        response.setEndDate(goal.getEndDate());
        response.setStatus(goal.getStatus());
        response.setProgressPercentage(goal.getProgressPercentage().setScale(2, RoundingMode.HALF_UP));
        response.setCreatedAt(goal.getCreatedAt());
        response.setUpdatedAt(goal.getUpdatedAt());

        // Status message and color
        switch (goal.getStatus()) {
            case "NOT_STARTED":
                response.setStatusMessage("Goal not started yet. Start logging activities!");
                response.setStatusColor("#94a3b8");
                break;
            case "IN_PROGRESS":
                response.setStatusMessage("💪 Keep going! You're making progress!");
                response.setStatusColor("#3b82f6");
                break;
            case "COMPLETED":
                response.setStatusMessage("🎉 Goal achieved! Congratulations!");
                response.setStatusColor("#22c55e");
                break;
            case "FAILED":
                response.setStatusMessage("⏰ Goal not achieved within timeframe. Try again!");
                response.setStatusColor("#ef4444");
                break;
            default:
                response.setStatusMessage("Unknown status");
                response.setStatusColor("#64748b");
        }

        return response;
    }

    public List<String> getValidCategories() {
        return VALID_CATEGORIES;
    }
}