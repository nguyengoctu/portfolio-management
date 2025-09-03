package com.example.userservice.dto;

import com.example.userservice.model.UserSkill;

public class UserSkillResponse {
    private Long id;
    private SkillResponse skill;
    private UserSkill.ProficiencyLevel proficiencyLevel;

    public UserSkillResponse() {}

    public UserSkillResponse(Long id, SkillResponse skill, UserSkill.ProficiencyLevel proficiencyLevel) {
        this.id = id;
        this.skill = skill;
        this.proficiencyLevel = proficiencyLevel;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public SkillResponse getSkill() {
        return skill;
    }

    public void setSkill(SkillResponse skill) {
        this.skill = skill;
    }

    public UserSkill.ProficiencyLevel getProficiencyLevel() {
        return proficiencyLevel;
    }

    public void setProficiencyLevel(UserSkill.ProficiencyLevel proficiencyLevel) {
        this.proficiencyLevel = proficiencyLevel;
    }
}