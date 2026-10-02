package com.ecotrack.carbon.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class OrganizationUpdateRequest {

    @NotBlank(message = "Organization name is required")
    private String name;

    private String description;
    private String email;
    private String phone;
    private String address;
}