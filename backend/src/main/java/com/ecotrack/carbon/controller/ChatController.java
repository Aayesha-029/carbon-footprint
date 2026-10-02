package com.ecotrack.carbon.controller;

import com.ecotrack.carbon.dto.request.ChatRequest;
import com.ecotrack.carbon.dto.response.ChatResponse;
import com.ecotrack.carbon.security.JwtUtil;
import com.ecotrack.carbon.service.ChatService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.Map;

@RestController
@RequestMapping("/api/chat")
@Slf4j
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;
    private final JwtUtil jwtUtil;

    @Value("${gemini.api.key}")
    private String apiKey;

    /**
     * Send a message to the chatbot
     */
      @PostMapping("/message")
    public ResponseEntity<ChatResponse> sendMessage(@Valid @RequestBody ChatRequest request) {
        try {
            Long userId = getCurrentUserId();  // ← may be null for public users
            log.info("Chat request from {}", userId != null ? "user " + userId : "guest");

            // Pass null-safe userId to service. GeminiAIService must handle null.
            ChatResponse response = chatService.processMessage(request, userId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error processing chat request: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ChatResponse.error("An error occurred while processing your message."));
        }
    }

    /**
     * Get suggested questions
     */
    @GetMapping("/suggestions")
    public ResponseEntity<Map<String, String[]>> getSuggestions() {
        String[] suggestions = chatService.getSuggestedQuestions();
        return ResponseEntity.ok(Map.of("suggestions", suggestions));
    }

    /**
     * Check chatbot health
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> healthCheck() {
        return ResponseEntity.ok(Map.of(
                "status", "healthy",
                "service", "EcoAI Assistant",
                "timestamp", System.currentTimeMillis()
        ));
    }

    /**
     * Temporary test endpoint to check if API key is loaded
     */
    @GetMapping("/test-gemini")
    public ResponseEntity<String> testGemini() {
        try {
            String keyStatus = (apiKey != null && !apiKey.isEmpty())
                    ? "Key loaded: " + apiKey.substring(0, Math.min(6, apiKey.length())) + "..."
                    : "NO KEY";
            return ResponseEntity.ok(keyStatus);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error: " + e.getMessage());
        }
    }

    /**
     * Extract the current user ID from the JWT token in the Authorization header.
     */    /**
     * Extract the current user ID from the JWT token in the Authorization header.
     * Returns null if the user is not authenticated (public access).
     */
    private Long getCurrentUserId() {
        try {
            // Get the token from the request header
            ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attributes == null) return null;

            HttpServletRequest request = attributes.getRequest();
            String authHeader = request.getHeader("Authorization");

            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                String token = authHeader.substring(7);
                Long userId = jwtUtil.extractUserId(token);
                if (userId != null) return userId;
            }

            // Fallback: check SecurityContext
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null && authentication.isAuthenticated()
                    && !(authentication instanceof org.springframework.security.authentication.AnonymousAuthenticationToken)) {
                Object principal = authentication.getPrincipal();
                if (principal instanceof org.springframework.security.core.userdetails.UserDetails) {
                    // User is authenticated but we can't extract userId here (email only).
                    // Return null — service will treat as guest.
                }
            }

            return null; // public / unauthenticated
        } catch (Exception e) {
            log.warn("Could not extract user id, treating as guest: {}", e.getMessage());
            return null;
        }
    }
}