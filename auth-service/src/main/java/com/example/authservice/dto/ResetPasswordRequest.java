package com.example.authservice.dto;

import lombok.Data;

@Data
public class ResetPasswordRequest {
    private String newPassword;

}