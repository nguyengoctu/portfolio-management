package com.example.userservice.model;

import jakarta.persistence.*;

import java.time.LocalDateTime;
import lombok.Data;

@Entity
@Table(name = "portfolio_views")
@Data
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
    
}