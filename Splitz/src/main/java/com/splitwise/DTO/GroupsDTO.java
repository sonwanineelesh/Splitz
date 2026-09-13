package com.splitwise.DTO;

import java.util.HashSet;
import java.util.Set;

import com.splitwise.entity.Splitwise;

public class GroupsDTO {
	
	    private Long groupId;

		private Long totalAmount=0L;
		
	    private String groupName;
	    
	    private Set<String> groupMembers = new HashSet<>();

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

		public Set<String> getGroupMembers() {
			return groupMembers;
		}

		public void setGroupMembers(Set<String> groupMembers) {
			this.groupMembers = groupMembers;
		}



}
