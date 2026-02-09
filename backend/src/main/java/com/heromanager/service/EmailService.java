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

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendConfirmationEmail(String toEmail, String username, String token) {
        String confirmLink = confirmationBaseUrl + "?token=" + token;
        String subject = "HeroManager - Confirm Your Account";
        String body = """
            <html>
            <body style="font-family: Arial, sans-serif; background: #1a1a2e; color: #eee; padding: 30px;">
                <div style="max-width: 500px; margin: 0 auto; background: #16213e; border-radius: 10px; padding: 30px; border: 1px solid #0f3460;">
                    <h1 style="color: #e94560; text-align: center;">HeroManager</h1>
                    <p>Hello <strong>%s</strong>,</p>
                    <p>Welcome to HeroManager! Please confirm your email address to activate your account.</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="%s" style="background: #e94560; color: #fff; padding: 12px 30px; border-radius: 5px; text-decoration: none; font-weight: bold;">
                            Confirm My Account
                        </a>
                    </div>
                    <p style="color: #999; font-size: 0.9em;">This link expires in 24 hours.</p>
                    <p style="color: #999; font-size: 0.9em;">If you didn't create this account, you can safely ignore this email.</p>
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
}
