package com.ecotrack.carbon.security;

import com.ecotrack.carbon.entity.Organization;
import com.ecotrack.carbon.repository.OrganizationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

@Component("orgSecurity")
@RequiredArgsConstructor
public class OrganizationSecurity {

    private final OrganizationRepository organizationRepository;

    public boolean isOrganizer(Long orgId, Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return false;
        }
        String email = authentication.getName();
        Organization organization = organizationRepository.findById(orgId).orElse(null);
        if (organization == null) {
            return false;
        }
        return organization.getOrganizer().getEmail().equals(email);
    }
}