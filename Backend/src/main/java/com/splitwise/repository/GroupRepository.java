package com.splitwise.repository;

import java.util.Optional;

import org.springframework.data.repository.CrudRepository;

import com.splitwise.entity.Groups;

public interface GroupRepository extends CrudRepository<Groups, Long>{

	Optional<Groups> findByGroupName(String groupName);

	Optional<Groups> findByGroupId(Long groupId);
	

}
