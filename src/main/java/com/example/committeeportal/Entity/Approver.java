package com.example.committeeportal.Entity;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Entity
@Table(name = "approver")
public class Approver {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "approver_id")
    private Long approverId;

    @NotBlank(message = "Name is required")
    @Size(min = 2, max = 100, message = "Name must be between 2 and 100 characters")
    @Column(name = "name")
    private String name;
    
    @NotBlank(message = "Role is required")
    @Size(min = 2, max = 50, message = "Role must be valid")
    @Column(name = "role")
    private String role;
    
    @NotBlank(message = "Email is required")
    @Email(message = "Email should be valid", regexp = "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.(com|in|org|net|edu|co\\.uk|io)$")
    @Column(name = "email", unique = true)
    private String email;
    
    
    @JsonIgnore
    @NotBlank(message = "Password is required")
    @Size(min = 6, message = "Password must be at least 6 characters")
    @Column(name = "password")
    private String password;
    
@OneToMany(mappedBy = "approver")
    @JsonIgnore
    private List<Approval> approvals;

    // Getters and setters
    public Long getApproverId() {
        return approverId;
    }
    public void setApproverId(Long approverId) {
        this.approverId = approverId;
    }
    public String getName() {
        return name;
    }
    public void setName(String name) {
        this.name = name;
    }
    public String getRole() {
        return role;
    }
    public void setRole(String role) {
        this.role = role;
    }
    public String getEmail() {
        return email;
    }
    public void setEmail(String email) {
        this.email = email;
    }
    public String getPassword() {
        return password;
    }
    public void setPassword(String password) {
        this.password = password;
    }
    
    public List<Approval> getApprovals() {
        return approvals;
    }
    
    public void setApprovals(List<Approval> approvals) {
        this.approvals = approvals;
    }
}