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

@Entity
@Table(name = "approver")
public class Approver {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "approver_id")
    private Long approverId;

    @Column(name = "name")
    private String name;
    
    @Column(name = "role")
    private String role;
    
    @Column(name = "email")
    private String email;
    @Column(name = "digital_signature")
    private String digitalSignature;
    
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
    public String getDigitalSignature() {
        return digitalSignature;
    }
    public void setDigitalSignature(String digitalSignature) {
        this.digitalSignature = digitalSignature;
    }
    public String getPassword() {
        return password;
    }
    public void setPassword(String password) {
        this.password = password;
    }
}