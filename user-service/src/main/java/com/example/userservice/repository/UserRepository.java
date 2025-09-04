package com.example.userservice.repository;

import com.example.userservice.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface UserRepository extends JpaRepository<User, Long> {
    User findByEmail(String email);
    
    @Query(value = "SELECT * FROM users WHERE portfolio_views > 0 AND is_portfolio_public = TRUE ORDER BY portfolio_views DESC LIMIT ?1", nativeQuery = true)
    List<User> findTopUsersByPortfolioViews(int limit);
}