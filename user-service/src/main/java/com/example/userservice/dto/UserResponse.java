package com.example.userservice.dto;

import java.util.List;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
public class UserResponse {
    private Long id;
    private String name;
    private String email;
    private String jobTitle;
    private String bio;
    private String profileImageUrl;
    private List<UserSkillResponse> skills;
    private Boolean showSkillLevel;
    private Long portfolioViews;
    private Boolean isPortfolioPublic;

    public UserResponse(Long id, String name, String email) {
        this.id = id;
        this.name = name;
        this.email = email;
    }

    public UserResponse(Long id, String name, String email, String jobTitle, String bio, String profileImageUrl) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.jobTitle = jobTitle;
        this.bio = bio;
        this.profileImageUrl = profileImageUrl;
    }
}