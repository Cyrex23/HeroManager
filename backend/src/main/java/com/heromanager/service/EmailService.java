package com.heromanager.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Value("${app.confirmation-url}")
    private String confirmationBaseUrl;

    @Value("${app.reset-password-url}")
    private String resetPasswordBaseUrl;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendConfirmationEmail(String toEmail, String username, String token) {
        String confirmLink = confirmationBaseUrl + "?token=" + token;
        String subject = "HeroManager - Confirm Your Account";
        String body = """
                <html>
                <body style="font-family: Arial, sans-serif; background-color: #0f0f23; color: #e0e0e0; padding: 32px;">
                  <div style="max-width: 480px; margin: 0 auto; background-color: #1a1a2e; border-radius: 8px; padding: 32px;">
                    <h1 style="color: #e94560; margin-top: 0;">Welcome to HeroManager!</h1>
                    <p>Hello <strong>%s</strong>,</p>
                    <p>Thank you for registering. Please confirm your email address by clicking the button below:</p>
                    <a href="%s" style="display: inline-block; padding: 12px 24px; background-color: #e94560; color: #ffffff; text-decoration: none; border-radius: 4px; font-weight: bold;">
                      Confirm Email
                    </a>
                    <p style="margin-top: 24px; font-size: 12px; color: #666;">
                      This link expires in 24 hours. If you didn't create this account, you can ignore this email.
                    </p>
                  </div>
                </body>
                </html>
                """.formatted(username, confirmLink);

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(body, true);
            mailSender.send(message);
        } catch (MessagingException e) {
            throw new RuntimeException("Failed to send confirmation email", e);
        }
    }

    public void sendPasswordResetEmail(String toEmail, String username, String token) {
        String resetLink = resetPasswordBaseUrl + "?token=" + token;
        String subject = "HeroManager - Password Reset Request";
        String body = """
                <html>
                <body style="font-family: Arial, sans-serif; background-color: #0f0f23; color: #e0e0e0; padding: 32px;">
                  <div style="max-width: 480px; margin: 0 auto; background-color: #1a1a2e; border-radius: 8px; padding: 32px;">
                    <h1 style="color: #e94560; margin-top: 0;">Password Reset</h1>
                    <p>Hello <strong>%s</strong>,</p>
                    <p>We received a request to reset your password. Click the button below to choose a new one:</p>
                    <a href="%s" style="display: inline-block; padding: 12px 24px; background-color: #e94560; color: #ffffff; text-decoration: none; border-radius: 4px; font-weight: bold;">
                      Reset Password
                    </a>
                    <p style="margin-top: 24px; font-size: 12px; color: #666;">
                      This link expires in 1 hour. If you did not request a password reset, you can safely ignore this email.
                    </p>
                  </div>
                </body>
                </html>
                """.formatted(username, resetLink);

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(body, true);
            mailSender.send(message);
        } catch (MessagingException e) {
            throw new RuntimeException("Failed to send password reset email", e);
        }
    }
}
