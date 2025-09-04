package com.example.userservice.dto;

public class ProfileUpdateRequest {
    private String name;
    private String email;
    private String jobTitle;
    private String bio;
    private Boolean showSkillLevel;

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

    public Boolean getShowSkillLevel() {
        return showSkillLevel;
    }

    public void setShowSkillLevel(Boolean showSkillLevel) {
        this.showSkillLevel = showSkillLevel;
    }
}