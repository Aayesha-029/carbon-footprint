package com.ecotrack.carbon.dto.response;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class TicketReplyResponse {
    private Long id;
    private Long userId;
    private String userName;
    private String userEmail;
    private String message;
    private boolean isAdmin;
    private String userAvatar;
    private LocalDateTime createdAt;
    private String timeAgo;
}