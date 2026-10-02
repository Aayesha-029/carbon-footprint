package com.ecotrack.carbon.service;

import com.ecotrack.carbon.dto.request.TicketReplyRequest;
import com.ecotrack.carbon.dto.request.TicketRequest;
import com.ecotrack.carbon.dto.request.TicketStatusUpdateRequest;
import com.ecotrack.carbon.dto.response.TicketReplyResponse;
import com.ecotrack.carbon.dto.response.TicketResponse;
import com.ecotrack.carbon.entity.Ticket;
import com.ecotrack.carbon.entity.TicketReply;
import com.ecotrack.carbon.entity.User;
import com.ecotrack.carbon.repository.TicketReplyRepository;
import com.ecotrack.carbon.repository.TicketRepository;
import com.ecotrack.carbon.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TicketServiceImpl implements TicketService {

    private final TicketRepository ticketRepository;
    private final TicketReplyRepository ticketReplyRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    private static final List<String> VALID_CATEGORIES = List.of(
        "Dashboard Issue", "Activity Logging", "Goal Tracking",
        "Analytics", "Profile", "Authentication",
        "Bug Report", "Feature Request", "Other"
    );

    private static final List<String> VALID_STATUSES = List.of(
        "OPEN", "IN_PROGRESS", "PENDING", "RESOLVED", "CLOSED"
    );

    private static final List<String> VALID_PRIORITIES = List.of(
        "LOW", "MEDIUM", "HIGH"
    );

    @Override
    @Transactional
    public TicketResponse createTicket(Long userId, TicketRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Validate category
        if (!VALID_CATEGORIES.contains(request.getCategory())) {
            throw new RuntimeException("Invalid category. Valid categories: " + String.join(", ", VALID_CATEGORIES));
        }

        // Validate priority
        if (!VALID_PRIORITIES.contains(request.getPriority())) {
            throw new RuntimeException("Invalid priority. Valid priorities: " + String.join(", ", VALID_PRIORITIES));
        }

        // Generate unique ticket ID
        String ticketId = "TKT-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        Ticket ticket = new Ticket();
        ticket.setTicketId(ticketId);
        ticket.setUser(user);
        ticket.setSubject(request.getSubject());
        ticket.setCategory(request.getCategory());
        ticket.setPriority(request.getPriority());
        ticket.setDescription(request.getDescription());
        ticket.setStatus("OPEN");
        ticket.setCreatedAt(LocalDateTime.now());
        ticket.setUpdatedAt(LocalDateTime.now());

        Ticket saved = ticketRepository.save(ticket);

        // Send notification to admin
        try {
            // Get admin users
            List<User> admins = userRepository.findAll().stream()
                    .filter(u -> "ADMIN".equals(u.getRole()))
                    .collect(Collectors.toList());
            
            for (User admin : admins) {
                notificationService.sendNotification(
                        admin.getId(),
                        "NEW_TICKET",
                        "🆕 New Support Ticket",
                        "New ticket #" + ticketId + " created by " + user.getFullName() + " (Priority: " + request.getPriority() + ")",
                        "/admin/tickets/" + saved.getId()
                );
            }
        } catch (Exception e) {
            System.err.println("Failed to send admin notification: " + e.getMessage());
        }

        return toResponse(saved);
    }

    @Override
    public TicketResponse getTicket(Long ticketId, Long userId, boolean isAdmin) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));

        // Check permission
        if (!isAdmin && !ticket.getUser().getId().equals(userId)) {
            throw new RuntimeException("You can only view your own tickets");
        }

        return toResponse(ticket);
    }

    @Override
    public List<TicketResponse> getUserTickets(Long userId) {
        return ticketRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public Page<TicketResponse> getUserTicketsPaginated(Long userId, Pageable pageable) {
        return ticketRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable)
                .map(this::toResponse);
    }

    @Override
    public Page<TicketResponse> getAllTickets(Pageable pageable) {
        return ticketRepository.findAllByOrderByCreatedAtDesc(pageable)
                .map(this::toResponse);
    }

    @Override
    @Transactional
    public TicketReplyResponse addReply(Long userId, TicketReplyRequest request, boolean isAdmin) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Ticket ticket = ticketRepository.findById(request.getTicketId())
                .orElseThrow(() -> new RuntimeException("Ticket not found"));

        // Check permission
        if (!isAdmin && !ticket.getUser().getId().equals(userId)) {
            throw new RuntimeException("You can only reply to your own tickets");
        }

        TicketReply reply = new TicketReply();
        reply.setTicket(ticket);
        reply.setUser(user);
        reply.setMessage(request.getMessage());
        reply.setAdmin(isAdmin);
        reply.setCreatedAt(LocalDateTime.now());

        TicketReply saved = ticketReplyRepository.save(reply);

        // Update ticket status if admin replies
        if (isAdmin && "OPEN".equals(ticket.getStatus())) {
            ticket.setStatus("IN_PROGRESS");
            ticket.setUpdatedAt(LocalDateTime.now());
            ticketRepository.save(ticket);
        }

        // Send notification
        try {
            if (isAdmin) {
                // Notify the ticket creator
                notificationService.sendNotification(
                        ticket.getUser().getId(),
                        "TICKET_REPLY",
                        "💬 Admin Replied to Your Ticket",
                        "Admin replied to ticket #" + ticket.getTicketId() + ": " + ticket.getSubject(),
                        "/support/ticket/" + ticket.getId()
                );
            } else {
                // Notify admin
                List<User> admins = userRepository.findAll().stream()
                        .filter(u -> "ADMIN".equals(u.getRole()))
                        .collect(Collectors.toList());
                for (User admin : admins) {
                    notificationService.sendNotification(
                            admin.getId(),
                            "TICKET_REPLY",
                            "💬 User Replied to Ticket",
                            user.getFullName() + " replied to ticket #" + ticket.getTicketId(),
                            "/admin/tickets/" + ticket.getId()
                    );
                }
            }
        } catch (Exception e) {
            System.err.println("Failed to send reply notification: " + e.getMessage());
        }

        return toReplyResponse(saved);
    }

    @Override
    @Transactional
    public TicketResponse updateTicketStatus(Long userId, TicketStatusUpdateRequest request, boolean isAdmin) {
        if (!isAdmin) {
            throw new RuntimeException("Only admins can update ticket status");
        }

        Ticket ticket = ticketRepository.findById(request.getTicketId())
                .orElseThrow(() -> new RuntimeException("Ticket not found"));

        if (!VALID_STATUSES.contains(request.getStatus())) {
            throw new RuntimeException("Invalid status. Valid statuses: " + String.join(", ", VALID_STATUSES));
        }

        String oldStatus = ticket.getStatus();
        ticket.setStatus(request.getStatus());
        ticket.setUpdatedAt(LocalDateTime.now());

        Ticket updated = ticketRepository.save(ticket);

        // Send notification to user
        try {
            notificationService.sendNotification(
                    ticket.getUser().getId(),
                    "TICKET_STATUS_CHANGED",
                    "📋 Ticket Status Updated",
                    "Ticket #" + ticket.getTicketId() + " status changed from " + oldStatus + " to " + request.getStatus(),
                    "/support/ticket/" + ticket.getId()
            );
        } catch (Exception e) {
            System.err.println("Failed to send status update notification: " + e.getMessage());
        }

        return toResponse(updated);
    }

    @Override
    @Transactional
    public TicketResponse updateTicket(Long ticketId, Long userId, TicketRequest request, boolean isAdmin) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));

        if (!isAdmin && !ticket.getUser().getId().equals(userId)) {
            throw new RuntimeException("You can only update your own tickets");
        }

        if (!isAdmin) {
            // Users can only update certain fields
            ticket.setSubject(request.getSubject());
            ticket.setDescription(request.getDescription());
        } else {
            // Admins can update everything
            ticket.setSubject(request.getSubject());
            ticket.setCategory(request.getCategory());
            ticket.setPriority(request.getPriority());
            ticket.setDescription(request.getDescription());
        }

        ticket.setUpdatedAt(LocalDateTime.now());
        Ticket updated = ticketRepository.save(ticket);

        return toResponse(updated);
    }

    @Override
    @Transactional
    public void deleteTicket(Long ticketId, Long userId, boolean isAdmin) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));

        if (!isAdmin && !ticket.getUser().getId().equals(userId)) {
            throw new RuntimeException("You can only delete your own tickets");
        }

        // Delete all replies first
        List<TicketReply> replies = ticketReplyRepository.findByTicketIdOrderByCreatedAtAsc(ticketId);
        ticketReplyRepository.deleteAll(replies);

        // Delete the ticket
        ticketRepository.delete(ticket);
    }

    @Override
    @Transactional
    public TicketResponse assignTicket(Long ticketId, Long adminId, Long assignToUserId) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));

        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> new RuntimeException("Admin not found"));

        // Check if admin
        if (!"ADMIN".equals(admin.getRole())) {
            throw new RuntimeException("Only admins can assign tickets");
        }

        User assignTo = userRepository.findById(assignToUserId)
                .orElseThrow(() -> new RuntimeException("User to assign not found"));

        ticket.setAssignedTo(assignToUserId);
        ticket.setUpdatedAt(LocalDateTime.now());

        Ticket updated = ticketRepository.save(ticket);

        // Send notification to assigned user
        try {
            notificationService.sendNotification(
                    assignToUserId,
                    "TICKET_ASSIGNED",
                    "📋 Ticket Assigned to You",
                    "Ticket #" + ticket.getTicketId() + " has been assigned to you by " + admin.getFullName(),
                    "/support/ticket/" + ticket.getId()
            );
        } catch (Exception e) {
            System.err.println("Failed to send assignment notification: " + e.getMessage());
        }

        return toResponse(updated);
    }

    @Override
    public List<TicketResponse> getTicketsByStatus(String status) {
        return ticketRepository.findByStatusOrderByCreatedAtDesc(status)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<TicketResponse> getTicketsByPriority(String priority) {
        return ticketRepository.findByPriorityOrderByCreatedAtDesc(priority)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public long getTicketCountForUser(Long userId) {
        return ticketRepository.countByUserId(userId);
    }

    @Override
    public long getActiveTicketCount() {
        return ticketRepository.countActiveTickets();
    }

    @Override
    public List<TicketResponse> getTicketsAssignedToAdmin(Long adminId) {
        return ticketRepository.findByAssignedToOrderByCreatedAtDesc(adminId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    // ============ Helper Methods ============

    private TicketResponse toResponse(Ticket ticket) {
        TicketResponse response = new TicketResponse();
        response.setId(ticket.getId());
        response.setTicketId(ticket.getTicketId());
        response.setUserId(ticket.getUser().getId());
        response.setUserName(ticket.getUser().getFullName());
        response.setUserEmail(ticket.getUser().getEmail());
        response.setSubject(ticket.getSubject());
        response.setCategory(ticket.getCategory());
        response.setPriority(ticket.getPriority());
        response.setDescription(ticket.getDescription());
        response.setStatus(ticket.getStatus());
        response.setAssignedTo(ticket.getAssignedTo());
        response.setCreatedAt(ticket.getCreatedAt());
        response.setUpdatedAt(ticket.getUpdatedAt());

        // Get assigned user name
        if (ticket.getAssignedTo() != null) {
            userRepository.findById(ticket.getAssignedTo()).ifPresent(assignedUser ->
                    response.setAssignedToName(assignedUser.getFullName())
            );
        }

        // Get replies
        List<TicketReply> replies = ticketReplyRepository.findByTicketIdOrderByCreatedAtAsc(ticket.getId());
        response.setReplies(replies.stream()
                .map(this::toReplyResponse)
                .collect(Collectors.toList()));
        response.setReplyCount(replies.size());

        return response;
    }

    private TicketReplyResponse toReplyResponse(TicketReply reply) {
        TicketReplyResponse response = new TicketReplyResponse();
        response.setId(reply.getId());
        response.setUserId(reply.getUser().getId());
        response.setUserName(reply.getUser().getFullName());
        response.setUserEmail(reply.getUser().getEmail());
        response.setMessage(reply.getMessage());
        response.setAdmin(reply.isAdmin());
        response.setCreatedAt(reply.getCreatedAt());

        // Calculate time ago
        LocalDateTime now = LocalDateTime.now();
        long minutes = ChronoUnit.MINUTES.between(reply.getCreatedAt(), now);
        long hours = ChronoUnit.HOURS.between(reply.getCreatedAt(), now);
        long days = ChronoUnit.DAYS.between(reply.getCreatedAt(), now);

        if (minutes < 1) {
            response.setTimeAgo("Just now");
        } else if (minutes < 60) {
            response.setTimeAgo(minutes + "m ago");
        } else if (hours < 24) {
            response.setTimeAgo(hours + "h ago");
        } else {
            response.setTimeAgo(days + "d ago");
        }

        return response;
    }
}