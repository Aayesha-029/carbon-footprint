package com.ecotrack.carbon.service;

import com.ecotrack.carbon.dto.response.AnalyticsResponse;
import com.ecotrack.carbon.entity.ActivityLog;
import com.ecotrack.carbon.entity.User;
import com.ecotrack.carbon.repository.ActivityLogRepository;
import com.ecotrack.carbon.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final ActivityLogRepository activityLogRepository;
    private final UserRepository userRepository;

    private static final Map<String, String> CATEGORY_COLORS = new HashMap<>();
    static {
        CATEGORY_COLORS.put("Transport", "#22c55e");
        CATEGORY_COLORS.put("Electricity", "#3b82f6");
        CATEGORY_COLORS.put("Food", "#f59e0b");
        CATEGORY_COLORS.put("Shopping", "#8b5cf6");
    }

    public AnalyticsResponse getAnalytics(Long userId, LocalDate startDate, LocalDate endDate) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<ActivityLog> activities = activityLogRepository
                .findByUserIdAndLogDateBetweenOrderByLogDateDesc(userId, startDate, endDate);

        AnalyticsResponse response = new AnalyticsResponse();
        response.setUserId(userId);
        response.setUserName(user.getFullName());
        response.setStartDate(startDate);
        response.setEndDate(endDate);

        // Total stats
        BigDecimal totalCO2e = activities.stream()
                .map(ActivityLog::getCo2eKg)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        response.setTotalCO2e(totalCO2e.setScale(2, RoundingMode.HALF_UP));
        response.setTotalActivities((long) activities.size());

        long days = endDate.toEpochDay() - startDate.toEpochDay() + 1;
        if (days > 0) {
            response.setAverageDailyCO2e(totalCO2e
                    .divide(BigDecimal.valueOf(days), 4, RoundingMode.HALF_UP)
                    .setScale(2, RoundingMode.HALF_UP));
        }

        // Category breakdown
        Map<String, AnalyticsResponse.CategoryStats> categoryBreakdown = new HashMap<>();
        Map<String, List<ActivityLog>> groupedByCategory = activities.stream()
                .collect(Collectors.groupingBy(ActivityLog::getCategory));

        for (Map.Entry<String, List<ActivityLog>> entry : groupedByCategory.entrySet()) {
            AnalyticsResponse.CategoryStats stats = new AnalyticsResponse.CategoryStats();
            String category = entry.getKey();
            List<ActivityLog> categoryActivities = entry.getValue();

            BigDecimal categoryTotal = categoryActivities.stream()
                    .map(ActivityLog::getCo2eKg)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            stats.setTotalCO2e(categoryTotal.setScale(2, RoundingMode.HALF_UP));
            stats.setCount((long) categoryActivities.size());
            stats.setColor(CATEGORY_COLORS.getOrDefault(category, "#64748b"));

            if (!categoryActivities.isEmpty()) {
                stats.setAveragePerActivity(categoryTotal
                        .divide(BigDecimal.valueOf(categoryActivities.size()), 4, RoundingMode.HALF_UP)
                        .setScale(2, RoundingMode.HALF_UP));
            }

            categoryBreakdown.put(category, stats);
        }
        response.setCategoryBreakdown(categoryBreakdown);

        // Time series data (daily)
        List<AnalyticsResponse.TimeSeriesData> trendData = new ArrayList<>();
        LocalDate current = startDate;
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MMM dd");

        while (!current.isAfter(endDate)) {
            AnalyticsResponse.TimeSeriesData data = new AnalyticsResponse.TimeSeriesData();
            data.setPeriod(current.format(formatter));

            LocalDate finalCurrent = current;
            List<ActivityLog> dayActivities = activities.stream()
                    .filter(a -> a.getLogDate().equals(finalCurrent))
                    .collect(Collectors.toList());

            BigDecimal dayTotal = dayActivities.stream()
                    .map(ActivityLog::getCo2eKg)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            data.setTotalCO2e(dayTotal.setScale(2, RoundingMode.HALF_UP));
            data.setActivityCount((long) dayActivities.size());

            Map<String, BigDecimal> categoryTotals = new HashMap<>();
            for (String category : CATEGORY_COLORS.keySet()) {
                BigDecimal catTotal = dayActivities.stream()
                        .filter(a -> category.equals(a.getCategory()))
                        .map(ActivityLog::getCo2eKg)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);
                if (catTotal.compareTo(BigDecimal.ZERO) > 0) {
                    categoryTotals.put(category, catTotal.setScale(2, RoundingMode.HALF_UP));
                }
            }
            data.setCategories(categoryTotals);

            trendData.add(data);
            current = current.plusDays(1);
        }

        response.setTrendData(trendData);
        return response;
    }

    public List<AnalyticsResponse.TimeSeriesData> getWeeklyData(Long userId) {
        LocalDate endDate = LocalDate.now();
        LocalDate startDate = endDate.minusDays(7);
        return getAnalytics(userId, startDate, endDate).getTrendData();
    }

    public List<AnalyticsResponse.TimeSeriesData> getMonthlyData(Long userId) {
        LocalDate endDate = LocalDate.now();
        LocalDate startDate = endDate.minusMonths(1);
        return getAnalytics(userId, startDate, endDate).getTrendData();
    }
}