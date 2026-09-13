package com.splitwise.service;

import java.util.Optional;

import com.splitwise.DTO.GroupsDTO;
import com.splitwise.entity.Groups;

public interface GroupService {

	String createGroup(GroupsDTO groupDto);

	String settleUpRequest(String email);

	Optional<Groups> findByGroupId(Long groupId);

}
