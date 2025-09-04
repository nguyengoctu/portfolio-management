package com.example.userservice.service;

import com.example.userservice.dto.ContactMessageRequest;
import com.example.userservice.model.User;
import com.example.userservice.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import java.util.HashMap;
import java.util.Map;

@Service
public class ContactService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RestTemplate restTemplate;

    @Value("${email.service.url}")
    private String emailServiceUrl;

    public void sendContactMessage(ContactMessageRequest request) {
        // Find the recipient user
        User recipient = userRepository.findById(request.getRecipientId())
                .orElseThrow(() -> new RuntimeException("Recipient not found"));

        // Create email notification
        String subject = "New Contact Message: " + request.getSubject();
        String htmlBody = buildHtmlEmailBody(request, recipient);
        String textBody = buildTextEmailBody(request, recipient);

        // Create email request matching email service structure
        Map<String, String> emailRequest = new HashMap<>();
        emailRequest.put("to", recipient.getEmail());
        emailRequest.put("subject", subject);
        emailRequest.put("html", htmlBody);
        emailRequest.put("body", textBody);

        // Send email notification via email service
        sendEmailNotification(emailRequest);
    }

    private void sendEmailNotification(Map<String, String> emailRequest) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<Map<String, String>> entity = new HttpEntity<>(emailRequest, headers);
            
            String emailUrl = emailServiceUrl + "/api/email/send";
            restTemplate.postForEntity(emailUrl, entity, String.class);
            
        } catch (Exception e) {
            throw new RuntimeException("Failed to send email notification: " + e.getMessage());
        }
    }

    private String buildHtmlEmailBody(ContactMessageRequest request, User recipient) {
        return String.format("""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>New Contact Message</title>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background-color: #4f46e5; color: white; padding: 20px; text-align: center; }
                    .content { background-color: #f9f9f9; padding: 20px; border: 1px solid #ddd; }
                    .message-box { background-color: white; padding: 15px; border-radius: 5px; margin: 10px 0; }
                    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>DevPort - New Contact Message</h1>
                    </div>
                    <div class="content">
                        <p>Hello <strong>%s</strong>,</p>
                        <p>You have received a new contact message through your DevPort portfolio:</p>
                        
                        <div class="message-box">
                            <p><strong>From:</strong> %s (%s)</p>
                            <p><strong>Subject:</strong> %s</p>
                            <p><strong>Message:</strong></p>
                            <p>%s</p>
                        </div>
                        
                        <p>You can reply directly to this email to respond to the sender.</p>
                    </div>
                    <div class="footer">
                        <p>This email was sent from your DevPort portfolio contact form.</p>
                    </div>
                </div>
            </body>
            </html>
            """,
            recipient.getName(),
            request.getSenderName(),
            request.getSenderEmail(),
            request.getSubject(),
            request.getMessage().replace("\n", "<br>")
        );
    }

    private String buildTextEmailBody(ContactMessageRequest request, User recipient) {
        return String.format("""
            DevPort - New Contact Message
            
            Hello %s,
            
            You have received a new contact message through your DevPort portfolio:
            
            From: %s (%s)
            Subject: %s
            
            Message:
            %s
            
            You can reply directly to this email to respond to the sender.
            
            ---
            This email was sent from your DevPort portfolio contact form.
            """,
            recipient.getName(),
            request.getSenderName(),
            request.getSenderEmail(),
            request.getSubject(),
            request.getMessage()
        );
    }
}