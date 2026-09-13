package com.splitwise.service;

import java.util.Optional;
// import java.util.Set;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.validation.annotation.Validated;

import com.splitwise.DTO.ExpenseDTO;
import com.splitwise.entity.Expense;
import com.splitwise.entity.Splitwise;
import com.splitwise.repository.ExpenseRepository;
// import com.splitwise.repository.GroupRepository;
import com.splitwise.repository.UserRepository;

import jakarta.transaction.Transactional;
@Service
@Transactional
// @Validated
public class ExpenseServiceImpl implements ExpenseService{
	
	
	@Autowired
	private ExpenseRepository expenseRepository;
	
	@Autowired
	private UserRepository userRepository;
	

	@Override
	public String addExpense(ExpenseDTO expenseDto) {
		Expense expense = new Expense();
		expense.setExpenseDescription(expenseDto.getExpenseDescription());
		expense.setAmount(expenseDto.getAmount());
		expense.setGroupName(expenseDto.getGroupName());
		expense.setPayerEmail(expenseDto.getPayerEmail());
		expense.setAddedMembers(expenseDto.getAddedMembers());
		
		int splitAmount = (int) (expenseDto.getAmount()/expenseDto.getAddedMembers().size());
		Optional<Splitwise> s1 = userRepository.findByEmail(expenseDto.getPayerEmail());
		if(!expenseDto.getAddedMembers().contains(expenseDto.getPayerEmail())) {
			Optional<Splitwise> email1 = userRepository.findByEmail(expenseDto.getPayerEmail());
			email1.get().setBalance(email1.get().getBalance()+expenseDto.getAmount());
		}
		for(String members : expenseDto.getAddedMembers()) {
			Optional<Splitwise> email = userRepository.findByEmail(members);
			email.get().setBalance(email.get().getBalance() -splitAmount);
			if(expenseDto.getPayerEmail().equals(members)) {
				s1.get().setBalance(s1.get().getBalance()+expenseDto.getAmount());
			}
			userRepository.save(email.get());
		}
		expenseRepository.save(expense);
		return "Expense Added Successfully";
	}

}
