package com.example.authservice.service;

import com.example.authservice.model.User;
import com.example.authservice.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private static final Logger logger = LoggerFactory.getLogger(CustomOAuth2UserService.class);

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

        // Debug logging for GitHub OAuth user attributes
        logger.info("=== GitHub OAuth User Attributes ===");
        logger.info("All attributes: {}", attributes);

        String providerId = String.valueOf(attributes.get("id"));
        String email = (String) attributes.get("email");
        String name = (String) attributes.get("name");
        String login = (String) attributes.get("login");
        String avatarUrl = (String) attributes.get("avatar_url");

        logger.info("Provider ID: {}", providerId);
        logger.info("Email: {}", email);
        logger.info("Name: {}", name);
        logger.info("Login: {}", login);
        logger.info("Avatar URL: {}", avatarUrl);
        logger.info("==================================");

        // Use login as name if name is null
        if (name == null || name.trim().isEmpty()) {
            name = login;
        }

        // If email is null, try to get it from GitHub emails API (for authenticated
        // requests)
        if (email == null || email.isEmpty()) {
            logger.warn("GitHub email is null for user: {}. User needs to make email public in GitHub settings.",
                    login);
            // For now, we'll proceed without email - user can add it later or make it
            // public in GitHub
        }

        // Try to find existing user by provider and provider_id
        User existingUser = userRepository.findByProviderAndProviderId("github", providerId);

        if (existingUser != null) {
            logger.info("Existing GitHub user: {}", existingUser.getName());
            return userRepository.save(existingUser);
        }

        // Check if user exists with same email but different provider (only if email is
        // available)
        if (email != null && !email.isEmpty()) {
            User existingEmailUser = userRepository.findByEmail(email);
            if (existingEmailUser != null && "local".equals(existingEmailUser.getProvider())) {
                // Link GitHub account to existing local account
                existingEmailUser.setProvider("github");
                existingEmailUser.setProviderId(providerId);
                existingEmailUser.setAvatarUrl(avatarUrl);
                existingEmailUser.setEmailVerified(true);
                logger.info("Linked GitHub account to existing local user: {}", existingEmailUser.getEmail());
                return userRepository.save(existingEmailUser);
            }
        }

        // Create new user
        User newUser = new User();
        newUser.setName(name);
        newUser.setEmail(email); // Can be null - that's ok
        newUser.setProvider("github");
        newUser.setProviderId(providerId);
        newUser.setAvatarUrl(avatarUrl);
        // For GitHub OAuth users, if no email is provided, we consider it "verified"
        // since they authenticated via GitHub successfully
        newUser.setEmailVerified(true);

        logger.info("Creating new GitHub user: {} with email: {}", name, email != null ? email : "not provided");

        return userRepository.save(newUser);
    }
}