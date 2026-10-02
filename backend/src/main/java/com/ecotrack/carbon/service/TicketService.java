package com.ecotrack.carbon.service;

import com.ecotrack.carbon.dto.request.TicketReplyRequest;
import com.ecotrack.carbon.dto.request.TicketRequest;
import com.ecotrack.carbon.dto.request.TicketStatusUpdateRequest;
import com.ecotrack.carbon.dto.response.TicketReplyResponse;
import com.ecotrack.carbon.dto.response.TicketResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface TicketService {

    TicketResponse createTicket(Long userId, TicketRequest request);

    TicketResponse getTicket(Long ticketId, Long userId, boolean isAdmin);

    List<TicketResponse> getUserTickets(Long userId);

    Page<TicketResponse> getUserTicketsPaginated(Long userId, Pageable pageable);

    Page<TicketResponse> getAllTickets(Pageable pageable);

    TicketReplyResponse addReply(Long userId, TicketReplyRequest request, boolean isAdmin);

    TicketResponse updateTicketStatus(Long userId, TicketStatusUpdateRequest request, boolean isAdmin);

    TicketResponse updateTicket(Long ticketId, Long userId, TicketRequest request, boolean isAdmin);

    void deleteTicket(Long ticketId, Long userId, boolean isAdmin);

    TicketResponse assignTicket(Long ticketId, Long adminId, Long assignToUserId);

    List<TicketResponse> getTicketsByStatus(String status);

    List<TicketResponse> getTicketsByPriority(String priority);

    long getTicketCountForUser(Long userId);

    long getActiveTicketCount();

    List<TicketResponse> getTicketsAssignedToAdmin(Long adminId);
}