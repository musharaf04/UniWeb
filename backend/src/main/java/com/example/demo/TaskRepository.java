package com.example.demo;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TaskRepository extends JpaRepository<Task, Long> {
    // This is the MAGIC line: it only finds tasks belonging to one user ID
    List<Task> findByUserId(Long userId);
}