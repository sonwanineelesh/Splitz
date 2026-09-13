package com.splitwise.service;

import java.io.UnsupportedEncodingException;

import org.springframework.http.ResponseEntity;

import jakarta.mail.MessagingException;

public interface TokenService {

    public ResponseEntity<String> forgotPassword(String email) throws UnsupportedEncodingException, MessagingException;
}
