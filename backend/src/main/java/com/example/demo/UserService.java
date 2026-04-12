package com.example.demo;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    // ==========================================================
    // 1. NEW METHODS FOR REACT FRONTEND (Used by UserController)
    // ==========================================================

    // Updated to return Optional<User> so the controller can use .map()
    public Optional<User> getUserByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    @Transactional
    public Optional<User> updateGender(String email, String gender) {
        return userRepository.findByEmail(email).map(user -> {
            user.setGender(gender);
            return userRepository.save(user);
        });
    }

    @Transactional
    public Optional<User> toggleDelivery(String email) {
        return userRepository.findByEmail(email).map(user -> {
            boolean newStatus = !user.isDelivering();
            user.setDelivering(newStatus);

            // Immediately refresh heartbeat when going online
            if (newStatus) {
                user.setLastActive(LocalDateTime.now());
            }

            return userRepository.save(user);
        });
    }

    public long getActiveCount() {
        return userRepository.countByDeliveringTrue();
    }

    @Transactional
    public void heartbeat(String email) {
        userRepository.findByEmail(email).ifPresent(user -> {
            user.setLastActive(LocalDateTime.now());
            userRepository.save(user);
        });
    }

    // ==========================================================
    // 2. LEGACY API RESPONSE METHODS (Kept safe so nothing breaks)
    // ==========================================================

    // CREATE (Updated to use 'name' and 'email')
    public ApiResponse createUser(String name, String email) {
        String cleanName = name.trim();
        if (cleanName.isEmpty())
            return new ApiResponse("error", "Name cannot be blank!", null);

        // Check if user already exists by email
        if (userRepository.findByEmail(email).isPresent()) {
            return new ApiResponse("error", "User with this email already exists!", null);
        }

        User newUser = new User();
        newUser.setName(cleanName);
        newUser.setEmail(email);
        userRepository.save(newUser);

        return new ApiResponse("success", "User created successfully", newUser);
    }

    // READ ALL
    public ApiResponse getAllUsers() {
        List<User> users = userRepository.findAll();
        return new ApiResponse("success", "Fetched all users", users);
    }

    // SEARCH (Updated to search by 'name')
    public ApiResponse searchUsers(String keyword) {
        // Search the 'name' column provided by Google
        List<User> users = userRepository.findByNameContainingIgnoreCase(keyword);
        return new ApiResponse("success", "Search results for: " + keyword, users);
    }

    // UPDATE
    public ApiResponse updateUser(Long id, String newName) {
        return userRepository.findById(id).map(user -> {
            user.setName(newName); // Changed from setUsername
            userRepository.save(user);
            return new ApiResponse("success", "Updated user " + id + " to new name: " + newName, user);
        }).orElse(new ApiResponse("error", "User " + id + " not found!", null));
    }

    // DELETE
    public ApiResponse deleteUser(Long id) {
        if (userRepository.existsById(id)) {
            userRepository.deleteById(id);
            return new ApiResponse("success", "Deleted user with ID: " + id, null);
        } else {
            return new ApiResponse("error", "User " + id + " not found!", null);
        }
    }
}