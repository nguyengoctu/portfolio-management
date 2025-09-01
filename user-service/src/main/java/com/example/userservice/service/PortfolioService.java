package com.example.userservice.service;

import com.example.userservice.dto.ProfileUpdateRequest;
import com.example.userservice.dto.ProjectRequest;
import com.example.userservice.dto.ProjectResponse;
import com.example.userservice.dto.UserResponse;
import com.example.userservice.model.Project;
import com.example.userservice.model.User;
import com.example.userservice.repository.ProjectRepository;
import com.example.userservice.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class PortfolioService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private MinIOService minIOService;

    public UserResponse getUserProfile(Long userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        return new UserResponse(
            user.getId(),
            user.getName(),
            user.getEmail(),
            user.getJobTitle(),
            user.getBio(),
            user.getProfileImageUrl()
        );
    }

    @Transactional
    public UserResponse updateProfile(Long userId, ProfileUpdateRequest request) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));

        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setJobTitle(request.getJobTitle());
        user.setBio(request.getBio());

        user = userRepository.save(user);

        return new UserResponse(
            user.getId(),
            user.getName(),
            user.getEmail(),
            user.getJobTitle(),
            user.getBio(),
            user.getProfileImageUrl()
        );
    }

    @Transactional
    public String uploadProfileImage(Long userId, MultipartFile file) throws Exception {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));

        // Delete old profile image if exists
        if (user.getProfileImageUrl() != null) {
            minIOService.deleteFile(user.getProfileImageUrl());
        }

        // Upload new image
        String imageUrl = minIOService.uploadProfileImage(file, userId);
        user.setProfileImageUrl(imageUrl);
        userRepository.save(user);

        return imageUrl;
    }

    public List<ProjectResponse> getUserProjects(Long userId) {
        List<Project> projects = projectRepository.findByUserIdOrderByCreatedAtDesc(userId);
        return projects.stream()
            .map(this::convertToProjectResponse)
            .collect(Collectors.toList());
    }

    @Transactional
    public ProjectResponse createProject(Long userId, ProjectRequest request, MultipartFile imageFile) throws Exception {
        Project project = new Project();
        project.setUserId(userId);
        project.setName(request.getName());
        project.setDescription(request.getDescription());
        project.setDemoUrl(request.getDemoUrl());
        project.setRepositoryUrl(request.getRepositoryUrl());

        if (imageFile != null && !imageFile.isEmpty()) {
            String imageUrl = minIOService.uploadProjectImage(imageFile, userId);
            project.setImageUrl(imageUrl);
        }

        project = projectRepository.save(project);
        return convertToProjectResponse(project);
    }

    @Transactional
    public ProjectResponse updateProject(Long userId, Long projectId, ProjectRequest request, MultipartFile imageFile) throws Exception {
        Project project = projectRepository.findById(projectId)
            .orElseThrow(() -> new RuntimeException("Project not found"));

        if (!project.getUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized to update this project");
        }

        project.setName(request.getName());
        project.setDescription(request.getDescription());
        project.setDemoUrl(request.getDemoUrl());
        project.setRepositoryUrl(request.getRepositoryUrl());

        if (imageFile != null && !imageFile.isEmpty()) {
            // Delete old image if exists
            if (project.getImageUrl() != null) {
                minIOService.deleteFile(project.getImageUrl());
            }
            
            // Upload new image
            String imageUrl = minIOService.uploadProjectImage(imageFile, userId);
            project.setImageUrl(imageUrl);
        }

        project = projectRepository.save(project);
        return convertToProjectResponse(project);
    }

    @Transactional
    public void deleteProject(Long userId, Long projectId) {
        Project project = projectRepository.findById(projectId)
            .orElseThrow(() -> new RuntimeException("Project not found"));

        if (!project.getUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized to delete this project");
        }

        // Delete image if exists
        if (project.getImageUrl() != null) {
            minIOService.deleteFile(project.getImageUrl());
        }

        projectRepository.delete(project);
    }

    private ProjectResponse convertToProjectResponse(Project project) {
        ProjectResponse response = new ProjectResponse();
        response.setId(project.getId());
        response.setName(project.getName());
        response.setDescription(project.getDescription());
        response.setDemoUrl(project.getDemoUrl());
        response.setRepositoryUrl(project.getRepositoryUrl());
        response.setImageUrl(project.getImageUrl());
        response.setCreatedAt(project.getCreatedAt());
        response.setUpdatedAt(project.getUpdatedAt());
        return response;
    }
}