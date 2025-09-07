package com.example.authservice.controller;

import com.example.authservice.repository.UserRepository;
import com.example.authservice.model.PasswordResetToken;
import com.example.authservice.model.RefreshToken;
import com.example.authservice.model.User;
import com.example.authservice.repository.PasswordResetTokenRepository;
import com.example.authservice.security.JwtUtil;
import com.example.authservice.security.UserDetailsServiceImpl;
import com.example.authservice.service.ForgotPasswordService;
import com.example.authservice.service.EmailVerificationService;
import com.example.authservice.service.RefreshTokenService;
import com.example.authservice.dto.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.view.RedirectView;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private UserDetailsServiceImpl userDetailsService;

    @Autowired
    private ForgotPasswordService forgotPasswordService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private PasswordResetTokenRepository passwordResetTokenRepository;

    @Autowired
    private EmailVerificationService emailVerificationService;

    @Autowired
    private RefreshTokenService refreshTokenService;

    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@RequestBody LoginRequest loginRequest) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(loginRequest.getEmail(), loginRequest.getPassword()));

            SecurityContextHolder.getContext().setAuthentication(authentication);

            // Get user from database to include email verification status
            User user = userRepository.findByEmail(loginRequest.getEmail());
            if (user == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(new MessageResponse("User not found"));
            }

            final String accessToken = jwtUtil.generateTokenWithUser(user);
            RefreshToken refreshToken = refreshTokenService.createRefreshToken(user);

            return ResponseEntity.ok(new LoginResponse(accessToken, refreshToken.getToken()));
        } catch (BadCredentialsException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new MessageResponse("Invalid username or password"));
        } catch (Exception e) {
            System.out.println("Authentication error: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new MessageResponse("Authentication failed"));
        }
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody ForgotPasswordRequest forgotPasswordRequest) {
        forgotPasswordService.createPasswordResetTokenForUser(forgotPasswordRequest.getEmail());
        return ResponseEntity.ok(new MessageResponse("Password reset link sent if email exists."));
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody RegisterRequest registerRequest) {
        if (userRepository.findByEmail(registerRequest.getEmail()) != null) {
            return ResponseEntity.badRequest().body(new MessageResponse("Email is already in use!"));
        }

        User user = new User();
        user.setName(registerRequest.getName());
        user.setEmail(registerRequest.getEmail());
        user.setPassword(passwordEncoder.encode(registerRequest.getPassword()));
        user.setEmailVerified(false); // New users need email verification

        userRepository.save(user);

        // Send verification email
        emailVerificationService.sendVerificationEmail(user);

        return ResponseEntity.ok(new MessageResponse("User registered successfully! Please check your email to verify your account."));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestParam("token") String token, @RequestBody ResetPasswordRequest request) {
        PasswordResetToken resetToken = passwordResetTokenRepository.findByToken(token);
        
        if (resetToken == null) {
            return ResponseEntity.badRequest().body(new MessageResponse("Invalid reset token"));
        }
        
        if (resetToken.getExpiryDate().isBefore(LocalDateTime.now())) {
            return ResponseEntity.badRequest().body(new MessageResponse("Reset token has expired"));
        }
        
        User user = resetToken.getUser();
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        
        passwordResetTokenRepository.delete(resetToken);
        
        return ResponseEntity.ok(new MessageResponse("Password reset successfully"));
    }

    @GetMapping("/verify-email")
    public ResponseEntity<?> verifyEmail(@RequestParam("token") String token) {
        boolean verified = emailVerificationService.verifyEmail(token);
        
        if (verified) {
            return ResponseEntity.ok(new MessageResponse("Email verified successfully!"));
        } else {
            return ResponseEntity.badRequest().body(new MessageResponse("Invalid or expired verification token"));
        }
    }

    @PostMapping("/resend-verification")
    public ResponseEntity<?> resendVerificationEmail(@RequestParam("email") String email) {
        User user = userRepository.findByEmail(email);
        
        if (user == null) {
            return ResponseEntity.badRequest().body(new MessageResponse("User not found"));
        }
        
        if (user.getEmailVerified()) {
            return ResponseEntity.badRequest().body(new MessageResponse("Email is already verified"));
        }
        
        emailVerificationService.sendVerificationEmail(user);
        return ResponseEntity.ok(new MessageResponse("Verification email sent successfully"));
    }

    @GetMapping("/oauth2/authorize/github")
    public RedirectView redirectToGitHub() {
        return new RedirectView("/oauth2/authorization/github");
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getUserById(@PathVariable Long userId) {
        User user = userRepository.findById(userId).orElse(null);
        
        if (user == null) {
            return ResponseEntity.notFound().build();
        }
        
        // Return basic user info for chat service
        Map<String, Object> userInfo = new HashMap<>();
        userInfo.put("id", user.getId());
        userInfo.put("name", user.getName());
        userInfo.put("email", user.getEmail());
        // Add /minio prefix to profile image URL if it exists
        String profileImageUrl = user.getProfileImageUrl();
        if (profileImageUrl != null && !profileImageUrl.isEmpty() && !profileImageUrl.startsWith("http")) {
            profileImageUrl = "/minio" + (profileImageUrl.startsWith("/") ? "" : "/") + profileImageUrl;
        }
        userInfo.put("profileImageUrl", profileImageUrl);
        
        return ResponseEntity.ok(userInfo);
    }

    @PostMapping("/refresh-token")
    public ResponseEntity<?> refreshToken(@RequestBody RefreshTokenRequest request) {
        try {
            String refreshToken = request.getRefreshToken();
            
            // Check if token exists and is valid
            Optional<RefreshToken> refreshTokenOpt = refreshTokenService.findValidToken(refreshToken);
            if (refreshTokenOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(new MessageResponse("Invalid or expired refresh token"));
            }
            
            RefreshToken dbRefreshToken = refreshTokenOpt.get();
            
            // Check if token is blacklisted
            if (dbRefreshToken.getIsBlacklisted()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(new MessageResponse("Refresh token is blacklisted"));
            }
            
            // Verify token expiration
            if (!refreshTokenService.verifyExpiration(dbRefreshToken)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(new MessageResponse("Refresh token expired"));
            }
            
            // Blacklist the used refresh token (one-time use)
            refreshTokenService.blacklistToken(refreshToken);
            
            User user = dbRefreshToken.getUser();
            
            // Generate new access token and new refresh token
            String newAccessToken = jwtUtil.generateTokenWithUser(user);
            RefreshToken newRefreshToken = refreshTokenService.createRefreshToken(user);
            
            return ResponseEntity.ok(new LoginResponse(newAccessToken, newRefreshToken.getToken()));
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new MessageResponse("Token refresh failed"));
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(@RequestBody RefreshTokenRequest request) {
        try {
            String refreshToken = request.getRefreshToken();
            refreshTokenService.blacklistToken(refreshToken);
            return ResponseEntity.ok(new MessageResponse("Successfully logged out"));
        } catch (Exception e) {
            return ResponseEntity.ok(new MessageResponse("Logout completed"));
        }
    }
}