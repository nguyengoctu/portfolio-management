package com.example.authservice.service;

import com.example.authservice.model.EmailVerificationToken;
import com.example.authservice.model.User;
import com.example.authservice.repository.EmailVerificationTokenRepository;
import com.example.authservice.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
public class EmailVerificationService {

    @Autowired
    private EmailVerificationTokenRepository tokenRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RestTemplate restTemplate;

    @Value("${frontend.url}")
    private String frontendUrl;

    @Value("${email.service.url}")
    private String emailServiceUrl;

    @Transactional
    public void sendVerificationEmail(User user) {
        // Delete any existing unused tokens for this user
        Optional<EmailVerificationToken> existingToken = tokenRepository.findByUserIdAndUsedFalse(user.getId());
        existingToken.ifPresent(token -> tokenRepository.delete(token));

        // Generate new verification token
        String token = UUID.randomUUID().toString();
        LocalDateTime expiresAt = LocalDateTime.now().plusHours(24); // Token expires in 24 hours

        EmailVerificationToken verificationToken = new EmailVerificationToken(user, token, expiresAt);
        tokenRepository.save(verificationToken);

        // Send verification email
        sendEmail(user.getEmail(), user.getName(), token);
    }

    private void sendEmail(String email, String name, String token) {
        try {
            String verificationLink = frontendUrl + "/verify-email?token=" + token;
            
            Map<String, Object> emailData = new HashMap<>();
            emailData.put("to", email);
            emailData.put("subject", "Account Verification - Portfolio Management");
            
            String htmlContent = String.format(
                "<html><body style='font-family: Arial, sans-serif;'>" +
                "<div style='max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;'>" +
                "<h2 style='color: #333; text-align: center;'>Welcome to Portfolio Management!</h2>" +
                "<p>Hello <strong>%s</strong>,</p>" +
                "<p>Thank you for registering an account. To complete the registration process, please click the link below to verify your email:</p>" +
                "<div style='text-align: center; margin: 30px 0;'>" +
                "<a href='%s' style='background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;'>Verify Email</a>" +
                "</div>" +
                "<p>Or copy and paste this link into your browser:</p>" +
                "<p style='word-break: break-all; background-color: #f8f9fa; padding: 10px; border-radius: 5px;'><code>%s</code></p>" +
                "<p style='color: #666; font-size: 14px;'>This link will expire in 24 hours.</p>" +
                "<p style='color: #999; font-size: 12px; margin-top: 30px;'>If you did not register for this account, please ignore this email.</p>" +
                "</div></body></html>",
                name, verificationLink, verificationLink
            );
            
            emailData.put("html", htmlContent);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(emailData, headers);

            ResponseEntity<String> response = restTemplate.postForEntity(
                emailServiceUrl + "/api/email/send", request, String.class);

            System.out.println("Email sent successfully: " + response.getStatusCode());
        } catch (Exception e) {
            System.err.println("Failed to send verification email: " + e.getMessage());
            e.printStackTrace();
        }
    }

    @Transactional
    public boolean verifyEmail(String token) {
        Optional<EmailVerificationToken> optionalToken = tokenRepository.findByToken(token);
        
        if (optionalToken.isEmpty()) {
            return false;
        }

        EmailVerificationToken verificationToken = optionalToken.get();
        
        if (verificationToken.getUsed() || verificationToken.isExpired()) {
            return false;
        }

        // Mark token as used
        verificationToken.setUsed(true);
        tokenRepository.save(verificationToken);

        // Mark user as verified
        User user = verificationToken.getUser();
        user.setEmailVerified(true);
        userRepository.save(user);

        return true;
    }

    @Transactional
    public void cleanupExpiredTokens() {
        tokenRepository.deleteExpiredTokens(LocalDateTime.now());
    }
}