package com.splitwise.entity;

import java.util.HashSet;
import java.util.Set;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.Table;

@Entity
@Table(name = "groups_table")
public class Groups {
	
	
	@Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long groupId;

	@Column(nullable = false)
	private Long totalAmount=0L;
	
    @Column(nullable = false)
    private String groupName;
    
    @ManyToMany
    @JoinTable(
            name = "group_members",
            joinColumns = @JoinColumn(name = "group_id"),
            inverseJoinColumns = @JoinColumn(name = "user_id")
        )
    private Set<Splitwise> groupMembers = new HashSet<>();

	public Long getGroupId() {
		return groupId;
	}

	public void setGroupId(Long groupId) {
		this.groupId = groupId;
	}

	public Long getTotalAmount() {
		return totalAmount;
	}

	public void setTotalAmount(Long totalAmount) {
		this.totalAmount = totalAmount;
	}

	public String getGroupName() {
		return groupName;
	}

	public void setGroupName(String groupName) {
		this.groupName = groupName;
	}

	public Set<Splitwise> getGroupMembers() {
		return groupMembers;
	}

	public void setGroupMembers(Set<Splitwise> groupMembers) {
		this.groupMembers = groupMembers;
	}


}


