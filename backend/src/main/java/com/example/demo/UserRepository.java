package com.example.demo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.time.LocalDateTime;
import java.util.Optional;

@Repository
// Notice the end is now <User, Long> instead of <User, String>
public interface UserRepository extends JpaRepository<User, Long> {
    // THE MAGIC LINE:
    // Spring reads "find By Username Containing Ignore Case" and automatically
    // writes the SQL to search for partial matches without worrying about capital
    // letters!
    Optional<User> findByEmail(String email);

    // This allows the database to instantly count active deliverers
    long countByDeliveringTrue();

    List<User> findByNameContainingIgnoreCase(String name);

    // ✅ For the Reaper task to find inactive users
    List<User> findAllByDeliveringTrueAndLastActiveBefore(LocalDateTime cutoff);
}