package com.example.committeeportal.DTO;

public class AuthValidationResponse {
    private boolean valid;
    private String message;
    private Long userId;
    private String email;

    public AuthValidationResponse(boolean valid, String message) {
        this.valid = valid;
        this.message = message;
    }

    public AuthValidationResponse(boolean valid, String message, Long userId, String email) {
        this.valid = valid;
        this.message = message;
        this.userId = userId;
        this.email = email;
    }

    // Getters and Setters
    public boolean isValid() {
        return valid;
    }

    public void setValid(boolean valid) {
        this.valid = valid;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }
}
