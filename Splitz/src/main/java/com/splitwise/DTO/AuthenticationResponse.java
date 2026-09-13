package com.splitwise.DTO;

import com.splitwise.entity.Splitwise;

public class AuthenticationResponse {

	private String token;
	
	private Splitwise user;

	public Splitwise getUser() {
		return user;
	}


	public void setUser(Splitwise user) {
		this.user = user;
	}


	public AuthenticationResponse(String token, Splitwise user) {
		super();
		this.token = token;
		this.user = user;
	}


	public AuthenticationResponse() {
	}


	public String getToken() {
		return token;
	}

	public void setToken(String token) {
		this.token = token;
	}
	
	
}
