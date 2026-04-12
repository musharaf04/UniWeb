package com.example.demo;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Map;

@RestController
@RequestMapping("/api/user")
public class UserController {

    private static final Logger logger = LoggerFactory.getLogger(UserController.class);

    @Autowired
    private UserService userService;

    // --- NEW HELPER METHOD TO SUPPORT BOTH OLD & NEW AUTH ---
    private String getEmail(Object principal) {
        if (principal instanceof OAuth2User) {
            return ((OAuth2User) principal).getAttribute("email");
        } else if (principal instanceof String) {
            return (String) principal;
        }
        return null;
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(@AuthenticationPrincipal Object principal) {
        String email = getEmail(principal);
        if (email == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return userService.getUserByEmail(email)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).build());
    }

    @PostMapping("/update-gender")
    public ResponseEntity<?> updateGender(@RequestBody Map<String, String> payload,
            @AuthenticationPrincipal Object principal) {

        logger.info(">>> [API] Received update-gender request. Payload: {}", payload);

        String email = getEmail(principal);
        if (email == null) {
            logger.warn(">>> [API] update-gender failed: No authenticated user (Principal is null)");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Session expired");
        }

        String gender = payload.get("gender");

        return userService.updateGender(email, gender)
                .map(user -> {
                    logger.info(">>> [DATABASE] Gender updated to {} for user {}", gender, email);
                    return ResponseEntity.ok(user);
                })
                .orElseGet(() -> {
                    logger.error(">>> [DATABASE] User not found for email: {}", email);
                    return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
                });
    }

    @PostMapping("/toggle-delivery")
    public ResponseEntity<?> toggleDeliveryStatus(@AuthenticationPrincipal Object principal) {
        String email = getEmail(principal);
        if (email == null)
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        return userService.toggleDelivery(email)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).build());
    }

    @GetMapping("/active-count")
    public ResponseEntity<Long> getActiveCount() {
        return ResponseEntity.ok(userService.getActiveCount());
    }

    @PostMapping("/heartbeat")
    public ResponseEntity<?> heartbeat(@AuthenticationPrincipal Object principal) {
        String email = getEmail(principal);
        if (email == null)
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        userService.heartbeat(email);
        return ResponseEntity.ok().build();
    }
}