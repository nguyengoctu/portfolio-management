package com.example.userservice.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
public class ContactMessageRequest {
    
    @NotNull(message = "Recipient ID is required")
    private Long recipientId;
    
    @NotBlank(message = "Sender email is required")
    @Email(message = "Please provide a valid email address")
    private String senderEmail;
    
    @NotBlank(message = "Sender name is required")
    @Size(min = 2, max = 100, message = "Sender name must be between 2 and 100 characters")
    private String senderName;
    
    @NotBlank(message = "Subject is required")
    @Size(min = 5, max = 200, message = "Subject must be between 5 and 200 characters")
    private String subject;
    
    @NotBlank(message = "Message is required")
    @Size(min = 10, max = 1000, message = "Message must be between 10 and 1000 characters")
    private String message;

    // Constructor with parameters
    public ContactMessageRequest(Long recipientId, String senderEmail, String senderName, String subject, String message) {
        this.recipientId = recipientId;
        this.senderEmail = senderEmail;
        this.senderName = senderName;
        this.subject = subject;
        this.message = message;
    }
}