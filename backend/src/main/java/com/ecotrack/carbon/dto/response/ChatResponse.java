package com.ecotrack.carbon.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatResponse {
    
    private String message;
    private String role;
    private LocalDateTime timestamp;
    private boolean isError;
    private String errorMessage;
    private Object metadata;
    
    public static ChatResponse success(String message) {
        return ChatResponse.builder()
                .message(message)
                .role("assistant")
                .timestamp(LocalDateTime.now())
                .isError(false)
                .build();
    }
    
    public static ChatResponse error(String errorMessage) {
        return ChatResponse.builder()
                .message(errorMessage)
                .role("assistant")
                .timestamp(LocalDateTime.now())
                .isError(true)
                .errorMessage(errorMessage)
                .build();
    }
}   