package com.splitwise.repository;

import java.util.Optional;
import java.util.Set;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.CrudRepository;

import com.splitwise.entity.Splitwise;

public interface UserRepository extends JpaRepository<Splitwise, Long>{

	Optional<Splitwise> findByEmail(String email);


//	Set<User> findByPayerEmail(String payerEmail);

//	String findById(Long userId);

}
