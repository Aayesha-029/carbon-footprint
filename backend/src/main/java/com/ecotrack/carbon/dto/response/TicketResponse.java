package com.ecotrack.carbon.dto.response;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class TicketResponse {
    private Long id;
    private String ticketId;
    private Long userId;
    private String userName;
    private String userEmail;
    private String subject;
    private String category;
    private String priority;
    private String description;
    private String status;
    private Long assignedTo;
    private String assignedToName;
    private Integer replyCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<TicketReplyResponse> replies;
}