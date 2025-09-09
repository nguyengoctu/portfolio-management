package com.example.userservice.dto;

import lombok.Data;

@Data
public class ProfileUpdateRequest {
    private String name;
    private String email;
    private String jobTitle;
    private String bio;
    private Boolean showSkillLevel;
    private Boolean isPortfolioPublic;

}