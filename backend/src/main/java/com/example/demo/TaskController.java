package com.example.demo;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/tasks")
public class TaskController {

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private UserRepository userRepository;

    // 1. SEE ONLY MY TASKS
    @GetMapping("/my")
    public ApiResponse getMyTasks(@AuthenticationPrincipal OAuth2User principal) {
        String email = principal.getAttribute("email");
        User user = userRepository.findByEmail(email).orElseThrow();

        List<Task> myTasks = taskRepository.findByUserId(user.getId());
        return new ApiResponse("success", "Fetched your organized tasks", myTasks);
    }

    // 2. ADD A NEW TASK (Men/Women category)
    @PostMapping("/add")
    public ApiResponse addTask(@AuthenticationPrincipal OAuth2User principal,
            @RequestParam String desc,
            @RequestParam String category) {
        String email = principal.getAttribute("email");
        User user = userRepository.findByEmail(email).orElseThrow();

        Task task = new Task();
        task.setDescription(desc);
        task.setCategory(category);
        task.setUser(user); // Link it to the logged-in user!

        taskRepository.save(task);
        return new ApiResponse("success", "Task added under category: " + category, task);
    }
}