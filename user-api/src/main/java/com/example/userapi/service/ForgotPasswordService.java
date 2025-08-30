package com.example.userapi.service;

import com.example.userapi.UserRepository;
import com.example.userapi.model.PasswordResetToken;
import com.example.userapi.model.User;
import com.example.userapi.repository.PasswordResetTokenRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
public class ForgotPasswordService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordResetTokenRepository passwordResetTokenRepository;

    @Autowired
    private RestTemplate restTemplate;

    @Value("${email.service.url:http://email-service:8081}")
    private String emailServiceUrl;

    public void createPasswordResetTokenForUser(String email) {
        User user = userRepository.findByEmail(email);
        if (user != null) {
            // Delete any existing tokens for this user
            PasswordResetToken existingToken = passwordResetTokenRepository.findByUser(user);
            if (existingToken != null) {
                passwordResetTokenRepository.delete(existingToken);
            }
            
            String token = UUID.randomUUID().toString();
            LocalDateTime expiryDate = LocalDateTime.now().plusMinutes(30); // Token valid for 30 minutes
            PasswordResetToken myToken = new PasswordResetToken(token, user, expiryDate);
            passwordResetTokenRepository.save(myToken);
            
            // Send password reset email via email service
            sendPasswordResetEmail(email, token);
        }
    }

    private void sendPasswordResetEmail(String email, String token) {
        try {
            // Create email content
            String subject = "Password Reset Request";
            String resetLink = "http://localhost:8080/auth/reset-password?token=" + token;
            String body = "Hello,\n\n" +
                         "You have requested to reset your password. Please click the link below to reset your password:\n\n" +
                         resetLink + "\n\n" +
                         "This link will expire in 30 minutes.\n\n" +
                         "If you did not request this password reset, please ignore this email.\n\n" +
                         "Best regards,\n" +
                         "DevPort Team";

            // For demo purposes, log the reset link instead of sending actual email
            System.out.println("=== PASSWORD RESET EMAIL ===");
            System.out.println("To: " + email);
            System.out.println("Subject: " + subject);
            System.out.println("Reset Link: " + resetLink);
            System.out.println("===========================");

            // Try to send via email service, but continue if it fails
            try {
                Map<String, String> emailRequest = new HashMap<>();
                emailRequest.put("to", email);
                emailRequest.put("subject", subject);
                emailRequest.put("body", body);

                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.APPLICATION_JSON);
                HttpEntity<Map<String, String>> request = new HttpEntity<>(emailRequest, headers);

                String url = emailServiceUrl + "/api/email/send";
                restTemplate.postForObject(url, request, String.class);
                
                System.out.println("Password reset email sent to: " + email);
            } catch (Exception emailError) {
                System.err.println("Email service unavailable, but reset link logged above for demo: " + emailError.getMessage());
            }
        } catch (Exception e) {
            System.err.println("Failed to process password reset for " + email + ": " + e.getMessage());
        }
    }
}
