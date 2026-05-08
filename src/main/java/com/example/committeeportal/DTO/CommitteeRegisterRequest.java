package com.example.committeeportal.DTO;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * DTO for Committee Registration
 * Contains all required fields and validation rules for committee registration
 */
public class CommitteeRegisterRequest {

    @NotBlank(message = "Email is required")
    @Email(message = "Email should be valid", regexp = "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.(com|in|org|net|edu|co\\.uk|io)$")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 6, message = "Password must be at least 6 characters")
    private String password;

    @NotBlank(message = "Committee name is required")
    @Size(min = 3, max = 100, message = "Committee name must be between 3 and 100 characters")
    private String committeeName;

    @NotBlank(message = "Faculty in charge name is required")
    @Size(min = 3, max = 100, message = "Faculty name must be between 3 and 100 characters")
    private String facultyInChargeName;

    // Constructors
    public CommitteeRegisterRequest() {}

    public CommitteeRegisterRequest(String email, String password, String committeeName, String facultyInChargeName) {
        this.email = email;
        this.password = password;
        this.committeeName = committeeName;
        this.facultyInChargeName = facultyInChargeName;
    }

    // Getters and Setters
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

    public String getCommitteeName() {
        return committeeName;
    }

    public void setCommitteeName(String committeeName) {
        this.committeeName = committeeName;
    }

    public String getFacultyInChargeName() {
        return facultyInChargeName;
    }

    public void setFacultyInChargeName(String facultyInChargeName) {
        this.facultyInChargeName = facultyInChargeName;
    }
}
