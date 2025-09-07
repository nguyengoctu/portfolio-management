package com.example.authservice.service;

import com.example.authservice.model.RefreshToken;
import com.example.authservice.model.User;
import com.example.authservice.repository.RefreshTokenRepository;
import com.example.authservice.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class RefreshTokenService {

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @Autowired
    private JwtUtil jwtUtil;

    @Transactional
    public RefreshToken createRefreshToken(User user) {
        // Blacklist any existing valid tokens for the user (ensure only one valid token per user)
        blacklistAllUserTokens(user);
        
        // Generate new refresh token
        String token = jwtUtil.generateRefreshToken(user);
        
        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setToken(token);
        refreshToken.setUser(user);
        refreshToken.setExpiryDate(LocalDateTime.now().plusDays(7)); // 7 days expiry
        refreshToken.setIsBlacklisted(false);
        
        return refreshTokenRepository.save(refreshToken);
    }

    public Optional<RefreshToken> findValidToken(String token) {
        return refreshTokenRepository.findValidToken(token, LocalDateTime.now());
    }

    @Transactional
    public void blacklistToken(String token) {
        refreshTokenRepository.blacklistToken(token);
    }

    @Transactional
    private void blacklistAllUserTokens(User user) {
        user.getRefreshTokens().forEach(token -> {
            if (!token.isExpired() && !token.getIsBlacklisted()) {
                token.setIsBlacklisted(true);
            }
        });
    }

    @Transactional
    public void cleanupExpiredTokens() {
        refreshTokenRepository.deleteExpiredTokens(LocalDateTime.now());
    }

    public boolean verifyExpiration(RefreshToken token) {
        if (token.isExpired()) {
            refreshTokenRepository.delete(token);
            return false;
        }
        return true;
    }

    public boolean isTokenBlacklisted(String token) {
        Optional<RefreshToken> refreshToken = refreshTokenRepository.findByToken(token);
        return refreshToken.map(RefreshToken::getIsBlacklisted).orElse(true);
    }
}