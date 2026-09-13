package com.splitwise.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.splitwise.entity.SettlementRequest;
import com.splitwise.entity.Splitwise;

public interface SettlementRequestRepository extends JpaRepository<SettlementRequest, Long> {
    List<SettlementRequest> findByRecipientAndStatus(Splitwise recipient, String status);
}

