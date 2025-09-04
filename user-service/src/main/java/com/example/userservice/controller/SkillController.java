package com.example.userservice.controller;

import com.example.userservice.dto.AddUserSkillRequest;
import com.example.userservice.dto.SkillResponse;
import com.example.userservice.dto.UserSkillResponse;
import com.example.userservice.model.UserSkill;
import com.example.userservice.service.SkillService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/skills")
@CrossOrigin(origins = {"${frontend.url:http://localhost:3000}", "http://192.168.56.50:3000"})
public class SkillController {

    private static final Logger logger = LoggerFactory.getLogger(SkillController.class);

    @Autowired
    private SkillService skillService;

    @GetMapping
    public ResponseEntity<List<SkillResponse>> getAllSkills() {
        return ResponseEntity.ok(skillService.getAllSkills());
    }

    @GetMapping("/categories")
    public ResponseEntity<List<String>> getAllCategories() {
        return ResponseEntity.ok(skillService.getAllCategories());
    }

    @GetMapping("/categories/{category}")
    public ResponseEntity<List<SkillResponse>> getSkillsByCategory(@PathVariable String category) {
        return ResponseEntity.ok(skillService.getSkillsByCategory(category));
    }

    @GetMapping("/users/{userId}")
    public ResponseEntity<List<UserSkillResponse>> getUserSkills(@PathVariable Long userId) {
        return ResponseEntity.ok(skillService.getUserSkills(userId));
    }

    @PostMapping("/users/{userId}")
    public ResponseEntity<UserSkillResponse> addSkillToUser(
            @PathVariable Long userId,
            @RequestBody AddUserSkillRequest request) {
        try {
            logger.info("=== Backend Request Debug ===");
            logger.info("Path userId: {}", userId);
            logger.info("Request object: {}", request);
            logger.info("Request skillId: {}", request.getSkillId());
            logger.info("Request proficiencyLevel: {}", request.getProficiencyLevel());
            logger.info("=== End Backend Debug ===");
            
            UserSkillResponse response = skillService.addSkillToUser(userId, request);
            logger.info("Successfully added skill for userId: {}", userId);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            logger.error("Error adding skill for userId: {}, error: {}", userId, e.getMessage(), e);
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/users/{userId}/skills/{skillId}")
    public ResponseEntity<UserSkillResponse> updateUserSkill(
            @PathVariable Long userId,
            @PathVariable Long skillId,
            @RequestBody Map<String, String> request) {
        try {
            UserSkill.ProficiencyLevel proficiencyLevel = UserSkill.ProficiencyLevel.valueOf(
                    request.get("proficiencyLevel").toUpperCase());
            UserSkillResponse response = skillService.updateUserSkill(userId, skillId, proficiencyLevel);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/users/{userId}/skills/{skillId}")
    public ResponseEntity<Void> removeSkillFromUser(
            @PathVariable Long userId,
            @PathVariable Long skillId) {
        try {
            skillService.removeSkillFromUser(userId, skillId);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
}