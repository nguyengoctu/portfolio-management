package com.example.userservice.repository;

import com.example.userservice.model.PortfolioView;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface PortfolioViewRepository extends JpaRepository<PortfolioView, Long> {
    
    // Count total views for a user
    long countByUserId(Long userId);
    
    // Check if IP has visited recently (within last hour to prevent spam)
    boolean existsByUserIdAndVisitorIpAndViewedAtAfter(Long userId, String visitorIp, LocalDateTime after);
    
    // Get recent views for analytics
    List<PortfolioView> findByUserIdAndViewedAtAfterOrderByViewedAtDesc(Long userId, LocalDateTime after);
    
    // Daily view count
    @Query("SELECT COUNT(pv) FROM PortfolioView pv WHERE pv.userId = :userId AND DATE(pv.viewedAt) = CURRENT_DATE")
    long getTodayViewCount(@Param("userId") Long userId);
}