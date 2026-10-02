package com.ecotrack.carbon.repository;

import com.ecotrack.carbon.entity.Ticket;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface TicketRepository extends JpaRepository<Ticket, Long> {

    List<Ticket> findByUserIdOrderByCreatedAtDesc(Long userId);

    Page<Ticket> findAllByOrderByCreatedAtDesc(Pageable pageable);

    @Query("SELECT t FROM Ticket t WHERE t.user.id = :userId ORDER BY t.createdAt DESC")
    Page<Ticket> findByUserIdOrderByCreatedAtDesc(@Param("userId") Long userId, Pageable pageable);

    @Query("SELECT t FROM Ticket t WHERE t.status = :status ORDER BY t.createdAt DESC")
    List<Ticket> findByStatusOrderByCreatedAtDesc(@Param("status") String status);

    @Query("SELECT t FROM Ticket t WHERE t.priority = :priority ORDER BY t.createdAt DESC")
    List<Ticket> findByPriorityOrderByCreatedAtDesc(@Param("priority") String priority);

    Optional<Ticket> findByTicketId(String ticketId);

    long countByUserId(Long userId);

    long countByStatus(String status);

    @Query("SELECT COUNT(t) FROM Ticket t WHERE t.status = 'OPEN' OR t.status = 'IN_PROGRESS'")
    long countActiveTickets();

    @Query("SELECT t FROM Ticket t WHERE t.assignedTo = :adminId ORDER BY t.createdAt DESC")
    List<Ticket> findByAssignedToOrderByCreatedAtDesc(@Param("adminId") Long adminId);
}