package com.example.userservice.dto;

import java.util.List;

public class UserResponse {
    private Long id;
    private String name;
    private String email;
    private String jobTitle;
    private String bio;
    private String profileImageUrl;
    private List<UserSkillResponse> skills;
    private Boolean showSkillLevel;

    public UserResponse() {
    }

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

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getJobTitle() {
        return jobTitle;
    }

    public void setJobTitle(String jobTitle) {
        this.jobTitle = jobTitle;
    }

    public String getBio() {
        return bio;
    }

    public void setBio(String bio) {
        this.bio = bio;
    }

    public String getProfileImageUrl() {
        return profileImageUrl;
    }

    public void setProfileImageUrl(String profileImageUrl) {
        this.profileImageUrl = profileImageUrl;
    }

    public List<UserSkillResponse> getSkills() {
        return skills;
    }

    public void setSkills(List<UserSkillResponse> skills) {
        this.skills = skills;
    }

    public Boolean getShowSkillLevel() {
        return showSkillLevel;
    }

    public void setShowSkillLevel(Boolean showSkillLevel) {
        this.showSkillLevel = showSkillLevel;
    }
}