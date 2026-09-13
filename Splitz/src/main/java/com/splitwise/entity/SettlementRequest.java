package com.splitwise.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;

@Entity
public class SettlementRequest {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne
	private Splitwise sender;

	@ManyToOne
	private Splitwise recipient;

	private String status;

	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	public Splitwise getSender() {
		return sender;
	}

	public void setSender(Splitwise sender) {
		this.sender = sender;
	}


	public Splitwise getRecipient() {
		return recipient;
	}

	public void setRecipient(Splitwise recipient) {
		this.recipient = recipient;
	}

	public String getStatus() {
		return status;
	}

	public void setStatus(String status) {
		this.status = status;
	}
	
	
}
