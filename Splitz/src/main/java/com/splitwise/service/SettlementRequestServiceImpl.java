package com.splitwise.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.validation.annotation.Validated;

import com.splitwise.entity.SettlementRequest;
import com.splitwise.entity.Splitwise;
import com.splitwise.repository.SettlementRequestRepository;
//import com.splitwise.utility.NotificationWebSocketHandler;

import jakarta.transaction.Transactional;
@Service
@Transactional
@Validated
public class SettlementRequestServiceImpl implements SettlementRequestService {

//	@Autowired
//	private NotificationWebSocketHandler notificationWebSocketHandler;

	@Autowired
	private SettlementRequestRepository settlementRequestRepository;

	@Override
    public List<SettlementRequest> getPendingRequests(Splitwise recipient) {
        return settlementRequestRepository.findByRecipientAndStatus(recipient, "pending");
    }

    @Override
    public void updateRequestStatus(Long requestId, String status) {
        SettlementRequest request = settlementRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Request not found"));
        request.setStatus(status);
        settlementRequestRepository.save(request);
    }

//	@Override
//	public SettlementRequest createRequest(User sender, User recipient) {
//		SettlementRequest request = new SettlementRequest();
//		request.setSender(sender);
//		request.setRecipient(recipient);
//		request.setStatus("pending");
//		settlementRequestRepository.save(request);
//
//		// Send real-time notification to recipient
//		String message = sender.getEmail() + " wants to settle up the bills.";
//		notificationWebSocketHandler.sendNotification(message);
//
//		return request;
//	}

}
