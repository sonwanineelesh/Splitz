package com.splitwise.api;

import java.io.UnsupportedEncodingException;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
import org.springframework.data.repository.CrudRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.splitwise.DTO.ResetPasswordRequest;
import com.splitwise.DTO.DashboardDTO;
import com.splitwise.DTO.UserDTO;
import com.splitwise.entity.PasswordResetToken;
import com.splitwise.entity.Splitwise;
import com.splitwise.repository.ResetTokenRepository;
import com.splitwise.repository.UserRepository;
import com.splitwise.service.TokenService;
import com.splitwise.service.UserService;
import com.splitwise.utility.JWTUtitlity;
//import com.splitwise.utility.JWTUtitlity;

import jakarta.mail.MessagingException;

@RestController
@CrossOrigin(origins = "http://localhost:3000") 
@Validated
public class SplitwiseAPI {

//	@Autowired
//    private AuthenticationManager authenticationManager;
	
	@Autowired
	private UserService userService;
	
	@Autowired
	private UserRepository userRepository;
	
	@Autowired
	private Environment environment;
	
	    @Autowired
	    private PasswordEncoder passwordEncoder;  // We'll configure this bean below

	    @Autowired
	    private JWTUtitlity jwtUtils;

		@Autowired
		private ResetTokenRepository resetTokenRepository;
		
		@Autowired
		private TokenService tokenService;

		// @Autowired
		// private EmailService emailService;

		
	
	@PostMapping("/register")
	public ResponseEntity<String> register(@RequestBody UserDTO userDto) {
		//TODO: process POST request
		String username = userService.register(userDto);
		if(username.equals(userDto.getEmail())) {
			System.out.println("Already exists");
		}
		return new ResponseEntity<>(username,HttpStatus.OK);
	}

	    @PostMapping("/login")
	    public ResponseEntity<?> authenticateUser(@RequestBody UserDTO loginRequest) {
	        Optional<Splitwise> userOptional = userRepository.findByEmail(loginRequest.getEmail());
	        if (userOptional.isEmpty()) {
	            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
	                                 .body("Invalid Email or password");
	        }
	        Splitwise user = userOptional.get();
	        if (!passwordEncoder.matches(loginRequest.getPassword(), user.getPassword())) {
	            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
	                                 .body("Invalid email or password");
	        }
	        String token = jwtUtils.generateJwtToken(user.getEmail());
	        return ResponseEntity.ok(userService.authenticate(loginRequest));
	    }

		@PostMapping("/forgot-password/{email}")
public ResponseEntity<String> forgotPassword(@PathVariable("email") String email) throws UnsupportedEncodingException, MessagingException {
	System.out.println("#################################");
	
    ResponseEntity<String> token = tokenService.forgotPassword(email);
	
    return ResponseEntity.ok("Password reset email sent."+"**"+token);
}

@PostMapping("/reset-password")
public ResponseEntity<?> resetPassword(@RequestBody ResetPasswordRequest request) {
    String token = request.getToken();
    String newPassword = request.getNewPassword();

    // 1. Validate token
    PasswordResetToken resetToken = resetTokenRepository.findByToken(token);
    if (resetToken == null || resetToken.getExpiryDate().isBefore(LocalDateTime.now())) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid or expired token.");
    }

    // 2. Update user password
    Splitwise user = resetToken.getUser();
    user.setPassword(passwordEncoder.encode(newPassword));
    userRepository.save(user);

    // 3. Optionally delete token or mark it as used
    resetTokenRepository.delete(resetToken);

    return ResponseEntity.ok("Password has been reset successfully.");
}




		@GetMapping("/balance")
    public ResponseEntity<Long> getYouOwe(Authentication authentication) {
        String userEmail = authentication.getName(); // or use JWT to extract user
        Long balance = userService.getYouOwed(userEmail);
        return ResponseEntity.ok(balance);
    }

	@GetMapping("/dashboard")
	public ResponseEntity<DashboardDTO> getDashboard(Authentication authentication) {
		String userEmail = authentication.getName();
		return ResponseEntity.ok(userService.getDashboard(userEmail));
	}

	// @GetMapping
    // public ResponseEntity<Long> getOwesYou(Authentication authentication) {
    //     String userEmail = authentication.getName(); // or use JWT to extract user
    //     Long balance = userService.getYouAreOwed(userEmail);
    //     return ResponseEntity.ok(balance);
    // }


	}

	
	
	

