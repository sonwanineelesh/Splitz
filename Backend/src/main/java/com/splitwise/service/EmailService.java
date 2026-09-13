package com.splitwise.service;

import java.io.InputStreamReader;
import java.io.UnsupportedEncodingException;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;  
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import com.splitwise.repository.UserRepository;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
@Service
public class EmailService {
    @Autowired
    private JavaMailSender mailSender;

    @Autowired
    private UserRepository userRepository;

    public void sendPasswordResetEmail(String email, String resetLink) throws UnsupportedEncodingException, MessagingException {
        // try (CSVReader reader = new CSVReader(new InputStreamReader(new ClassPathResource("letsInt_Data.csv").getInputStream()))) {
            
            
                String name = userRepository.findByEmail(email).get().getUsername();
                String subject = "Forgot Password || Reset Link";
                String body = getEmailBody(name, resetLink);

                MimeMessage mime = mailSender.createMimeMessage();
                MimeMessageHelper message = new MimeMessageHelper(mime, true);
                message.setFrom(new InternetAddress("sonwanineelesh@gmail.com", "Splitzy Team"));
                message.setTo(email);
                message.setSubject(subject);
                message.setText(body);

                mailSender.send(mime);
                System.out.println("Sent email to: " + email);
            
        
    }

    private String getEmailBody(String name,String resetLink) {
        return "Hi " + name + ",\n" +
                                "\n\nWelcome to Splitzy! 🧠🔥\n" +
                "Here is the reset password link for your account\n\n"+
                 resetLink+"\n\n"+
                "Cheers,\n" +
                "Splitzy Team\n";
    }

}
