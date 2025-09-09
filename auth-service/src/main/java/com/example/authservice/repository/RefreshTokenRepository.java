package com.example.authservice.repository;

import com.example.authservice.model.RefreshToken;
import com.example.authservice.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {
    
    Optional<RefreshToken> findByToken(String token);
    
    @Query("SELECT rt FROM RefreshToken rt WHERE rt.token = ?1 AND rt.isBlacklisted = false AND rt.expiryDate > ?2")
    Optional<RefreshToken> findValidToken(String token, LocalDateTime currentTime);
    
    void deleteByUser(User user);
    
    @Modifying
    @Transactional
    @Query("UPDATE RefreshToken rt SET rt.isBlacklisted = true WHERE rt.token = ?1")
    void blacklistToken(String token);
    
    @Modifying
    @Transactional
    @Query("DELETE FROM RefreshToken rt WHERE rt.expiryDate < ?1")
    void deleteExpiredTokens(LocalDateTime currentTime);
    
    @Query("SELECT COUNT(rt) FROM RefreshToken rt WHERE rt.user = ?1 AND rt.isBlacklisted = false AND rt.expiryDate > ?2")
    long countValidTokensByUser(User user, LocalDateTime currentTime);
}