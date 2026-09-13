package com.splitwise.DTO;

import java.util.ArrayList;
import java.util.List;

public class DashboardPersonDTO {

    private String email;
    private String name;
    private Long amount;
    private List<String> expenseDescriptions = new ArrayList<>();

    public DashboardPersonDTO(String email, String name) {
        this.email = email;
        this.name = name;
        this.amount = 0L;
    }

    public void addExpense(Long amount, String description) {
        this.amount += amount;
        if (description != null && !description.isBlank()) {
            expenseDescriptions.add(description);
        }
    }

    public String getEmail() {
        return email;
    }

    public String getName() {
        return name;
    }

    public Long getAmount() {
        return amount;
    }

    public List<String> getExpenseDescriptions() {
        return expenseDescriptions;
    }
}