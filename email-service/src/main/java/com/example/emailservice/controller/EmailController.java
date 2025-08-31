package com.example.emailservice.controller;

import com.example.emailservice.service.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/email")
public class EmailController {

    @Autowired
    private EmailService emailService;

    @PostMapping("/send")
    public String sendEmail(@RequestBody EmailRequest emailRequest) {
        // Use HTML content if available, otherwise use plain text body
        String content = emailRequest.getHtml() != null ? emailRequest.getHtml() : emailRequest.getBody();
        boolean isHtml = emailRequest.getHtml() != null;
        
        emailService.sendEmail(emailRequest.getTo(), emailRequest.getSubject(), content, isHtml);
        return "Email sent successfully!";
    }
}
