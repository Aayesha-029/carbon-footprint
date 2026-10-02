package com.ecotrack.carbon.controller;

import com.ecotrack.carbon.dto.response.LeaderboardEntry;
import com.ecotrack.carbon.security.JwtUtil;
import com.ecotrack.carbon.service.LeaderboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/leaderboard")
@RequiredArgsConstructor
public class LeaderboardController {

    private final LeaderboardService leaderboardService;
    private final JwtUtil jwtUtil;

    @GetMapping
    public List<LeaderboardEntry> getLeaderboard(
            @RequestParam(defaultValue = "all") String timeRange) {
        return leaderboardService.getLeaderboard(timeRange);
    }

    @GetMapping("/user/{userId}")
    public Map<String, Object> getUserRanking(
            @PathVariable Long userId,
            @RequestHeader("Authorization") String authHeader) {
        Long requestingUserId = extractUserIdFromToken(authHeader);
        if (!userId.equals(requestingUserId)) {
            throw new RuntimeException("You can only view your own ranking");
        }
        return leaderboardService.getUserRanking(userId);
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