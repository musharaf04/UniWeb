package com.example.demo;

import org.springframework.context.annotation.Configuration;

@Configuration 
public class CorsConfig {
    // Disabled duplicate WebMvcConfigurer CORS setup
    // Spring Security already strictly handles CORS in SecurityConfig.java.
    // Specifying it in both places generates duplicate 'Access-Control-Allow-Origin' headers,
    // which rigid browsers like Safari immediately block. 
}