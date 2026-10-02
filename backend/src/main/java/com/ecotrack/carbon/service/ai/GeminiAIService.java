package com.ecotrack.carbon.service.ai;

import com.ecotrack.carbon.dto.request.ChatRequest;
import com.ecotrack.carbon.dto.response.AnalyticsResponse;
import com.ecotrack.carbon.dto.response.ChatResponse;
import com.ecotrack.carbon.dto.response.GoalResponse;
import com.ecotrack.carbon.entity.ActivityLog;
import com.ecotrack.carbon.entity.User;
import com.ecotrack.carbon.repository.ActivityLogRepository;
import com.ecotrack.carbon.repository.UserRepository;
import com.ecotrack.carbon.service.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.io.*;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class GeminiAIService implements AIService {

    private final ObjectMapper objectMapper;
    private final ActivityLogRepository activityLogRepository;
    private final AnalyticsService analyticsService;
    private final GoalService goalService;
    private final RecommendationService recommendationService;
    private final UserRepository userRepository;
    private final DashboardService dashboardService;
    private final BadgeService badgeService;

    @Value("${gemini.api.key}")
    private String apiKey;

    @Value("${gemini.model}")
    private String model;

    @Value("${gemini.api.url}")
    private String apiUrl;

    @Value("${gemini.max.tokens:500}")
    private int maxTokens;

    @Value("${gemini.temperature:0.7}")
    private double temperature;

    // 👇 ADD THIS METHOD
    
    public void init() {
        log.info("🔢 Gemini max tokens set to: {}", maxTokens);
    }
    @Override
    public ChatResponse processMessage(ChatRequest request, Long userId) {
        try {
            log.info("Processing chat message (userId={})", userId);

            String userContext;
            String systemPrompt;

            if (userId == null) {
                // Guest mode — no personal data
                userContext = "{\"mode\": \"guest\", \"message\": \"This user is not logged in. Provide general sustainability advice. Do not reference personal data.\"}";
                systemPrompt = """
                    You are EcoAI, the sustainability assistant for CarbonTrack.
                    The user is visiting the public landing page and is NOT logged in.
                    
                    CRITICAL FORMATTING RULES:
                    1. Use line breaks to separate ideas.
                    2. Use bullet points (* ) for lists.
                    3. Number steps when giving instructions.
                    4. Keep each point concise.
                    5. Do not output Markdown, code blocks, or JSON.
                    6. Always end with a brief encouraging sentence.
                    
                    CONTENT RULES:
                    - Focus on general sustainability tips.
                    - Explain what CarbonTrack offers when relevant.
                    - Encourage the user to sign up to unlock personalized features.
                    - Keep responses under 200 words.
                    """;
            } else {
                userContext = buildUserContext(userId);
                systemPrompt = generateSystemPrompt(userId);
            }

            String fullPrompt = buildFullPrompt(systemPrompt, userContext, request.getMessage());
            String aiResponse = callGeminiAPI(fullPrompt);
            return ChatResponse.success(aiResponse);
        } catch (Exception e) {
            log.error("Error processing chat message: {}", e.getMessage(), e);
            return ChatResponse.error("I'm having trouble processing your request. Please try again.");
        }
    }
    @Override
    public String generateSystemPrompt(Long userId) {
        User user = userRepository.findById(userId).orElse(null);
        String userName = user != null ? user.getFullName() : "User";
        return String.format("""
            You are EcoAI, the sustainability assistant for CarbonTrack.
            Your purpose is to help users understand and reduce their environmental impact based on their actual carbon footprint data.
            User: %s
            Date: %s
            ----------------------------------------
            ⚠️ CRITICAL FORMATTING RULES – MUST FOLLOW:
            ----------------------------------------
            1. **Use line breaks (\\n) to separate ideas and sections.**
            2. **Use bullet points (* ) for lists.**
               Example:
               * First point
               * Second point
            3. **Number steps when giving instructions.**
               Example:
               1. First step
               2. Second step
            4. **Keep each point concise and on a new line.**
            5. **Do not output Markdown, code blocks, or JSON.**
            6. **Use plain text with clear structure.**
            7. **Always end with a brief encouraging sentence.**
            ----------------------------------------
            RULES FOR CONTENT:
            - Use ONLY the data provided in the USER DATA CONTEXT.
            - If information is unavailable, say: "I don't have enough data to answer that accurately."
            - Keep total response under 300 words.
            - Be practical and actionable.
            ----------------------------------------
            RESPONSE STRUCTURE (example):
            [Greeting or direct answer]
            * Point 1
            * Point 2
            * Point 3
            [Summary or encouraging question]
            """, userName, LocalDate.now().format(DateTimeFormatter.ISO_DATE));
    }

    @Override
    public boolean isHealthy() {
        try {
            callGeminiAPI("test");
            return true;
        } catch (Exception e) {
            log.error("Health check failed: {}", e.getMessage());
            return false;
        }
    }

    private String buildUserContext(Long userId) {
        // ... (your existing code, unchanged)
        try {
            Map<String, Object> context = new LinkedHashMap<>();
            User user = userRepository.findById(userId).orElse(null);
            if (user != null) {
                context.put("userName", user.getFullName());
                context.put("userEmail", user.getEmail());
                context.put("userRole", user.getRole());
                context.put("memberSince", user.getCreatedAt() != null ? user.getCreatedAt().toLocalDate().toString() : "N/A");
            }
            List<ActivityLog> allActivities = activityLogRepository.findByUserIdOrderByLogDateDesc(userId);
            context.put("totalActivities", allActivities.size());
            LocalDate endDate = LocalDate.now();
            LocalDate startDate = endDate.minusDays(30);
            try {
                AnalyticsResponse analytics = analyticsService.getAnalytics(userId, startDate, endDate);
                if (analytics != null) {
                    context.put("totalCO2e", analytics.getTotalCO2e() != null ? analytics.getTotalCO2e().toString() : "0");
                    Map<String, Object> categoryData = new HashMap<>();
                    if (analytics.getCategoryBreakdown() != null) {
                        for (Map.Entry<String, AnalyticsResponse.CategoryStats> entry : analytics.getCategoryBreakdown().entrySet()) {
                            Map<String, Object> catStats = new HashMap<>();
                            catStats.put("totalCO2e", entry.getValue().getTotalCO2e() != null ? entry.getValue().getTotalCO2e().toString() : "0");
                            catStats.put("count", entry.getValue().getCount());
                            categoryData.put(entry.getKey(), catStats);
                        }
                    }
                    context.put("categoryBreakdown", categoryData);
                }
            } catch (Exception e) {
                log.warn("Could not fetch analytics: {}", e.getMessage());
                context.put("totalCO2e", "0");
                context.put("categoryBreakdown", new HashMap<>());
            }
            try {
                List<GoalResponse> goals = goalService.getUserGoals(userId);
                if (goals != null && !goals.isEmpty()) {
                    List<Map<String, Object>> goalList = new ArrayList<>();
                    for (GoalResponse goal : goals) {
                        Map<String, Object> goalMap = new HashMap<>();
                        goalMap.put("name", goal.getGoalName());
                        goalMap.put("category", goal.getCategory());
                        goalMap.put("targetCO2", goal.getTargetCO2() != null ? goal.getTargetCO2().toString() : "0");
                        goalMap.put("currentCO2", goal.getCurrentCO2() != null ? goal.getCurrentCO2().toString() : "0");
                        goalMap.put("progress", goal.getProgressPercentage() != null ? goal.getProgressPercentage().toString() : "0");
                        goalMap.put("status", goal.getStatus());
                        goalList.add(goalMap);
                    }
                    context.put("goals", goalList);
                } else {
                    context.put("goals", new ArrayList<>());
                }
            } catch (Exception e) {
                log.warn("Could not fetch goals: {}", e.getMessage());
                context.put("goals", new ArrayList<>());
            }
            try {
                var badges = badgeService.getUserBadges(userId);
                if (badges != null) {
                    List<String> badgeNames = badges.stream()
                            .map(b -> b.getBadgeName() != null ? b.getBadgeName() : b.getBadgeType())
                            .collect(Collectors.toList());
                    context.put("badges", badgeNames);
                    context.put("badgeCount", badgeNames.size());
                } else {
                    context.put("badges", new ArrayList<>());
                    context.put("badgeCount", 0);
                }
            } catch (Exception e) {
                log.warn("Could not fetch badges: {}", e.getMessage());
                context.put("badges", new ArrayList<>());
                context.put("badgeCount", 0);
            }
            return objectMapper.writeValueAsString(context);
        } catch (Exception e) {
            log.error("Error building user context: {}", e.getMessage(), e);
            return "{\"error\": \"Could not load user data\"}";
        }
    }

    private String buildFullPrompt(String systemPrompt, String userContext, String userMessage) {
        return String.format("""
            %s
            
            ========================================
            USER DATA CONTEXT:
            %s
            ========================================
            
            USER QUESTION:
            %s
            
            IMPORTANT: Use ONLY the data provided above. If the user asks about data not in the context,
            clearly state: "I don't have enough data to answer that accurately."
            
            Provide a helpful, data-driven response with actionable advice.
            """, systemPrompt, userContext, userMessage);
    }

    private String callGeminiAPI(String prompt) throws IOException {
        String urlString = String.format("%s/%s:generateContent?key=%s", apiUrl, model, apiKey);
        URL url = new URL(urlString);
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setRequestMethod("POST");
        conn.setRequestProperty("Content-Type", "application/json");
        conn.setDoOutput(true);
        conn.setConnectTimeout(30000);
        conn.setReadTimeout(30000);

        Map<String, Object> requestBody = new LinkedHashMap<>();
        Map<String, Object> content = new LinkedHashMap<>();
        content.put("parts", new Object[]{Map.of("text", prompt)});
        requestBody.put("contents", new Object[]{content});

        Map<String, Object> generationConfig = new LinkedHashMap<>();
        generationConfig.put("temperature", temperature);
        generationConfig.put("maxOutputTokens", maxTokens);  // ✅ uses the injected value
        generationConfig.put("topP", 0.95);
        requestBody.put("generationConfig", generationConfig);

        List<Map<String, String>> safetySettings = new ArrayList<>();
        safetySettings.add(Map.of("category", "HARM_CATEGORY_HARASSMENT", "threshold", "BLOCK_MEDIUM_AND_ABOVE"));
        safetySettings.add(Map.of("category", "HARM_CATEGORY_HATE_SPEECH", "threshold", "BLOCK_MEDIUM_AND_ABOVE"));
        safetySettings.add(Map.of("category", "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold", "BLOCK_MEDIUM_AND_ABOVE"));
        safetySettings.add(Map.of("category", "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold", "BLOCK_MEDIUM_AND_ABOVE"));
        requestBody.put("safetySettings", safetySettings);

        String jsonBody = objectMapper.writeValueAsString(requestBody);

        try (OutputStream os = conn.getOutputStream()) {
            byte[] input = jsonBody.getBytes(StandardCharsets.UTF_8);
            os.write(input, 0, input.length);
        }

        int responseCode = conn.getResponseCode();
        String responseBody;
        try (InputStream is = responseCode < 400 ? conn.getInputStream() : conn.getErrorStream()) {
            if (is == null) throw new IOException("No response body");
            try (Scanner scanner = new Scanner(is, StandardCharsets.UTF_8.name())) {
                scanner.useDelimiter("\\A");
                responseBody = scanner.hasNext() ? scanner.next() : "";
            }
        }

        if (responseCode != 200) {
            log.error("Gemini API error: {} - {}", responseCode, responseBody);
            if (responseCode == 429) throw new IOException("Rate limit exceeded. Please try again later.");
            else if (responseCode == 403) throw new IOException("API key invalid or quota exceeded.");
            else throw new IOException("Gemini API returned error: " + responseCode);
        }

        log.debug("Gemini API response: {}", responseBody);

        JsonNode jsonNode = objectMapper.readTree(responseBody);
        JsonNode candidates = jsonNode.path("candidates");
        if (candidates.isArray() && candidates.size() > 0) {
            JsonNode firstCandidate = candidates.get(0);
            // Check finishReason
            String finishReason = firstCandidate.path("finishReason").asText();
            if ("MAX_TOKENS".equals(finishReason)) {
                log.warn("⚠️ Response truncated due to token limit. Current maxTokens: {}", maxTokens);
            }
            // Safety checks
            JsonNode safetyRatings = firstCandidate.path("safetyRatings");
            if (safetyRatings.isArray()) {
                for (JsonNode rating : safetyRatings) {
                    String category = rating.path("category").asText();
                    String probability = rating.path("probability").asText();
                    if ("BLOCKED".equals(probability) || "HIGH".equals(probability)) {
                        log.warn("Response blocked for category: {} with probability: {}", category, probability);
                        return "I cannot provide a response to that question due to safety guidelines. Please ask a different question about sustainability.";
                    }
                }
            }
            JsonNode contentNode = firstCandidate.path("content");
            JsonNode parts = contentNode.path("parts");
            if (parts.isArray() && parts.size() > 0) {
                String text = parts.get(0).path("text").asText();
                if (text != null && !text.isEmpty()) {
                    return text;
                }
            }
            if ("SAFETY".equals(finishReason)) {
                return "I cannot provide a response due to safety guidelines. Please rephrase your question.";
            } else if ("MAX_TOKENS".equals(finishReason)) {
                return "The response was too long. Please ask a more specific question.";
            }
        }
        throw new IOException("Unexpected Gemini API response format");
    }
}