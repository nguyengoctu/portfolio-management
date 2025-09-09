package com.example.userservice.dto;

import java.time.LocalDateTime;
import lombok.Data;

@Data
public class ProjectResponse {
    private Long id;
    private String name;
    private String description;
    private String demoUrl;
    private String repositoryUrl;
    private String imageUrl;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

}