package com.example.committeeportal.Entity;

import java.time.LocalDate;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "approval")
public class Approval {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "approval_id")
    private Long approvalId;

    @ManyToOne
    @JoinColumn(name = "application_id", referencedColumnName = "application_id")
    @JsonIgnore
    private PermissionApplication permissionApplication;

    @ManyToOne
    @JoinColumn(name = "approver_id", referencedColumnName = "approver_id")
    private Approver approver;

    @Column(name = "approval_status")
    private String approvalStatus;

    @Column(name = "approval_date")
    private LocalDate approvalDate;

    @Column(name = "remarks")
    private String remarks;

    // Getters and Setters
    public Long getApprovalId() { return approvalId; }
    public void setApprovalId(Long approvalId) { this.approvalId = approvalId; }

    public PermissionApplication getPermissionApplication() { return permissionApplication; }
    public void setPermissionApplication(PermissionApplication permissionApplication) { this.permissionApplication = permissionApplication; }

    public Approver getApprover() { return approver; }
    public void setApprover(Approver approver) { this.approver = approver; }

    public String getApprovalStatus() { return approvalStatus; }
    public void setApprovalStatus(String approvalStatus) { this.approvalStatus = approvalStatus; }

    public LocalDate getApprovalDate() { return approvalDate; }
    public void setApprovalDate(LocalDate approvalDate) { this.approvalDate = approvalDate; }

    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
}