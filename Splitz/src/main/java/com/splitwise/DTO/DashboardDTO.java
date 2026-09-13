package com.splitwise.DTO;

import java.util.List;

public class DashboardDTO {

    private Long totalBalance;
    private Long youOwe;
    private Long youAreOwed;
    private List<DashboardPersonDTO> peopleYouOwe;
    private List<DashboardPersonDTO> peopleWhoOweYou;

    public DashboardDTO(Long totalBalance, Long youOwe, Long youAreOwed,
            List<DashboardPersonDTO> peopleYouOwe,
            List<DashboardPersonDTO> peopleWhoOweYou) {
        this.totalBalance = totalBalance;
        this.youOwe = youOwe;
        this.youAreOwed = youAreOwed;
        this.peopleYouOwe = peopleYouOwe;
        this.peopleWhoOweYou = peopleWhoOweYou;
    }

    public Long getTotalBalance() {
        return totalBalance;
    }

    public Long getYouOwe() {
        return youOwe;
    }

    public Long getYouAreOwed() {
        return youAreOwed;
    }

    public List<DashboardPersonDTO> getPeopleYouOwe() {
        return peopleYouOwe;
    }

    public List<DashboardPersonDTO> getPeopleWhoOweYou() {
        return peopleWhoOweYou;
    }
}