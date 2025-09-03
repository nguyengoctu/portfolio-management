package com.example.userservice.dto;

import com.example.userservice.model.UserSkill;
import jakarta.validation.constraints.NotNull;

public class AddUserSkillRequest {
    @NotNull
    private Long skillId;
    
    private UserSkill.ProficiencyLevel proficiencyLevel = UserSkill.ProficiencyLevel.INTERMEDIATE;

    public Long getSkillId() {
        return skillId;
    }

    public void setSkillId(Long skillId) {
        this.skillId = skillId;
    }

    public UserSkill.ProficiencyLevel getProficiencyLevel() {
        return proficiencyLevel;
    }

    public void setProficiencyLevel(UserSkill.ProficiencyLevel proficiencyLevel) {
        this.proficiencyLevel = proficiencyLevel;
    }
    
    @Override
    public String toString() {
        return "AddUserSkillRequest{" +
                "skillId=" + skillId +
                ", proficiencyLevel=" + proficiencyLevel +
                '}';
    }
}