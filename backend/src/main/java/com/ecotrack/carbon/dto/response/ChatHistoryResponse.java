package com.ecotrack.carbon.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatHistoryResponse {
    
    private String conversationId;
    private List<ChatMessageDto> messages;
    private int totalMessages;
    private LocalDateTime startedAt;
    private LocalDateTime lastUpdatedAt;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ChatMessageDto {
        private String role;
        private String content;
        private LocalDateTime timestamp;
        private boolean isError;
    }
}