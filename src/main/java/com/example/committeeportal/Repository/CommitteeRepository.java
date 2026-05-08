package com.example.committeeportal.Repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.committeeportal.Entity.Committee;

@Repository
public interface CommitteeRepository extends JpaRepository<Committee, Long> {
    
    // Find committee by name (case-insensitive)
    List<Committee> findByCommitteeNameContainingIgnoreCase(String name);
    
    // Find by head of committee
    List<Committee> findByHeadOfCommitteeContainingIgnoreCase(String head);
    
    // Find by email
    Committee findFirstByContactEmailIgnoreCase(String email);
    
    // Check if committee name exists
    boolean existsByCommitteeNameIgnoreCase(String committeeName);
    
    // Check if email exists
    boolean existsByContactEmailIgnoreCase(String email);

    // Find by status
    List<Committee> findByStatus(Committee.CommitteeStatus status);

}
