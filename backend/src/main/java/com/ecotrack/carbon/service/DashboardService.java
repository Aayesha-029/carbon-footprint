package com.ecotrack.carbon.service;

import com.ecotrack.carbon.dto.response.DashboardStatsResponse;
import com.ecotrack.carbon.entity.ActivityLog;
import com.ecotrack.carbon.entity.User;
import com.ecotrack.carbon.repository.ActivityLogRepository;
import com.ecotrack.carbon.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final ActivityLogRepository activityLogRepository;
    private final UserRepository userRepository;

    private static final Map<String, String> CATEGORY_COLORS = new HashMap<>();
    private static final List<DashboardStatsResponse.QuickTip> DEFAULT_TIPS = Arrays.asList(
        new DashboardStatsResponse.QuickTip() {{ setIcon("🚗"); setTip("Use public transport 2 days per week"); }},
        new DashboardStatsResponse.QuickTip() {{ setIcon("💡"); setTip("Reduce electricity usage by 10 percent"); }},
        new DashboardStatsResponse.QuickTip() {{ setIcon("🌱"); setTip("Choose plant-based meal options"); }},
        new DashboardStatsResponse.QuickTip() {{ setIcon("🛍️"); setTip("Recycle and minimize waste"); }}
    );

    static {
        CATEGORY_COLORS.put("Transport", "#22c55e");
        CATEGORY_COLORS.put("Electricity", "#3b82f6");
        CATEGORY_COLORS.put("Food", "#f59e0b");
        CATEGORY_COLORS.put("Shopping", "#8b5cf6");
    }

    public DashboardStatsResponse getDashboardStats(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<ActivityLog> allActivities = activityLogRepository.findByUserIdOrderByLogDateDesc(userId);

        DashboardStatsResponse response = new DashboardStatsResponse();

        // 1. User Info
        DashboardStatsResponse.UserInfo userInfo = new DashboardStatsResponse.UserInfo();
        userInfo.setUserId(user.getId());
        userInfo.setFullName(user.getFullName());
        userInfo.setEmail(user.getEmail());
        userInfo.setRole(user.getRole());
        response.setUserInfo(userInfo);

        // 2. Summary Stats
        response.setSummary(calculateSummaryStats(allActivities));

        // 3. Category Breakdown
        response.setCategoryBreakdown(calculateCategoryBreakdown(allActivities));

        // 4. Recent Activities (last 5)
        response.setRecentActivities(allActivities.stream()
                .limit(5)
                .map(this::convertToRecentActivity)
                .collect(Collectors.toList()));

        // 5. Tips
        response.setTips(DEFAULT_TIPS);

        return response;
    }

    private DashboardStatsResponse.SummaryStats calculateSummaryStats(List<ActivityLog> activities) {
        DashboardStatsResponse.SummaryStats stats = new DashboardStatsResponse.SummaryStats();

        // Today's footprint
        LocalDate today = LocalDate.now();
        BigDecimal todayTotal = activities.stream()
                .filter(a -> a.getLogDate().equals(today))
                .map(ActivityLog::getCo2eKg)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        stats.setTodayFootprint(todayTotal.setScale(2, RoundingMode.HALF_UP));

        // Weekly goal progress
        LocalDate weekAgo = today.minusDays(7);
        BigDecimal weekTotal = activities.stream()
                .filter(a -> a.getLogDate().isAfter(weekAgo) || a.getLogDate().equals(weekAgo))
                .map(ActivityLog::getCo2eKg)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        BigDecimal totalCO2 = activities.stream()
                .map(ActivityLog::getCo2eKg)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        if (totalCO2.compareTo(BigDecimal.ZERO) > 0) {
            int progress = weekTotal.divide(totalCO2, 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100))
                    .min(BigDecimal.valueOf(100))
                    .intValue();
            stats.setWeeklyGoalProgress(progress);
        } else {
            stats.setWeeklyGoalProgress(0);
        }

        // Monthly target
        LocalDate monthStart = today.withDayOfMonth(1);
        BigDecimal monthTotal = activities.stream()
                .filter(a -> a.getLogDate().isAfter(monthStart) || a.getLogDate().equals(monthStart))
                .map(ActivityLog::getCo2eKg)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        stats.setMonthlyTarget(monthTotal.setScale(2, RoundingMode.HALF_UP));
        stats.setMonthlyGoal(100);

        // Carbon Score
        int carbonScore = calculateCarbonScore(totalCO2, activities.size());
        stats.setCarbonScore(carbonScore);
        stats.setScoreLabel(getScoreLabel(carbonScore));
        stats.setScoreEmoji(getScoreEmoji(carbonScore));

        return stats;
    }

    private List<DashboardStatsResponse.CategoryData> calculateCategoryBreakdown(List<ActivityLog> activities) {
        List<String> categories = Arrays.asList("Transport", "Electricity", "Food", "Shopping");
        BigDecimal totalCO2 = activities.stream()
                .map(ActivityLog::getCo2eKg)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return categories.stream().map(cat -> {
            BigDecimal catTotal = activities.stream()
                    .filter(a -> cat.equals(a.getCategory()))
                    .map(ActivityLog::getCo2eKg)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            DashboardStatsResponse.CategoryData data = new DashboardStatsResponse.CategoryData();
            data.setName(cat);
            data.setValue(catTotal.setScale(2, RoundingMode.HALF_UP));
            data.setColor(CATEGORY_COLORS.getOrDefault(cat, "#64748b"));
            
            if (totalCO2.compareTo(BigDecimal.ZERO) > 0) {
                int percentage = catTotal.divide(totalCO2, 4, RoundingMode.HALF_UP)
                        .multiply(BigDecimal.valueOf(100))
                        .intValue();
                data.setPercentage(percentage);
            } else {
                data.setPercentage(0);
            }
            return data;
        }).collect(Collectors.toList());
    }

    private DashboardStatsResponse.RecentActivity convertToRecentActivity(ActivityLog log) {
        DashboardStatsResponse.RecentActivity activity = new DashboardStatsResponse.RecentActivity();
        activity.setId(log.getId());
        activity.setCategory(log.getCategory());
        activity.setActivityType(log.getActivityType());
        activity.setCo2eKg(log.getCo2eKg().setScale(2, RoundingMode.HALF_UP));
        activity.setLogDate(log.getLogDate().toString());
        return activity;
    }

    private int calculateCarbonScore(BigDecimal totalCO2, int activityCount) {
        if (activityCount == 0) {
            return 100;
        }
        double score = 100 - (totalCO2.doubleValue() / (activityCount * 0.5));
        return (int) Math.max(0, Math.min(100, Math.round(score)));
    }

    private String getScoreLabel(int score) {
        if (score >= 90) return "Excellent";
        if (score >= 70) return "Good";
        if (score >= 50) return "Fair";
        return "Needs Improvement";
    }

    private String getScoreEmoji(int score) {
        if (score >= 90) return "🌟";
        if (score >= 70) return "⭐";
        if (score >= 50) return "💪";
        return "🌱";
    }
}
