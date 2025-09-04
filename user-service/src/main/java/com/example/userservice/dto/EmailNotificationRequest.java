package com.example.userservice.dto;

public class EmailNotificationRequest {
    
    private String to;
    private String subject;
    private String htmlBody;
    private String textBody;

    // Default constructor
    public EmailNotificationRequest() {}

    // Constructor with parameters
    public EmailNotificationRequest(String to, String subject, String htmlBody, String textBody) {
        this.to = to;
        this.subject = subject;
        this.htmlBody = htmlBody;
        this.textBody = textBody;
    }

    // Getters and setters
    public String getTo() {
        return to;
    }

    public void setTo(String to) {
        this.to = to;
    }

    public String getSubject() {
        return subject;
    }

    public void setSubject(String subject) {
        this.subject = subject;
    }

    public String getHtmlBody() {
        return htmlBody;
    }

    public void setHtmlBody(String htmlBody) {
        this.htmlBody = htmlBody;
    }

    public String getTextBody() {
        return textBody;
    }

    public void setTextBody(String textBody) {
        this.textBody = textBody;
    }
}