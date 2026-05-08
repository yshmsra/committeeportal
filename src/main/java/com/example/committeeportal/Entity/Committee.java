package com.example.committeeportal.Entity;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Entity
@Table(name = "committee")
public class Committee {
    
    public enum CommitteeStatus {
        ACTIVE,
        INACTIVE,
        SUSPENDED
    }
    
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;
    
    @NotBlank(message = "Committee name is required")
    @Size(min = 3, max = 100, message = "Committee name must be between 3 and 100 characters")
    @Column(name = "committee_name", nullable = false)
    private String committeeName;
    
    @NotBlank(message = "Head of committee is required")
    @Size(min = 3, max = 100, message = "Head name must be between 3 and 100 characters")
    @Column(name = "head_of_committee")
    private String headOfCommittee;
    
    @NotBlank(message = "Contact email is required")
    @Email(message = "Contact email should be valid", regexp = "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.(com|in|org|net|edu|co\\.uk|io)$")
    @Column(name = "contact_email", unique = true)
    private String contactEmail;
    
    @NotBlank(message = "Password is required")
    @Size(min = 6, message = "Password must be at least 6 characters")
    @Column(name = "password")
    private String password;
    
    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "status", nullable = false)
    private CommitteeStatus status = CommitteeStatus.ACTIVE; // Default status

    @OneToMany(mappedBy = "committee")
    @JsonIgnoreProperties("committee")
    private List<Event> events;
    
    
    // Getters and Setters
    public CommitteeStatus getStatus() { return status; }
    public void setStatus(CommitteeStatus status) { this.status = status; }
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getCommitteeName() { return committeeName; }
    public void setCommitteeName(String committeeName) { this.committeeName = committeeName; }
    
    public String getHeadOfCommittee() { return headOfCommittee; }
    public void setHeadOfCommittee(String headOfCommittee) { this.headOfCommittee = headOfCommittee; }
    
    public String getContactEmail() { return contactEmail; }
    public void setContactEmail(String contactEmail) { this.contactEmail = contactEmail; }
    
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    
    public List<Event> getEvents() { return events; }
    public void setEvents(List<Event> events) { this.events = events; }
}