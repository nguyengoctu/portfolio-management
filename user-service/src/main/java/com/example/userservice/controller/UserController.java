package com.example.userservice.controller;

import com.example.userservice.model.User;
import com.example.userservice.repository.UserRepository;
import com.example.userservice.dto.UserResponse;
import com.example.userservice.service.SkillService;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.crypto.SecretKey;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private SkillService skillService;

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${APP_URL:${minio.url}}")
    private String appUrl;

    @GetMapping("/profile")
    public ResponseEntity<UserResponse> getUserProfile(@RequestHeader("Authorization") String authorizationHeader) {
        try {
            String token = authorizationHeader.substring(7);
            String email = extractEmailFromToken(token);
            
            User user = userRepository.findByEmail(email);
            if (user == null) {
                return ResponseEntity.notFound().build();
            }
            
            UserResponse userResponse = new UserResponse(user.getId(), user.getName(), user.getEmail(),
                    user.getJobTitle(), user.getBio(), user.getProfileImageUrl(), user.getAvatarUrl());
            userResponse.setSkills(skillService.getUserSkills(user.getId()));
            return ResponseEntity.ok(userResponse);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserResponse> getUserById(@PathVariable Long id) {
        return userRepository.findById(id)
                .map(user -> {
                    UserResponse userResponse = new UserResponse(user.getId(), user.getName(), user.getEmail(),
                            user.getJobTitle(), user.getBio(), user.getProfileImageUrl(), user.getAvatarUrl());
                    userResponse.setSkills(skillService.getUserSkills(user.getId()));
                    return ResponseEntity.ok(userResponse);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping
    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(user -> new UserResponse(user.getId(), user.getName(), user.getEmail()))
                .collect(Collectors.toList());
    }

    @GetMapping("/popular")
    public ResponseEntity<List<UserResponse>> getPopularPortfolios(@RequestParam(defaultValue = "12") int limit) {
        try {
            List<User> popularUsers = userRepository.findTopUsersByPortfolioViews(limit);
            List<UserResponse> userResponses = popularUsers.stream()
                    .map(user -> {
                        String fullProfileImageUrl = user.getProfileImageUrl() != null ? 
                            appUrl + "/minio" + user.getProfileImageUrl() : null;
                        UserResponse response = new UserResponse(user.getId(), user.getName(), user.getEmail(),
                                user.getJobTitle(), user.getBio(), fullProfileImageUrl, user.getAvatarUrl());
                        response.setPortfolioViews(user.getPortfolioViews());
                        response.setIsPortfolioPublic(user.getIsPortfolioPublic());
                        return response;
                    })
                    .collect(Collectors.toList());
            return ResponseEntity.ok(userResponses);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    private String extractEmailFromToken(String token) {
        byte[] keyBytes = Decoders.BASE64.decode(jwtSecret);
        SecretKey key = Keys.hmacShaKeyFor(keyBytes);
        
        Claims claims = Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
        
        return claims.getSubject();
    }
}