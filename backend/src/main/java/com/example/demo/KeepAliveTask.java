package com.example.demo;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

@Component
public class KeepAliveTask {

    private final RestTemplate restTemplate = new RestTemplate();

    // Runs every 14 minutes (840,000 milliseconds) to beat the 15-minute timer
    @Scheduled(fixedRate = 840000)
    public void pingMyself() {
        try {
            String url = "https://uniweb-api.onrender.com/api/health";
            restTemplate.getForObject(url, String.class);
            System.out.println("Internal heartbeat sent to prevent spin-down.");
        } catch (Exception e) {
            // Ignore errors if the server is already processing a heavy load
        }
    }
}
