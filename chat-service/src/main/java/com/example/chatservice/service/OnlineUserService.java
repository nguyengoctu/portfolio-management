package com.example.chatservice.service;

import com.example.chatservice.model.OnlineUser;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class OnlineUserService {
    private static final Logger logger = LoggerFactory.getLogger(OnlineUserService.class);
    
    private final Map<Long, OnlineUser> onlineUsers = new ConcurrentHashMap<>();
    private final RestTemplate restTemplate = new RestTemplate();
    
    // This should be injected from configuration
    private static final String AUTH_SERVICE_URL = "http://auth-service:8082";

    public void addOnlineUser(Long userId) {
        logger.info("Adding user {} to online users", userId);
        // Fetch user info from auth service
        OnlineUser user = fetchUserInfo(userId);
        if (user != null) {
            onlineUsers.put(userId, user);
            logger.info("Successfully added user {} to online list. Total users: {}", userId, onlineUsers.size());
        } else {
            logger.error("Failed to add user {} - user info is null", userId);
        }
    }

    public void removeOnlineUser(Long userId) {
        onlineUsers.remove(userId);
    }

    public List<OnlineUser> getOnlineUsers() {
        return new ArrayList<>(onlineUsers.values());
    }

    public OnlineUser getOnlineUser(Long userId) {
        return onlineUsers.get(userId);
    }

    public boolean isUserOnline(Long userId) {
        return onlineUsers.containsKey(userId);
    }

    @SuppressWarnings("unchecked")
    private OnlineUser fetchUserInfo(Long userId) {
        try {
            System.out.println("Fetching user info for userId: " + userId);
            // Fetch real user from auth service
            String url = AUTH_SERVICE_URL + "/api/auth/user/" + userId;
            System.out.println("Calling auth service URL: " + url);
            
            Map<String, Object> response = restTemplate.getForObject(url, Map.class);
            
            if (response != null) {
                System.out.println("Got response from auth service: " + response);
                OnlineUser user = new OnlineUser();
                user.setId(userId);
                user.setName((String) response.get("name"));
                user.setEmail((String) response.get("email"));
                user.setProfileImageUrl((String) response.get("profileImageUrl"));
                return user;
            } else {
                System.err.println("Auth service returned null response");
            }
        } catch (Exception e) {
            System.err.println("Failed to fetch user info for userId: " + userId + ", error: " + e.getMessage());
            e.printStackTrace();
            
            // Fallback to minimal user info if auth service unavailable
            System.out.println("Using fallback user info for userId: " + userId);
            OnlineUser user = new OnlineUser();
            user.setId(userId);
            user.setName("User " + userId);
            user.setEmail("user" + userId + "@example.com");
            user.setProfileImageUrl("/assets/default-avatar.png");
            return user;
        }
        return null;
    }
}