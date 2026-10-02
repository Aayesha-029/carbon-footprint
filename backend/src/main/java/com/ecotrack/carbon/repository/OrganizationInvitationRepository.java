package com.ecotrack.carbon.repository;

import com.ecotrack.carbon.entity.OrganizationInvitation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface OrganizationInvitationRepository extends JpaRepository<OrganizationInvitation, Long> {
    Optional<OrganizationInvitation> findByToken(String token);
    Optional<OrganizationInvitation> findByEmailAndOrganizationId(String email, Long organizationId);
    List<OrganizationInvitation> findByOrganizationId(Long organizationId);
    List<OrganizationInvitation> findByStatusAndExpiryBefore(String status, LocalDateTime expiry);
    boolean existsByEmailAndOrganizationIdAndStatus(String email, Long organizationId, String status);
}