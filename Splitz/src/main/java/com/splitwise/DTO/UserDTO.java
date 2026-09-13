package com.splitwise.DTO;

public class UserDTO {
	
    private Long userId;
    
    private String username;
    
    private String email;
    
    private String password;
    
    private Long balance = 0L;
    
    
//    @ManyToMany
//    @JoinTable(
//            name = "user_groups",
//            joinColumns = @JoinColumn(name = "user_id"),
//            inverseJoinColumns = @JoinColumn(name = "group_id")
//    )
//    private Set<Groups> groups = new HashSet<>();
//    

	public Long getBalance() {
		return balance;
	}

	public void setBalance(Long balance) {
		this.balance = balance;
	}

	
	public Long getUserId() {
		return userId;
	}

	public void setUserId(Long userId) {
		this.userId = userId;
	}

	public String getUsername() {
		return username;
	}

	public void setUsername(String username) {
		this.username = username;
	}

	public String getEmail() {
		return email;
	}

	public void setEmail(String email) {
		this.email = email;
	}

	public String getPassword() {
		return password;
	}

	public void setPassword(String password) {
		this.password = password;
	}

	

    
}

