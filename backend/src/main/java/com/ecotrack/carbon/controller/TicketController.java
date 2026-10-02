package com.ecotrack.carbon.controller;

import com.ecotrack.carbon.dto.request.TicketReplyRequest;
import com.ecotrack.carbon.dto.request.TicketRequest;
import com.ecotrack.carbon.dto.request.TicketStatusUpdateRequest;
import com.ecotrack.carbon.dto.response.TicketReplyResponse;
import com.ecotrack.carbon.dto.response.TicketResponse;
import com.ecotrack.carbon.security.JwtUtil;
import com.ecotrack.carbon.service.TicketService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tickets")
@RequiredArgsConstructor
public class TicketController {

    private final TicketService ticketService;
    private final JwtUtil jwtUtil;

    // ============ USER ENDPOINTS ============

    @PostMapping
    public ResponseEntity<Map<String, Object>> createTicket(
            @Valid @RequestBody TicketRequest request,
            @RequestHeader("Authorization") String authHeader) {
        Map<String, Object> response = new HashMap<>();
        try {
            Long userId = extractUserIdFromToken(authHeader);
            if (userId == null) {
                response.put("success", false);
                response.put("error", "Unauthorized");
                return ResponseEntity.status(401).body(response);
            }
            TicketResponse ticket = ticketService.createTicket(userId, request);
            response.put("success", true);
            response.put("ticket", ticket);
            response.put("message", "Ticket created successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @GetMapping("/user")
    public ResponseEntity<Map<String, Object>> getUserTickets(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestHeader("Authorization") String authHeader) {
        Map<String, Object> response = new HashMap<>();
        try {
            Long userId = extractUserIdFromToken(authHeader);
            if (userId == null) {
                response.put("success", false);
                response.put("error", "Unauthorized");
                return ResponseEntity.status(401).body(response);
            }
            Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
            Page<TicketResponse> tickets = ticketService.getUserTicketsPaginated(userId, pageable);
            response.put("success", true);
            response.put("tickets", tickets.getContent());
            response.put("totalPages", tickets.getTotalPages());
            response.put("totalElements", tickets.getTotalElements());
            response.put("currentPage", tickets.getNumber());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getTicket(
            @PathVariable Long id,
            @RequestHeader("Authorization") String authHeader) {
        Map<String, Object> response = new HashMap<>();
        try {
            Long userId = extractUserIdFromToken(authHeader);
            if (userId == null) {
                response.put("success", false);
                response.put("error", "Unauthorized");
                return ResponseEntity.status(401).body(response);
            }
            String role = extractRoleFromToken(authHeader);
            boolean isAdmin = "ADMIN".equals(role);
            TicketResponse ticket = ticketService.getTicket(id, userId, isAdmin);
            response.put("success", true);
            response.put("ticket", ticket);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @PostMapping("/{id}/reply")
    public ResponseEntity<Map<String, Object>> addReply(
            @PathVariable Long id,
            @Valid @RequestBody TicketReplyRequest request,
            @RequestHeader("Authorization") String authHeader) {
        Map<String, Object> response = new HashMap<>();
        try {
            Long userId = extractUserIdFromToken(authHeader);
            if (userId == null) {
                response.put("success", false);
                response.put("error", "Unauthorized");
                return ResponseEntity.status(401).body(response);
            }
            String role = extractRoleFromToken(authHeader);
            boolean isAdmin = "ADMIN".equals(role);
            request.setTicketId(id);
            TicketReplyResponse reply = ticketService.addReply(userId, request, isAdmin);
            response.put("success", true);
            response.put("reply", reply);
            response.put("message", "Reply sent successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<Map<String, Object>> updateTicketStatus(
            @PathVariable Long id,
            @Valid @RequestBody TicketStatusUpdateRequest request,
            @RequestHeader("Authorization") String authHeader) {
        Map<String, Object> response = new HashMap<>();
        try {
            Long userId = extractUserIdFromToken(authHeader);
            if (userId == null) {
                response.put("success", false);
                response.put("error", "Unauthorized");
                return ResponseEntity.status(401).body(response);
            }
            String role = extractRoleFromToken(authHeader);
            boolean isAdmin = "ADMIN".equals(role);
            request.setTicketId(id);
            TicketResponse ticket = ticketService.updateTicketStatus(userId, request, isAdmin);
            response.put("success", true);
            response.put("ticket", ticket);
            response.put("message", "Status updated successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @GetMapping("/categories")
    public ResponseEntity<Map<String, Object>> getCategories() {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("categories", List.of(
            "Dashboard Issue", "Activity Logging", "Goal Tracking",
            "Analytics", "Profile", "Authentication",
            "Bug Report", "Feature Request", "Other"
        ));
        return ResponseEntity.ok(response);
    }

    @GetMapping("/priorities")
    public ResponseEntity<Map<String, Object>> getPriorities() {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("priorities", List.of("LOW", "MEDIUM", "HIGH"));
        return ResponseEntity.ok(response);
    }

    // ============ ADMIN ENDPOINTS ============

    @GetMapping("/admin/all")
    public ResponseEntity<Map<String, Object>> getAllTickets(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String priority,
            @RequestHeader("Authorization") String authHeader) {
        Map<String, Object> response = new HashMap<>();
        try {
            String role = extractRoleFromToken(authHeader);
            if (!"ADMIN".equals(role)) {
                response.put("success", false);
                response.put("error", "Unauthorized");
                return ResponseEntity.status(403).body(response);
            }

            Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
            Page<TicketResponse> tickets = ticketService.getAllTickets(pageable);
            
            response.put("success", true);
            response.put("tickets", tickets.getContent());
            response.put("totalPages", tickets.getTotalPages());
            response.put("totalElements", tickets.getTotalElements());
            response.put("currentPage", tickets.getNumber());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @GetMapping("/admin/stats")
    public ResponseEntity<Map<String, Object>> getTicketStats(
            @RequestHeader("Authorization") String authHeader) {
        Map<String, Object> response = new HashMap<>();
        try {
            String role = extractRoleFromToken(authHeader);
            if (!"ADMIN".equals(role)) {
                response.put("success", false);
                response.put("error", "Unauthorized");
                return ResponseEntity.status(403).body(response);
            }

            response.put("success", true);
            response.put("total", ticketService.getAllTickets(PageRequest.of(0, 1)).getTotalElements());
            response.put("active", ticketService.getActiveTicketCount());
            response.put("open", ticketService.getTicketsByStatus("OPEN").size());
            response.put("inProgress", ticketService.getTicketsByStatus("IN_PROGRESS").size());
            response.put("resolved", ticketService.getTicketsByStatus("RESOLVED").size());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @DeleteMapping("/admin/{id}")
    public ResponseEntity<Map<String, Object>> deleteTicket(
            @PathVariable Long id,
            @RequestHeader("Authorization") String authHeader) {
        Map<String, Object> response = new HashMap<>();
        try {
            Long userId = extractUserIdFromToken(authHeader);
            if (userId == null) {
                response.put("success", false);
                response.put("error", "Unauthorized");
                return ResponseEntity.status(401).body(response);
            }
            String role = extractRoleFromToken(authHeader);
            boolean isAdmin = "ADMIN".equals(role);
            ticketService.deleteTicket(id, userId, isAdmin);
            response.put("success", true);
            response.put("message", "Ticket deleted successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    // ============ HELPER METHODS ============

    private Long extractUserIdFromToken(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return null;
        }
        String token = authHeader.substring(7);
        try {
            return jwtUtil.extractUserId(token);
        } catch (Exception e) {
            return null;
        }
    }

    private String extractRoleFromToken(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return null;
        }
        String token = authHeader.substring(7);
        try {
            return jwtUtil.extractRole(token);
        } catch (Exception e) {
            return null;
        }
    }
}