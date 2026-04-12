package com.example.demo;

import jakarta.persistence.*;
import java.util.List;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
public class User {

    @Id
    // REMOVED: @GeneratedValue(strategy = GenerationType.IDENTITY)
    // We remove this so we can manually assign the 5-digit ID during login
    private Long id;

    @Column(unique = true, nullable = false)
    private String email;

    private String name;

    private String gender;

    @Column(columnDefinition = "int default 0")
    private Integer points = 0;

    @Column(name = "google_id", unique = true)
    private String googleId;

    // FIXED: Changed "isDelivering" to "delivering"
    @Column(name = "is_delivering", nullable = false)
    private boolean delivering = false;

    // ✅ NEW FIELD: Track last active time. Initialized to now to prevent nulls.
    private LocalDateTime lastActive = LocalDateTime.now();

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Task> tasks;

    // --- GETTERS AND SETTERS ---

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getGender() {
        return gender;
    }

    public void setGender(String gender) {
        this.gender = gender;
    }

    public Integer getPoints() {
        return points;
    }

    public void setPoints(Integer points) {
        this.points = points;
    }

    public String getGoogleId() {
        return googleId;
    }

    public void setGoogleId(String googleId) {
        this.googleId = googleId;
    }

    public boolean isDelivering() {
        return delivering;
    }

    public void setDelivering(boolean delivering) {
        this.delivering = delivering;
    }

    public List<Task> getTasks() {
        return tasks;
    }

    public void setTasks(List<Task> tasks) {
        this.tasks = tasks;
    }

    // ✅ GETTER & SETTER for lastActive
    public LocalDateTime getLastActive() {
        return lastActive;
    }

    public void setLastActive(LocalDateTime lastActive) {
        this.lastActive = lastActive;
    }
}