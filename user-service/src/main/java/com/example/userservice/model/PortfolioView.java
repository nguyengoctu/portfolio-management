package com.example.userservice.model;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "portfolio_views")
public class PortfolioView {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "user_id", nullable = false)
    private Long userId;
    
    @Column(name = "visitor_ip", length = 45)
    private String visitorIp;
    
    @Column(name = "user_agent", columnDefinition = "TEXT")
    private String userAgent;
    
    @Column(name = "viewed_at")
    private LocalDateTime viewedAt = LocalDateTime.now();
    
    public PortfolioView() {}
    
    public PortfolioView(Long userId, String visitorIp, String userAgent) {
        this.userId = userId;
        this.visitorIp = visitorIp;
        this.userAgent = userAgent;
        this.viewedAt = LocalDateTime.now();
    }
    
    @PrePersist
    protected void onCreate() {
        viewedAt = LocalDateTime.now();
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public Long getUserId() {
        return userId;
    }
    
    public void setUserId(Long userId) {
        this.userId = userId;
    }
    
    public String getVisitorIp() {
        return visitorIp;
    }
    
    public void setVisitorIp(String visitorIp) {
        this.visitorIp = visitorIp;
    }
    
    public String getUserAgent() {
        return userAgent;
    }
    
    public void setUserAgent(String userAgent) {
        this.userAgent = userAgent;
    }
    
    public LocalDateTime getViewedAt() {
        return viewedAt;
    }
    
    public void setViewedAt(LocalDateTime viewedAt) {
        this.viewedAt = viewedAt;
    }
}