package com.splitwise.service;

import java.util.HashSet;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.validation.annotation.Validated;

import com.splitwise.DTO.GroupsDTO;
import com.splitwise.entity.Groups;
import com.splitwise.entity.Splitwise;
import com.splitwise.repository.GroupRepository;
import com.splitwise.repository.UserRepository;

import jakarta.transaction.Transactional;

@Service
@Transactional
@Validated
public class GroupServiceImpl implements GroupService{

	
	@Autowired
	private GroupRepository groupRepository;
	
	@Autowired
	private UserRepository userRepository;
	
	@Override
	public String createGroup(GroupsDTO groupDto) {
		
		if (groupDto.getGroupName() == null || groupDto.getGroupName().isEmpty()) {
            throw new IllegalArgumentException("Group name cannot be empty");
        }

        if (groupRepository.findByGroupName(groupDto.getGroupName()).isPresent() ) {
            throw new IllegalArgumentException("Group with the same name already exists");
        }
        
        Set<String> emails = new HashSet<>();
        

        
        Groups group = new Groups();
        
        
        for(String email1 : groupDto.getGroupMembers()) {
        	emails.add(email1);
        }
        Set<Splitwise> splitwises = emails.stream()
        	    .map(email -> userRepository.findByEmail(email))
        	    .flatMap(Optional::stream) 
        	    .collect(Collectors.toSet());
        
        group.setGroupName(groupDto.getGroupName());
        group.setGroupMembers(splitwises);
        groupRepository.save(group);
		return "Group created successfully and members also added";
	}

	@Override
	public String settleUpRequest(String email) {
		// TODO Auto-generated method stub
		
		Optional<Splitwise> email1 = userRepository.findByEmail(email);
		
		return null;
	}

	@Override
	public Optional<Groups> findByGroupId(Long groupId) {
		// TODO Auto-generated method stub
		var group = groupRepository.findByGroupId(groupId);
		return group;
	}

	
}
