package com.splitwise.DTO;

public class SettlementRequestDto {

    private Long recipientId;

    public Long getRecipientId() {
        return recipientId;
    }

    public void setRecipientId(Long recipientId) {
        this.recipientId = recipientId;
    }

	public SettlementRequestDto(Long recipientId) {
		super();
		this.recipientId = recipientId;
	}

}

