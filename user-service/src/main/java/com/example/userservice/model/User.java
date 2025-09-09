package com.example.userservice.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;

@Entity
@Table(name = "users")
@Data
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
    private String email;
    private String jobTitle;
    private String bio;
    private String profileImageUrl;
    private String avatarUrl;
    private Boolean showSkillLevel = true;
    private Long portfolioViews = 0L;
    private Boolean isPortfolioPublic = true;

}