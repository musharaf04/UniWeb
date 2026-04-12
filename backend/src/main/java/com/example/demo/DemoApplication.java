package com.example.demo;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.beans.factory.annotation.Autowired;

import java.time.LocalDateTime;
import java.util.List;

@SpringBootApplication
@EnableScheduling // ✅ REQUIRED to enable @Scheduled
public class DemoApplication {

	@Autowired
	private UserRepository userRepository;

	public static void main(String[] args) {
		SpringApplication.run(DemoApplication.class, args);
	}

	@Scheduled(fixedRate = 20000) // Run every 20 seconds
	public void cleanupInactiveUsers() {
		// If a user hasn't sent a heartbeat in 30 seconds, they are GONE
		LocalDateTime cutoff = LocalDateTime.now().minusSeconds(30);
		List<User> zombies = userRepository.findAllByDeliveringTrueAndLastActiveBefore(cutoff);

		for (User u : zombies) {
			u.setDelivering(false);
			userRepository.save(u);
			System.out.println(">>> [SYSTEM] Logged out inactive deliverer: " + u.getName());
		}

		// ✅ EXTRA SAFETY: Handle any legacy users with a NULL timestamp who are stuck
		// on 'Delivering'
		userRepository.findAll().stream()
				.filter(u -> u.isDelivering() && u.getLastActive() == null)
				.forEach(u -> {
					u.setDelivering(false);
					userRepository.save(u);
				});
	}
}