package com.splitwise.api;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.RestController;

import com.splitwise.DTO.ExpenseDTO;
import com.splitwise.service.ExpenseService;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;


@RestController
@CrossOrigin
@Validated
public class ExpenseAPI {

@Autowired
private ExpenseService expenseService;

@PostMapping("/addExpense")
public String postMethodName(@RequestBody ExpenseDTO expenseDto) {
    //TODO: process POST request
    String addExpense = expenseService.addExpense(expenseDto);
    return addExpense;
}

	
}
