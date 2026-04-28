package com.example.committeeportal.Entity;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;

@Entity
@Table(name = "committee")
public class Committee {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;
    
    @Column(name = "committee_name", nullable = false)
    private String committeeName;
    
    @Column(name = "head_of_committee")
    private String headOfCommittee;
    
    @Column(name = "contact_email")
    private String contactEmail;
    
    @Column(name = "password")
    private String password;
    
   @OneToMany(mappedBy = "committee")
   @JsonIgnoreProperties("committee")
   private List<Event> events;
   
    
    // Getters and Setters
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