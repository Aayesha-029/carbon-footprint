package com.ecotrack.carbon.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Data
@Configuration
@ConfigurationProperties(prefix = "gemini")
public class GeminiConfig {
    private String apiKey;
    private String model = "gemini-2.0-flash-exp";
    private String apiUrl = "https://generativelanguage.googleapis.com/v1beta/models";
    private int maxTokens = 1000;
    private double temperature = 0.7;
}