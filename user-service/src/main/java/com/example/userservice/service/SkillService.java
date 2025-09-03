package com.example.userservice.service;

import com.example.userservice.dto.SkillResponse;
import com.example.userservice.dto.UserSkillResponse;
import com.example.userservice.dto.AddUserSkillRequest;
import com.example.userservice.model.Skill;
import com.example.userservice.model.UserSkill;
import com.example.userservice.repository.SkillRepository;
import com.example.userservice.repository.UserSkillRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class SkillService {

    @Autowired
    private SkillRepository skillRepository;

    @Autowired
    private UserSkillRepository userSkillRepository;

    public List<SkillResponse> getAllSkills() {
        return skillRepository.findAllOrderByCategoryAndName()
                .stream()
                .map(this::convertToSkillResponse)
                .collect(Collectors.toList());
    }

    public List<String> getAllCategories() {
        return skillRepository.findAllCategories();
    }

    public List<SkillResponse> getSkillsByCategory(String category) {
        return skillRepository.findByCategory(category)
                .stream()
                .map(this::convertToSkillResponse)
                .collect(Collectors.toList());
    }

    public List<UserSkillResponse> getUserSkills(Long userId) {
        return userSkillRepository.findByUserIdWithSkill(userId)
                .stream()
                .map(this::convertToUserSkillResponse)
                .collect(Collectors.toList());
    }

    public UserSkillResponse addSkillToUser(Long userId, AddUserSkillRequest request) {
        Optional<Skill> skill = skillRepository.findById(request.getSkillId());
        if (skill.isEmpty()) {
            throw new RuntimeException("Skill not found");
        }

        if (userSkillRepository.existsByUserIdAndSkillId(userId, request.getSkillId())) {
            throw new RuntimeException("User already has this skill");
        }

        UserSkill userSkill = new UserSkill();
        userSkill.setUserId(userId);
        userSkill.setSkill(skill.get());
        userSkill.setProficiencyLevel(request.getProficiencyLevel());

        UserSkill savedUserSkill = userSkillRepository.save(userSkill);
        return convertToUserSkillResponse(savedUserSkill);
    }

    public UserSkillResponse updateUserSkill(Long userId, Long skillId, UserSkill.ProficiencyLevel proficiencyLevel) {
        Optional<UserSkill> userSkill = userSkillRepository.findByUserIdAndSkillId(userId, skillId);
        if (userSkill.isEmpty()) {
            throw new RuntimeException("User skill not found");
        }

        userSkill.get().setProficiencyLevel(proficiencyLevel);
        UserSkill updatedUserSkill = userSkillRepository.save(userSkill.get());
        return convertToUserSkillResponse(updatedUserSkill);
    }

    public void removeSkillFromUser(Long userId, Long skillId) {
        if (!userSkillRepository.existsByUserIdAndSkillId(userId, skillId)) {
            throw new RuntimeException("User skill not found");
        }
        userSkillRepository.deleteByUserIdAndSkillId(userId, skillId);
    }

    private SkillResponse convertToSkillResponse(Skill skill) {
        return new SkillResponse(
                skill.getId(),
                skill.getName(),
                skill.getCategory(),
                skill.getColor()
        );
    }

    private UserSkillResponse convertToUserSkillResponse(UserSkill userSkill) {
        SkillResponse skillResponse = convertToSkillResponse(userSkill.getSkill());
        return new UserSkillResponse(
                userSkill.getId(),
                skillResponse,
                userSkill.getProficiencyLevel()
        );
    }
}