//package com.splitwise.api;
//
//
//import java.util.List;
//
//import org.springframework.beans.factory.annotation.Autowired;
//import org.springframework.http.HttpStatus;
//import org.springframework.http.ResponseEntity;
//import org.springframework.security.core.Authentication;
//import org.springframework.security.core.context.SecurityContextHolder;
//import org.springframework.validation.annotation.Validated;
//import org.springframework.web.bind.annotation.CrossOrigin;
//import org.springframework.web.bind.annotation.GetMapping;
//import org.springframework.web.bind.annotation.PathVariable;
//import org.springframework.web.bind.annotation.PostMapping;
//import org.springframework.web.bind.annotation.PutMapping;
//import org.springframework.web.bind.annotation.RequestBody;
//import org.springframework.web.bind.annotation.RestController;
//
//import com.splitwise.DTO.SettlementRequestDto;
//import com.splitwise.entity.SettlementRequest;
//import com.splitwise.entity.User;
//import com.splitwise.repository.UserRepository;
//import com.splitwise.service.SettlementRequestService;
//
//@RestController
//@CrossOrigin
//@Validated
//public class SettlementRequestController {
//
//    @Autowired
//    private SettlementRequestService settlementRequestService;
//    
//    @Autowired
//	private UserRepository userRepository;
//
//    @PostMapping("/send")
//    public ResponseEntity<SettlementRequest> sendRequest(@RequestBody SettlementRequestDto requestDto) {
//        User sender = getAuthenticatedUser();// Retrieve sender from authentication context
//        User recipient = getRecipient(requestDto.getRecipientId());
//        SettlementRequest request = settlementRequestService.createRequest(
//                sender, recipient);
//        return ResponseEntity.status(HttpStatus.CREATED).body(request);
//    }
//    private User getRecipient(Long recipientId) {
//        return userRepository.findById(recipientId).get();
//    }
//
//    @GetMapping("/pending")
//    public ResponseEntity<List<SettlementRequest>> getPendingRequests() {
//        User recipient = getAuthenticatedUser();// Retrieve recipient from authentication context
//        List<SettlementRequest> pendingRequests = settlementRequestService.getPendingRequests(recipient);
//        return ResponseEntity.ok(pendingRequests);
//    }
//
//    @PutMapping("/{requestId}/approve")
//    public ResponseEntity<Void> approveRequest(@PathVariable Long requestId) {
//        settlementRequestService.updateRequestStatus(requestId, "approved");
//        return ResponseEntity.noContent().build();
//    }
//
//    @PutMapping("/{requestId}/deny")
//    public ResponseEntity<Void> denyRequest(@PathVariable Long requestId) {
//        settlementRequestService.updateRequestStatus(requestId, "denied");
//        return ResponseEntity.noContent().build();
//    }
//    
//    private User getAuthenticatedUser() {
//        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
//        if (authentication != null) {
//            return (User) authentication.getPrincipal();
//        }
//        return null; // or throw an exception if user is not authenticated
//    }
//}
//
