package com.example.userapi;

import com.example.userapi.security.SecurityConfig; // Import SecurityConfig
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.password.PasswordEncoder; // Import PasswordEncoder

@SpringBootApplication
public class UserApiApplication {

	public static void main(String[] args) {
		SpringApplication.run(UserApiApplication.class, args);
	}

	@Bean
	public CommandLineRunner demoUser(UserRepository userRepository, PasswordEncoder passwordEncoder) {
		return args -> {
			// Create a default user if not exists
			if (userRepository.findByUsername("testuser") == null) {
				User user = new User();
				user.setUsername("testuser");
				user.setPassword(passwordEncoder.encode("password")); // Encode the password
				userRepository.save(user);
				System.out.println("Default user 'testuser' created with password 'password'");
			}
		};
	}
}