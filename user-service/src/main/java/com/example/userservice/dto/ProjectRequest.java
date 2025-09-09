package com.example.userservice.dto;

import lombok.Data;

@Data
public class ProjectRequest {
    private String name;
    private String description;
    private String demoUrl;
    private String repositoryUrl;

}