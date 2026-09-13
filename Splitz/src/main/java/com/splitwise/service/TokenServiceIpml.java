package com.splitwise.service;

import java.io.UnsupportedEncodingException;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.repository.CrudRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.validation.annotation.Validated;

import com.splitwise.entity.PasswordResetToken;
import com.splitwise.entity.Splitwise;
import com.splitwise.repository.ResetTokenRepository;
import com.splitwise.repository.UserRepository;

import jakarta.mail.MessagingException;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
@Service
@Transactional
@Validated
public class TokenServiceIpml implements TokenService {
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private ResetTokenRepository resetTokenRepository;
    @Autowired
    private EntityManager entityManager;

    @Autowired
    private EmailService emailService;
    @Transactional
   @Override
public ResponseEntity<String> forgotPassword(String email) throws UnsupportedEncodingException, MessagingException {
    // Find user by email
    Optional<Splitwise> userOptional = userRepository.findByEmail(email);

    // If user not found
    if (!userOptional.isPresent()) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found");
    }

    Splitwise user = userOptional.get();
    System.out.println("User found: " + user.getEmail());

    // Generate a new token
    String token = UUID.randomUUID().toString();
    System.out.println("Generated Token: " + token);

    // Check if token already exists for user
    PasswordResetToken existingToken = resetTokenRepository.findByUserUserId(user.getUserId());

    if (existingToken != null) {
        // Check if it's expired
        if (existingToken.getExpiryDate().isAfter(LocalDateTime.now())) {
            return ResponseEntity.status(HttpStatus.OK)
                .body("Token already sent and still valid: " + existingToken.getToken());
        }else
{
        // If expired, delete the old token
        System.out.println("(((((((((((((((((((((((())))))))))))))))))))))))");
        deleteToken(existingToken);// Create and save new token
        }}
    PasswordResetToken resetToken = new PasswordResetToken();
    resetToken.setToken(token);
    resetToken.setUser(user);
    resetToken.setExpiryDate(LocalDateTime.now().plusMinutes(30));

    resetTokenRepository.save(resetToken);
String resetLink = "http://localhost:3000/reset-password?token=" + token;

    // Send email with the reset link (implement sendPasswordResetEmail)
    emailService.sendPasswordResetEmail(user.getEmail(), resetLink);

    return ResponseEntity.ok("Reset link sent to your email.");
}



public void deleteToken(PasswordResetToken existing){
    resetTokenRepository.delete(existing);
    entityManager.flush();
}
    
}
