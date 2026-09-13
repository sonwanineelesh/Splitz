package com.splitwise.repository;

import org.springframework.data.repository.CrudRepository;

import com.splitwise.entity.Expense;

public interface ExpenseRepository extends CrudRepository<Expense, Long>{

}
