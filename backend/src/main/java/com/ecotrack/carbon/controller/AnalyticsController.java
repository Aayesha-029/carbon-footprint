package com.ecotrack.carbon.controller;

import com.ecotrack.carbon.dto.response.AnalyticsResponse;
import com.ecotrack.carbon.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping("/user/{userId}")
    public AnalyticsResponse getAnalytics(
            @PathVariable Long userId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return analyticsService.getAnalytics(userId, startDate, endDate);
    }

    @GetMapping("/user/{userId}/weekly")
    public List<AnalyticsResponse.TimeSeriesData> getWeeklyAnalytics(@PathVariable Long userId) {
        return analyticsService.getWeeklyData(userId);
    }

    @GetMapping("/user/{userId}/monthly")
    public List<AnalyticsResponse.TimeSeriesData> getMonthlyAnalytics(@PathVariable Long userId) {
        return analyticsService.getMonthlyData(userId);
    }
}