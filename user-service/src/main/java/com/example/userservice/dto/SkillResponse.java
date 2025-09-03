package com.example.userservice.dto;

public class SkillResponse {
    private Long id;
    private String name;
    private String category;
    private String color;

    public SkillResponse() {}

    public SkillResponse(Long id, String name, String category, String color) {
        this.id = id;
        this.name = name;
        this.category = category;
        this.color = color;
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

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getColor() {
        return color;
    }

    public void setColor(String color) {
        this.color = color;
    }
}