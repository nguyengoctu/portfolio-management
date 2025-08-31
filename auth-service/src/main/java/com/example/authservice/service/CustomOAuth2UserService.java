package com.example.authservice.service;

import com.example.authservice.model.User;
import com.example.authservice.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    @Autowired
    private UserRepository userRepository;

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oauth2User = super.loadUser(userRequest);
        
        return processOAuth2User(userRequest, oauth2User);
    }

    private OAuth2User processOAuth2User(OAuth2UserRequest userRequest, OAuth2User oauth2User) {
        String registrationId = userRequest.getClientRegistration().getRegistrationId();
        
        User user = null;
        
        if ("github".equals(registrationId)) {
            user = processGitHubUser(oauth2User);
        }
        
        if (user == null) {
            throw new OAuth2AuthenticationException("Unsupported provider: " + registrationId);
        }
        
        return new CustomOAuth2User(oauth2User, user);
    }

    private User processGitHubUser(OAuth2User oauth2User) {
        Map<String, Object> attributes = oauth2User.getAttributes();
        
        String providerId = String.valueOf(attributes.get("id"));
        String email = (String) attributes.get("email");
        String name = (String) attributes.get("name");
        String login = (String) attributes.get("login");
        String avatarUrl = (String) attributes.get("avatar_url");
        
        // Use login as name if name is null
        if (name == null || name.trim().isEmpty()) {
            name = login;
        }
        
        // Try to find existing user by provider and provider_id
        User existingUser = userRepository.findByProviderAndProviderId("github", providerId);
        
        if (existingUser != null) {
            // Update existing user info
            existingUser.setName(name);
            existingUser.setAvatarUrl(avatarUrl);
            if (email != null && !email.isEmpty()) {
                existingUser.setEmail(email);
                existingUser.setEmailVerified(true); // GitHub emails are considered verified
            }
            return userRepository.save(existingUser);
        }
        
        // Check if user exists with same email but different provider
        if (email != null && !email.isEmpty()) {
            User existingEmailUser = userRepository.findByEmail(email);
            if (existingEmailUser != null && "local".equals(existingEmailUser.getProvider())) {
                // Link GitHub account to existing local account
                existingEmailUser.setProvider("github");
                existingEmailUser.setProviderId(providerId);
                existingEmailUser.setAvatarUrl(avatarUrl);
                existingEmailUser.setEmailVerified(true);
                return userRepository.save(existingEmailUser);
            }
        }
        
        // Create new user
        User newUser = new User();
        newUser.setName(name);
        newUser.setEmail(email);
        newUser.setProvider("github");
        newUser.setProviderId(providerId);
        newUser.setAvatarUrl(avatarUrl);
        newUser.setEmailVerified(email != null && !email.isEmpty());
        
        return userRepository.save(newUser);
    }
}