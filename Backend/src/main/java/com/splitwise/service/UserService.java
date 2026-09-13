package com.splitwise.service;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;

import com.splitwise.DTO.UserDTO;
import com.splitwise.DTO.DashboardDTO;

public interface UserService extends UserDetailsService{

	String register(UserDTO userDto);
//	public UserDetails loadUserByUsername(UserDTO userDTO);
public UserDetails loadUserByUsername(String email);
	ResponseEntity<?> authenticate(UserDTO loginRequest);
    // Long getBalanceForUser(String userEmail);
    Long getYouOwed(String userEmail);
    Long getYouAreOwed(String userEmail);
    DashboardDTO getDashboard(String userEmail);
    void sendPasswordResetEmail(String email, String token);
	}
