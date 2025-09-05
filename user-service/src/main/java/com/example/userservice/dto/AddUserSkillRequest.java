package com.example.userservice.dto;

import com.example.userservice.model.UserSkill;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AddUserSkillRequest {
    @NotNull
    private Long skillId;
    
    private UserSkill.ProficiencyLevel proficiencyLevel = UserSkill.ProficiencyLevel.INTERMEDIATE;

    
    @Override
    public String toString() {
        return "AddUserSkillRequest{" +
                "skillId=" + skillId +
                ", proficiencyLevel=" + proficiencyLevel +
                '}';
    }
}