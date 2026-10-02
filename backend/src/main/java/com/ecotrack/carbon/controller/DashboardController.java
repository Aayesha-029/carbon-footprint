package com.ecotrack.carbon.controller;

import com.ecotrack.carbon.dto.response.DashboardStatsResponse;
import com.ecotrack.carbon.security.JwtUtil;
import com.ecotrack.carbon.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;
    private final JwtUtil jwtUtil;

    @GetMapping
    public Map<String, Object> getDashboard(@RequestHeader("Authorization") String authHeader) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                response.put("success", false);
                response.put("error", "Unauthorized");
                return response;
            }

            String token = authHeader.substring(7);
            Long userId = jwtUtil.extractUserId(token);

            DashboardStatsResponse dashboardData = dashboardService.getDashboardStats(userId);
            
            response.put("success", true);
            response.put("data", dashboardData);

        } catch (Exception e) {
            System.err.println("❌ Dashboard error: " + e.getMessage());
            e.printStackTrace();
            response.put("success", false);
            response.put("error", e.getMessage());
        }

        return response;
    }
}