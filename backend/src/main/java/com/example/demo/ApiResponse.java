package com.example.demo;

// This is our standard "Envelope" for sending messages to the internet
public class ApiResponse {
    private String status; // Will be "success" or "error"
    private String message; // The human-readable message
    private Object data; // Any extra data (like the User object)

    // Constructor
    public ApiResponse(String status, String message, Object data) {
        this.status = status;
        this.message = message;
        this.data = data;
    }

    // Getters (Spring Boot needs these to convert it to JSON!)
    public String getStatus() {
        return status;
    }

    public String getMessage() {
        return message;
    }

    public Object getData() {
        return data;
    }
}