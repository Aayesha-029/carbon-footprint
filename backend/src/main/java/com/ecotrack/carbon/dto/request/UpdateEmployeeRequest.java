package com.ecotrack.carbon.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UpdateEmployeeRequest {
    @NotBlank
    private String fullName;
}