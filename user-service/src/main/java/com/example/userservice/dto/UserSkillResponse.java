package com.example.userservice.dto;

import com.example.userservice.model.UserSkill;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserSkillResponse {
    private Long id;
    private SkillResponse skill;
    private UserSkill.ProficiencyLevel proficiencyLevel;

}