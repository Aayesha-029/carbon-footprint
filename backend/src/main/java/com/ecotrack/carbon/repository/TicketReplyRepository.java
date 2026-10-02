package com.ecotrack.carbon.repository;

import com.ecotrack.carbon.entity.TicketReply;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface TicketReplyRepository extends JpaRepository<TicketReply, Long> {

    List<TicketReply> findByTicketIdOrderByCreatedAtAsc(Long ticketId);

    @Query("SELECT COUNT(r) FROM TicketReply r WHERE r.ticket.id = :ticketId")
    long countByTicketId(@Param("ticketId") Long ticketId);

    @Query("SELECT r FROM TicketReply r WHERE r.ticket.id = :ticketId AND r.isAdmin = true")
    List<TicketReply> findAdminRepliesByTicketId(@Param("ticketId") Long ticketId);
}