package com.ecotrack.carbon.repository;

import com.ecotrack.carbon.entity.OrganizationMember;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OrganizationMemberRepository extends JpaRepository<OrganizationMember, Long> {
    List<OrganizationMember> findByOrganizationId(Long organizationId);
    Optional<OrganizationMember> findByOrganizationIdAndUserId(Long organizationId, Long userId);
    Page<OrganizationMember> findByOrganizationId(Long organizationId, Pageable pageable);
    Page<OrganizationMember> findByOrganizationIdAndStatus(Long organizationId, String status, Pageable pageable);
    long countByOrganizationIdAndStatus(Long organizationId, String status);
    boolean existsByOrganizationIdAndUserId(Long organizationId, Long userId);

    @Query("SELECT om FROM OrganizationMember om WHERE om.organization.id = :orgId AND " +
           "(LOWER(om.user.fullName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(om.user.email) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<OrganizationMember> searchByOrganizationIdAndKeyword(@Param("orgId") Long orgId,
                                                               @Param("search") String search,
                                                               Pageable pageable);

    @Query("SELECT om FROM OrganizationMember om WHERE om.organization.id = :orgId AND om.status = :status AND " +
           "(LOWER(om.user.fullName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(om.user.email) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<OrganizationMember> searchByOrganizationIdAndStatusAndKeyword(@Param("orgId") Long orgId,
                                                                        @Param("status") String status,
                                                                        @Param("search") String search,
                                                                        Pageable pageable);
    // ===== NEW: Fetch members with users eagerly to avoid N+1 =====
    @Query("SELECT om FROM OrganizationMember om JOIN FETCH om.user WHERE om.organization.id = :orgId")
    List<OrganizationMember> findByOrganizationIdWithUser(@Param("orgId") Long orgId);
}