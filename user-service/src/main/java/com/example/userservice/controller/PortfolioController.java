package com.example.userservice.controller;

import com.example.userservice.dto.ContactMessageRequest;
import com.example.userservice.dto.ProfileUpdateRequest;
import com.example.userservice.dto.ProjectRequest;
import com.example.userservice.dto.ProjectResponse;
import com.example.userservice.dto.UserResponse;
import com.example.userservice.security.JwtUtil;
import com.example.userservice.service.ContactService;
import com.example.userservice.service.PortfolioService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import jakarta.servlet.http.HttpServletRequest;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/portfolio")
public class PortfolioController {

    @Autowired
    private PortfolioService portfolioService;

    @Autowired
    private ContactService contactService;

    @Autowired
    private JwtUtil jwtUtil;

    private Long extractUserIdFromToken(String token) {
        if (token != null && token.startsWith("Bearer ")) {
            token = token.substring(7);
            return jwtUtil.extractUserId(token);
        }
        throw new RuntimeException("Invalid authorization token");
    }

    @GetMapping("/profile")
    public ResponseEntity<?> getUserProfile(@RequestHeader("Authorization") String authToken) {
        try {
            Long userId = extractUserIdFromToken(authToken);
            UserResponse userProfile = portfolioService.getUserProfile(userId);
            return ResponseEntity.ok(userProfile);
        } catch (Exception e) {
            Map<String, String> response = new HashMap<>();
            response.put("message", "Failed to get user profile: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(@RequestHeader("Authorization") String authToken, 
                                         @RequestBody ProfileUpdateRequest request) {
        try {
            Long userId = extractUserIdFromToken(authToken);
            UserResponse updatedProfile = portfolioService.updateProfile(userId, request);
            return ResponseEntity.ok(updatedProfile);
        } catch (Exception e) {
            Map<String, String> response = new HashMap<>();
            response.put("message", "Failed to update profile: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @PostMapping("/profile/image")
    public ResponseEntity<?> uploadProfileImage(@RequestHeader("Authorization") String authToken,
                                              @RequestParam("file") MultipartFile file) {
        try {
            Long userId = extractUserIdFromToken(authToken);
            String imageUrl = portfolioService.uploadProfileImage(userId, file);
            
            Map<String, String> response = new HashMap<>();
            response.put("message", "Profile image uploaded successfully");
            response.put("imageUrl", imageUrl);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> response = new HashMap<>();
            response.put("message", "Failed to upload profile image: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @GetMapping("/projects")
    public ResponseEntity<?> getUserProjects(@RequestHeader("Authorization") String authToken) {
        try {
            Long userId = extractUserIdFromToken(authToken);
            List<ProjectResponse> projects = portfolioService.getUserProjects(userId);
            return ResponseEntity.ok(projects);
        } catch (Exception e) {
            Map<String, String> response = new HashMap<>();
            response.put("message", "Failed to get projects: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @PostMapping("/projects")
    public ResponseEntity<?> createProject(@RequestHeader("Authorization") String authToken,
                                         @RequestParam("name") String name,
                                         @RequestParam(value = "description", required = false) String description,
                                         @RequestParam(value = "demoUrl", required = false) String demoUrl,
                                         @RequestParam(value = "repositoryUrl", required = false) String repositoryUrl,
                                         @RequestParam(value = "image", required = false) MultipartFile imageFile) {
        try {
            Long userId = extractUserIdFromToken(authToken);
            
            ProjectRequest request = new ProjectRequest();
            request.setName(name);
            request.setDescription(description);
            request.setDemoUrl(demoUrl);
            request.setRepositoryUrl(repositoryUrl);
            
            ProjectResponse project = portfolioService.createProject(userId, request, imageFile);
            return ResponseEntity.ok(project);
        } catch (Exception e) {
            Map<String, String> response = new HashMap<>();
            response.put("message", "Failed to create project: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @PutMapping("/projects/{projectId}")
    public ResponseEntity<?> updateProject(@RequestHeader("Authorization") String authToken,
                                         @PathVariable Long projectId,
                                         @RequestParam("name") String name,
                                         @RequestParam(value = "description", required = false) String description,
                                         @RequestParam(value = "demoUrl", required = false) String demoUrl,
                                         @RequestParam(value = "repositoryUrl", required = false) String repositoryUrl,
                                         @RequestParam(value = "image", required = false) MultipartFile imageFile) {
        try {
            Long userId = extractUserIdFromToken(authToken);
            
            ProjectRequest request = new ProjectRequest();
            request.setName(name);
            request.setDescription(description);
            request.setDemoUrl(demoUrl);
            request.setRepositoryUrl(repositoryUrl);
            
            ProjectResponse project = portfolioService.updateProject(userId, projectId, request, imageFile);
            return ResponseEntity.ok(project);
        } catch (Exception e) {
            Map<String, String> response = new HashMap<>();
            response.put("message", "Failed to update project: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @DeleteMapping("/projects/{projectId}")
    public ResponseEntity<?> deleteProject(@RequestHeader("Authorization") String authToken,
                                         @PathVariable Long projectId) {
        try {
            Long userId = extractUserIdFromToken(authToken);
            portfolioService.deleteProject(userId, projectId);
            
            Map<String, String> response = new HashMap<>();
            response.put("message", "Project deleted successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> response = new HashMap<>();
            response.put("message", "Failed to delete project: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    // Public endpoint to view someone's portfolio
    @GetMapping("/public/{userId}")
    public ResponseEntity<?> getPublicPortfolio(@PathVariable Long userId, HttpServletRequest request) {
        try {
            UserResponse userProfile = portfolioService.getUserProfile(userId);
            
            // Check if portfolio is public
            if (!userProfile.getIsPortfolioPublic()) {
                Map<String, String> response = new HashMap<>();
                response.put("message", "This portfolio is private");
                return ResponseEntity.status(403).body(response);
            }
            
            List<ProjectResponse> projects = portfolioService.getUserProjects(userId);
            
            // Track portfolio view
            String visitorIp = getClientIpAddress(request);
            String userAgent = request.getHeader("User-Agent");
            portfolioService.trackPortfolioView(userId, visitorIp, userAgent);
            
            Map<String, Object> response = new HashMap<>();
            response.put("profile", userProfile);
            response.put("projects", projects);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> response = new HashMap<>();
            response.put("message", "Failed to get portfolio: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    // Contact message endpoint
    @PostMapping("/contact")
    public ResponseEntity<?> sendContactMessage(@Valid @RequestBody ContactMessageRequest request) {
        try {
            contactService.sendContactMessage(request);
            
            Map<String, String> response = new HashMap<>();
            response.put("message", "Contact message sent successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> response = new HashMap<>();
            response.put("message", "Failed to send contact message: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    // Helper method to get client IP address
    private String getClientIpAddress(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty()) {
            return xRealIp;
        }
        
        return request.getRemoteAddr();
    }
}