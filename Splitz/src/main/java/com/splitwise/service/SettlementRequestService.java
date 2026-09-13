package com.splitwise.service;

import java.util.List;

import com.splitwise.entity.SettlementRequest;
import com.splitwise.entity.Splitwise;

public interface SettlementRequestService {

//	SettlementRequest createRequest(User sender, User recipient);

	List<SettlementRequest> getPendingRequests(Splitwise recipient);

	void updateRequestStatus(Long requestId, String string);

}
