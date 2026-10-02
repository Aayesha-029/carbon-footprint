package com.ecotrack.carbon.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.Contact;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Carbon Footprint Tracker API")
                        .description("API for tracking carbon emissions across Transport, Electricity, Food, and Shopping categories.")
                        .version("1.0.0")
                        .contact(new Contact()
                                .name("EcoTrack Team")
                                .email("support@ecotrack.com")));
    }
}