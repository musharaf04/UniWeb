package com.example.demo;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/user")
public class UserController {

    @Autowired
    private UserService userService;

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(@AuthenticationPrincipal OAuth2User oauth2User) {
        if (oauth2User == null)
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        return userService.getUserByEmail(oauth2User.getAttribute("email"))
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).build());
    }

    @PostMapping("/update-gender")
    public ResponseEntity<?> updateGender(@RequestBody Map<String, String> payload,
            @AuthenticationPrincipal OAuth2User principal) {
        if (principal == null)
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        return userService.updateGender(principal.getAttribute("email"), payload.get("gender"))
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).build());
    }

    @PostMapping("/toggle-delivery")
    public ResponseEntity<?> toggleDeliveryStatus(@AuthenticationPrincipal OAuth2User principal) {
        if (principal == null)
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        return userService.toggleDelivery(principal.getAttribute("email"))
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).build());
    }

    @GetMapping("/active-count")
    public ResponseEntity<Long> getActiveCount() {
        return ResponseEntity.ok(userService.getActiveCount());
    }

    @PostMapping("/heartbeat")
    public ResponseEntity<?> heartbeat(@AuthenticationPrincipal OAuth2User principal) {
        if (principal == null)
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        userService.heartbeat(principal.getAttribute("email"));
        return ResponseEntity.ok().build();
    }
}