package com.example.userapi;

import com.example.userapi.model.User;
import com.example.userapi.security.SecurityConfig; // Import SecurityConfig
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.password.PasswordEncoder; // Import PasswordEncoder
import org.springframework.web.client.RestTemplate;

@SpringBootApplication
public class UserApiApplication {

	public static void main(String[] args) {
		SpringApplication.run(UserApiApplication.class, args);
	}

	@Bean
	public RestTemplate restTemplate() {
		return new RestTemplate();
	}

	@Bean
	public CommandLineRunner demoUser(UserRepository userRepository, PasswordEncoder passwordEncoder) {
		return args -> {
			// Create a default user if not exists
			if (userRepository.findByEmail("ngoctu790@gmail.com") == null) {
				User user = new User();
				user.setName("Ngoc Tu");
				user.setEmail("ngoctu790@gmail.com");
				user.setPassword(passwordEncoder.encode("password")); // Encode the password
				userRepository.save(user);
				System.out.println("Default user 'ngoctu790@gmail.com' created with password 'password'");
			}
		};
	}
}