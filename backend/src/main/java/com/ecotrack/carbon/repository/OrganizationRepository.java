package com.ecotrack.carbon.repository;

import com.ecotrack.carbon.entity.Organization;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface OrganizationRepository extends JpaRepository<Organization, Long> {
    Optional<Organization> findByOrganizerId(Long organizerId);
    Optional<Organization> findByName(String name);
    boolean existsByName(String name);
}