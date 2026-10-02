package com.ecotrack.carbon.dto.response;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class OrganizationResponse {
    private Long id;
    private String name;
    private String description;
    private String email;
    private String phone;
    private String address;
    private String status;
    private Long organizerId;
    private String organizerName;
    private String organizerEmail;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}