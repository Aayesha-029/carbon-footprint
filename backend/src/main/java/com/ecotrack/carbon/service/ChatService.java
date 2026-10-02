package com.ecotrack.carbon.service;

import com.ecotrack.carbon.dto.request.ChatRequest;
import com.ecotrack.carbon.dto.response.ChatResponse;
import com.ecotrack.carbon.service.ai.AIService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@Slf4j
@RequiredArgsConstructor
public class ChatService {

    private final AIService aiService;

    public ChatResponse processMessage(ChatRequest request, Long userId) {
        log.info("Processing chat message for user: {}", userId);
        
        if (request.getMessage() == null || request.getMessage().trim().isEmpty()) {
            return ChatResponse.error("Please enter a message.");
        }
        
        try {
            return aiService.processMessage(request, userId);
        } catch (Exception e) {
            log.error("Error in chat service: {}", e.getMessage(), e);
            return ChatResponse.error("I'm having trouble processing your request. Please try again later.");
        }
    }

    public String[] getSuggestedQuestions() {
        return new String[]{
            "How can I reduce my carbon footprint?",
            "What category produces the most emissions for me?",
            "How can I reduce my transportation emissions?",
            "Am I on track with my sustainability goal?",
            "Give me 3 eco-friendly actions I can take today.",
            "Explain my carbon footprint."
        };
    }
}