package com.ecotrack.carbon.service.ai;

import com.ecotrack.carbon.dto.request.ChatRequest;
import com.ecotrack.carbon.dto.response.ChatResponse;

public interface AIService {
    
    ChatResponse processMessage(ChatRequest request, Long userId);
    
    String generateSystemPrompt(Long userId);
    
    boolean isHealthy();
}