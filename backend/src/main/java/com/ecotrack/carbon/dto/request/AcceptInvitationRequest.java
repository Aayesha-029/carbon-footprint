package com.ecotrack.carbon.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AcceptInvitationRequest {

    @NotBlank(message = "Token is required")
    private String token;

    private String password; // Required if user does not exist
    private String fullName; // Required if user does not exist
}