package com.ecotrack.carbon.dto.response;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class OrganizationAdminResponse {
    private Long id;
    private String name;
    private String description;
    private String email;
    private String phone;
    private String address;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Organizer info
    private Long organizerId;
    private String organizerName;
    private String organizerEmail;

    // Live stats
    private Long memberCount;
    private Long activeMemberCount;
    private BigDecimal totalCO2;
}