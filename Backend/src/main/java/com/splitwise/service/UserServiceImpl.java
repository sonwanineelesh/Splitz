package com.splitwise.service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.validation.annotation.Validated;

import com.splitwise.DTO.AuthenticationResponse;
import com.splitwise.DTO.DashboardDTO;
import com.splitwise.DTO.DashboardPersonDTO;
import com.splitwise.DTO.UserDTO;
import com.splitwise.entity.Expense;
import com.splitwise.entity.Splitwise;
import com.splitwise.repository.UserRepository;
import com.splitwise.repository.ExpenseRepository;
import com.splitwise.utility.JWTUtitlity;

import jakarta.transaction.Transactional;

@Service
@Transactional
@Validated
public class UserServiceImpl implements UserService{
	
	
	@Autowired
	private UserRepository userRepository;

	@Autowired
	private ExpenseRepository expenseRepository;

	@Autowired
    private JavaMailSender mailSender;
	
	// @Autowired
	// private AuthenticationManager authenticationManager;
//	@Autowired
	private BCryptPasswordEncoder encoder = new BCryptPasswordEncoder(12);

 private final ObjectProvider<AuthenticationManager> authenticationManager;

    public UserServiceImpl(ObjectProvider<AuthenticationManager> authenticationManager) {
        this.authenticationManager = authenticationManager;
    }

	@Override
	public String register(UserDTO userDTO) {
		if (userRepository.findByEmail(userDTO.getEmail()).isPresent()) {
			throw new IllegalArgumentException("Email already exists");
		}

		Splitwise splitwise = new Splitwise();
		splitwise.setEmail(userDTO.getEmail());
		splitwise.setUsername(userDTO.getUsername());
		splitwise.setPassword(encoder.encode(userDTO.getPassword()));
		userRepository.save(splitwise);

		return splitwise.getUsername();
	}
	
	@Autowired
	private JWTUtitlity jwtUtitlity;
	
	@Override
	public ResponseEntity<?> authenticate(UserDTO loginRequest) {
		// TODO Auto-generated method stub
		authenticationManager.getObject().authenticate(new UsernamePasswordAuthenticationToken(loginRequest.getEmail(), loginRequest.getPassword()));
		var user = userRepository.findByEmail(loginRequest.getEmail()).orElseThrow();
		String jwtToken = jwtUtitlity.generateJwtToken(user.getEmail());// changed
		
		AuthenticationResponse authenticationResponse = new AuthenticationResponse();
//		return ResponseEntity<String>();
		authenticationResponse.setToken(jwtToken);
		return ResponseEntity.ok(authenticationResponse);
	}
	
	@Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        Splitwise user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));

        // Convert your Splitwise user to Spring Security's UserDetails object
        return new org.springframework.security.core.userdetails.User(
                user.getEmail(), user.getPassword(), new ArrayList<>()); // Empty authorities list
    }

	@Override
	public Long getYouOwed(String email) {
		Splitwise user = userRepository.findByEmail(email)
				.orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));	

		Long balance = user.getBalance();
		return balance < 0 ? Math.abs(balance) : 0L;
	}

	@Override
	public Long getYouAreOwed(String email) {
		Splitwise user = userRepository.findByEmail(email)
				.orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));

		Long balance = user.getBalance();
		return balance > 0 ? balance : 0L;
	}

	@Override
	public DashboardDTO getDashboard(String email) {
		Long youOwe = getYouOwed(email);
		Long youAreOwed = getYouAreOwed(email);
		Map<String, DashboardPersonDTO> peopleYouOwe = new LinkedHashMap<>();
		Map<String, DashboardPersonDTO> peopleWhoOweYou = new LinkedHashMap<>();

		for (Expense expense : expenseRepository.findAll()) {
			if (expense.getAmount() == null || expense.getAddedMembers() == null
					|| expense.getAddedMembers().isEmpty()) {
				continue;
			}

			long share = expense.getAmount() / expense.getAddedMembers().size();
			String payerEmail = expense.getPayerEmail();
			String description = expense.getExpenseDescription();

			if (email.equals(payerEmail)) {
				for (String memberEmail : expense.getAddedMembers()) {
					if (!email.equals(memberEmail)) {
						addDashboardExpense(peopleWhoOweYou, memberEmail, share, description);
					}
				}
			} else if (expense.getAddedMembers().contains(email) && payerEmail != null) {
				addDashboardExpense(peopleYouOwe, payerEmail, share, description);
			}
		}

		return new DashboardDTO(
				youAreOwed - youOwe,
				youOwe,
				youAreOwed,
				List.copyOf(peopleYouOwe.values()),
				List.copyOf(peopleWhoOweYou.values()));
	}

	private void addDashboardExpense(Map<String, DashboardPersonDTO> people,
			String personEmail, long amount, String description) {
		Splitwise person = userRepository.findByEmail(personEmail).orElse(null);
		String personName = person == null ? personEmail : person.getUsername();
		DashboardPersonDTO dashboardPerson = people.computeIfAbsent(
				personEmail, key -> new DashboardPersonDTO(key, personName));
		dashboardPerson.addExpense(amount, description);
	}

	@Override
	public void sendPasswordResetEmail(String email, String token) {
		// TODO Auto-generated method stub
		String resetUrl = "https://localhost:8080/reset-password?token=" + token;
        String subject = "Reset Your Password";
        String body = "Click the link to reset your password:\n" + resetUrl;

        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(email);
        message.setSubject(subject);
        message.setText(body);
        message.setFrom("your_email@example.com"); // Or from your SMTP config

        mailSender.send(message);
	}
}