package com.example.authservice.security;

import com.example.authservice.model.User;
import com.example.authservice.model.RefreshToken;
import com.example.authservice.service.CustomOAuth2User;
import com.example.authservice.service.RefreshTokenService;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Component
public class OAuth2AuthenticationSuccessHandler implements AuthenticationSuccessHandler {

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private RefreshTokenService refreshTokenService;

    @Value("${APP_URL:http://localhost:3000}")
    private String frontendUrl;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                        Authentication authentication) throws IOException, ServletException {
        
        CustomOAuth2User customOAuth2User = (CustomOAuth2User) authentication.getPrincipal();
        User user = customOAuth2User.getUser();
        
        // Generate JWT token and refresh token for the user
        String accessToken = jwtUtil.generateTokenWithUser(user);
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(user);
        
        // Redirect to frontend with both tokens
        String targetUrl = UriComponentsBuilder.fromUriString(frontendUrl + "/auth/oauth2/redirect")
                .queryParam("token", accessToken)
                .queryParam("refreshToken", refreshToken.getToken())
                .queryParam("error", "")
                .build().toUriString();

        response.sendRedirect(targetUrl);
    }
}