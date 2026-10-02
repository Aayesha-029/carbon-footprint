package com.ecotrack.carbon.dto.request;

import lombok.Data;

@Data
public class BadgeRequest {
    private Long userId;
    private String badgeType;
}