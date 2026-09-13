package com.splitwise.api;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
// import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.splitwise.DTO.GroupsDTO;
import com.splitwise.entity.Groups;
import com.splitwise.repository.GroupRepository;
import com.splitwise.service.GroupService;

// import jakarta.websocket.server.PathParam;


@RestController
@CrossOrigin
@Validated
public class GroupAPI {

	
	@Autowired
	private GroupService groupService;
	
	@Autowired
	private GroupRepository groupRepository;
	
	
	@PostMapping("/create_group")
    public ResponseEntity<String> createGroup(@RequestBody GroupsDTO group) {
		// System.out.println("lLLLLLLLLLLLLLLLLL");
		String createdGroup = groupService.createGroup(group);
        return new ResponseEntity<>(createdGroup, HttpStatus.CREATED);
    }
	
	@PostMapping("/settleUp")
	public ResponseEntity<String> settleUp(@PathVariable String email){
		String request = groupService.settleUpRequest(email);
		return new ResponseEntity<String>(request, HttpStatus.CREATED);
	}
	
	@GetMapping("/groups")
	
	public List<Groups> getAllGroups() {
		return (List<Groups>) groupRepository.findAll();
	}
	
	@GetMapping("/groups/group/{groupId}")
	public Optional<Groups> getGroupByGroupId(@PathVariable("groupId") Long id) {
		return groupService.findByGroupId(id);
	}
	
}
