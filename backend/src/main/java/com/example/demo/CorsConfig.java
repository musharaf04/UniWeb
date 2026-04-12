package com.example.demo;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration // Tells Spring Boot "Read this when you start up!"
public class CorsConfig {

    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/**") // Apply this to ALL endpoints (like /create, /all)
                        // Allow requests from any frontend (React, Angular, Vue, Mobile)
                        // Note: In a real company, you would change "*" to "http://yourwebsite.com"
                        .allowedOriginPatterns("*") 
                        .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                        .allowedHeaders("*")
                        .allowCredentials(true); // Allows cookies/tokens to be sent
            }
        };
    }
}