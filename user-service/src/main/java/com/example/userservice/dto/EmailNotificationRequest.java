package com.example.userservice.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
public class EmailNotificationRequest {
    
    private String to;
    private String subject;
    private String htmlBody;
    private String textBody;

    // Constructor with parameters
    public EmailNotificationRequest(String to, String subject, String htmlBody, String textBody) {
        this.to = to;
        this.subject = subject;
        this.htmlBody = htmlBody;
        this.textBody = textBody;
    }
}