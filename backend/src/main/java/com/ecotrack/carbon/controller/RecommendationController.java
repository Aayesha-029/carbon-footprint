package com.ecotrack.carbon.controller;

import com.ecotrack.carbon.dto.response.RecommendationResponse;
import com.ecotrack.carbon.security.JwtUtil;
import com.ecotrack.carbon.service.RecommendationService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/recommendations")
@RequiredArgsConstructor
public class RecommendationController {

    private final RecommendationService recommendationService;
    private final JwtUtil jwtUtil;

    @GetMapping("/user/{userId}")
    public List<RecommendationResponse> getRecommendations(
            @PathVariable Long userId,
            @RequestHeader("Authorization") String authHeader) {
        Long requestingUserId = extractUserIdFromToken(authHeader);
        if (!userId.equals(requestingUserId)) {
            throw new RuntimeException("You can only view your own recommendations");
        }
        return recommendationService.getRecommendations(userId);
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
