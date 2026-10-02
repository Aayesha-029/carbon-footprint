package com.ecotrack.carbon.dto.response;

import lombok.Data;
import java.time.LocalDateTime;

@Data  // Add this
public class NotificationResponse {
    private Long id;
    private String type;
    private String title;
    private String message;
    private boolean read;
    private String link;
    private String timeAgo;
    private LocalDateTime createdAt;
}