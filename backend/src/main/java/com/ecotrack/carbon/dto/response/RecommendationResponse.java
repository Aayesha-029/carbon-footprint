package com.ecotrack.carbon.dto.response;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class RecommendationResponse {
    private Long id;
    private String title;
    private String description;
    private String category;
    private BigDecimal potentialSavings;
    private String priority;
    private String icon;
    private String color;
    private String tip;
}