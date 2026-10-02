package com.ecotrack.carbon.service;

import com.ecotrack.carbon.dto.response.NotificationResponse;
import com.ecotrack.carbon.entity.Notification;
import com.ecotrack.carbon.entity.User;
import com.ecotrack.carbon.repository.NotificationRepository;
import com.ecotrack.carbon.repository.UserRepository;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final JavaMailSender mailSender;

    @Value("${app.frontend.url:http://localhost:3000}")
    private String frontendUrl;

    // ============ EXISTING IN-APP NOTIFICATION METHODS ============

    @Transactional
    public void sendNotification(Long userId, String type, String title, String message, String link) {
        try {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            Notification notification = new Notification();
            notification.setUser(user);
            notification.setType(type);
            notification.setTitle(title);
            notification.setMessage(message);
            notification.setLink(link);
            notification.setCreatedAt(LocalDateTime.now());
            notification.setRead(false);
            notificationRepository.save(notification);

            log.info("✅ In-app notification saved: {} for user: {}", type, user.getEmail());

        } catch (Exception e) {
            log.error("❌ Failed to send notification: {}", e.getMessage());
        }
    }

    // ============ SIMPLE PLAIN-TEXT EMAIL (FALLBACK) ============

    public void sendSimpleEmail(String to, String subject, String text) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(to);
            message.setSubject(subject);
            message.setText(text);
            mailSender.send(message);
            log.info("✅ Plain email sent to: {}", to);
        } catch (Exception e) {
            log.error("❌ Failed to send plain email to {}: {}", to, e.getMessage());
        }
    }

    // ============ HTML EMAIL METHODS ============

    private void sendHtmlEmail(String to, String subject, String htmlContent) {
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);
            mailSender.send(mimeMessage);
            log.info("✅ HTML email sent to: {}", to);
        } catch (Exception e) {
            log.error("❌ Failed to send HTML email to {}: {}", to, e.getMessage());
            String plainText = htmlContent.replaceAll("<[^>]*>", "");
            sendSimpleEmail(to, subject, plainText);
        }
    }

    // ============ PROFESSIONAL EMAIL TEMPLATES ============

    public void sendWelcomeEmail(User user) {
        String html = buildWelcomeEmail(user.getFullName());
        sendHtmlEmail(user.getEmail(), "🌿 Welcome to CarbonTrack!", html);
        sendNotification(user.getId(), "WELCOME",
                "🌿 Welcome to CarbonTrack!",
                "Welcome " + user.getFullName() + "! Start tracking your carbon footprint.",
                "/dashboard");
    }

    public void sendLoginAlertEmail(User user) {
        String html = buildLoginAlertEmail(user.getFullName());
        sendHtmlEmail(user.getEmail(), "🔐 New Login to CarbonTrack", html);
    }

    public void sendPasswordResetEmail(User user, String resetToken) {
        String resetLink = frontendUrl + "/reset-password?token=" + resetToken;
        String html = buildPasswordResetEmail(user.getFullName(), resetLink);
        sendHtmlEmail(user.getEmail(), "🔑 Reset Your CarbonTrack Password", html);
        sendNotification(user.getId(), "PASSWORD_RESET",
                "🔑 Password Reset Requested",
                "A password reset was requested. Check your email for the link.",
                "/settings");
    }

    public void sendPasswordResetSuccessEmail(User user) {
        String html = buildPasswordResetSuccessEmail(user.getFullName());
        sendHtmlEmail(user.getEmail(), "✅ Password Reset Successful", html);
    }

    // ============ HTML TEMPLATE BUILDERS ============

    private String buildWelcomeEmail(String name) {
        String dashboardLink = frontendUrl + "/dashboard";
        return """
        <!DOCTYPE html>
        <html>
        <head><meta charset="UTF-8"></head>
        <body style="font-family: 'Segoe UI', Arial, sans-serif; background: #f4f7f6; padding: 20px; margin: 0;">
        <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 16px; padding: 30px; box-shadow: 0 4px 12px rgba(0,0,0,0.06);">
          <div style="text-align: center; margin-bottom: 24px;">
            <span style="font-size: 30px; font-weight: bold; color: #22c55e;">🌿 CarbonTrack</span>
          </div>
          <h2 style="color: #0f172a; margin-top: 0;">Welcome, %s! 👋</h2>
          <p style="color: #475569; font-size: 16px; line-height: 1.6;">Thank you for joining <strong>CarbonTrack</strong> – your personal carbon footprint tracker.</p>
          <div style="background: #f8fafc; border-radius: 8px; padding: 16px; margin: 20px 0;">
            <p style="margin: 0; color: #0f172a; font-weight: 600;">🌟 Get started:</p>
            <ul style="color: #475569; padding-left: 20px;">
              <li>Log your daily activities (Transport, Electricity, Food, Shopping)</li>
              <li>Set sustainability goals and track progress</li>
              <li>Earn badges and compete on the leaderboard</li>
            </ul>
          </div>
          <a href="%s" style="display: inline-block; background: #22c55e; color: #ffffff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">Go to Dashboard</a>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;">
          <p style="color: #94a3b8; font-size: 12px; text-align: center;">This email was sent because you registered on CarbonTrack.</p>
        </div>
        </body>
        </html>
        """.formatted(name, dashboardLink);
    }

    private String buildLoginAlertEmail(String name) {
        return """
        <!DOCTYPE html>
        <html>
        <head><meta charset="UTF-8"></head>
        <body style="font-family: 'Segoe UI', Arial, sans-serif; background: #f4f7f6; padding: 20px;">
        <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 16px; padding: 30px; box-shadow: 0 4px 12px rgba(0,0,0,0.06);">
          <div style="text-align: center; margin-bottom: 24px;">
            <span style="font-size: 28px; font-weight: bold; color: #22c55e;">🌿 CarbonTrack</span>
          </div>
          <h2 style="color: #0f172a; margin-top: 0;">👋 Welcome Back, %s!</h2>
          <p style="color: #475569; font-size: 16px; line-height: 1.6;">You have successfully logged in to your CarbonTrack account.</p>
          <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 12px 16px; margin: 20px 0;">
            <p style="margin: 0; color: #991b1b; font-size: 14px;">⚠️ If you did not log in, please <a href="%s/support" style="color: #22c55e;">contact support</a> immediately.</p>
          </div>
          <a href="%s/dashboard" style="display: inline-block; background: #22c55e; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">Go to Dashboard</a>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;">
          <p style="color: #94a3b8; font-size: 12px; text-align: center;">This is an automated security alert.</p>
        </div>
        </body>
        </html>
        """.formatted(name, frontendUrl, frontendUrl);
    }

    private String buildPasswordResetEmail(String name, String resetLink) {
        return """
        <!DOCTYPE html>
        <html>
        <head><meta charset="UTF-8"></head>
        <body style="font-family: 'Segoe UI', Arial, sans-serif; background: #f4f7f6; padding: 20px;">
        <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 16px; padding: 30px; box-shadow: 0 4px 12px rgba(0,0,0,0.06);">
          <div style="text-align: center; margin-bottom: 24px;">
            <span style="font-size: 28px; font-weight: bold; color: #22c55e;">🌿 CarbonTrack</span>
          </div>
          <h2 style="color: #0f172a; margin-top: 0;">🔑 Reset Your Password, %s</h2>
          <p style="color: #475569; font-size: 16px; line-height: 1.6;">We received a request to reset your CarbonTrack password. Click the link below.</p>
          <div style="text-align: center; margin: 28px 0;">
            <a href="%s" style="display: inline-block; background: #22c55e; color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">Reset Password</a>
          </div>
          <p style="color: #475569; font-size: 14px; line-height: 1.6;">This link expires in <strong>1 hour</strong>. If you didn't request this, ignore this email.</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;">
          <p style="color: #94a3b8; font-size: 12px; text-align: center;">If the button doesn't work, copy this link:<br><span style="word-break: break-all;">%s</span></p>
        </div>
        </body>
        </html>
        """.formatted(name, resetLink, resetLink);
    }

    private String buildPasswordResetSuccessEmail(String name) {
        return """
        <!DOCTYPE html>
        <html>
        <head><meta charset="UTF-8"></head>
        <body style="font-family: 'Segoe UI', Arial, sans-serif; background: #f4f7f6; padding: 20px;">
        <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 16px; padding: 30px; box-shadow: 0 4px 12px rgba(0,0,0,0.06);">
          <div style="text-align: center; margin-bottom: 24px;">
            <span style="font-size: 28px; font-weight: bold; color: #22c55e;">🌿 CarbonTrack</span>
          </div>
          <h2 style="color: #0f172a; margin-top: 0;">✅ Password Reset Successful, %s</h2>
          <p style="color: #475569; font-size: 16px; line-height: 1.6;">Your password has been successfully reset. You can now log in with your new password.</p>
          <a href="%s/login" style="display: inline-block; background: #22c55e; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">Log In Now</a>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;">
          <p style="color: #94a3b8; font-size: 12px; text-align: center;">If you did not perform this action, contact support.</p>
        </div>
        </body>
        </html>
        """.formatted(name, frontendUrl);
    }

    // ============ EXISTING NOTIFICATION HELPERS (KEPT UNCHANGED) ============

    public List<NotificationResponse> getUserNotifications(Long userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<NotificationResponse> getUnreadNotifications(Long userId) {
        return notificationRepository.findByUserIdAndIsReadFalseOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public long getUnreadCount(Long userId) {
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }

    @Transactional
    public void markAllAsRead(Long userId) {
        notificationRepository.markAllAsRead(userId);
    }

    @Transactional
    public void deleteAllNotifications(Long userId) {
        notificationRepository.deleteAllByUserId(userId);
    }

    private NotificationResponse toResponse(Notification notification) {
        NotificationResponse response = new NotificationResponse();
        response.setId(notification.getId());
        response.setType(notification.getType());
        response.setTitle(notification.getTitle());
        response.setMessage(notification.getMessage());
        response.setRead(notification.isRead());
        response.setLink(notification.getLink());
        response.setCreatedAt(notification.getCreatedAt());

        LocalDateTime now = LocalDateTime.now();
        long minutes = ChronoUnit.MINUTES.between(notification.getCreatedAt(), now);
        long hours = ChronoUnit.HOURS.between(notification.getCreatedAt(), now);
        long days = ChronoUnit.DAYS.between(notification.getCreatedAt(), now);

        if (minutes < 1) response.setTimeAgo("Just now");
        else if (minutes < 60) response.setTimeAgo(minutes + " minutes ago");
        else if (hours < 24) response.setTimeAgo(hours + " hours ago");
        else response.setTimeAgo(days + " days ago");

        return response;
    }

    @Transactional
    public void notifyActivityLogged(Long userId, String activityType, double co2e) {
        sendNotification(userId, "ACTIVITY_LOGGED",
            "📝 Activity Logged!",
            "You logged '" + activityType + "' with " + String.format("%.2f", co2e) + " kg CO₂e.",
            "/activities");
    }

    @Transactional
    public void notifyActivityDeleted(Long userId, String activityType) {
        sendNotification(userId, "ACTIVITY_DELETED",
            "🗑️ Activity Deleted",
            "You deleted '" + activityType + "'.",
            "/history");
    }

    @Transactional
    public void notifyGoalCreated(Long userId, String goalName, double targetCO2) {
        sendNotification(userId, "GOAL_CREATED",
            "🎯 New Goal Created!",
            "Goal: '" + goalName + "' target " + String.format("%.2f", targetCO2) + " kg CO₂e.",
            "/goals");
    }

    @Transactional
    public void notifyGoalDeleted(Long userId, String goalName) {
        sendNotification(userId, "GOAL_DELETED",
            "🎯 Goal Deleted",
            "You deleted goal: '" + goalName + "'.",
            "/goals");
    }

    @Transactional
    public void notifyGoalCompleted(Long userId, String goalName) {
        sendNotification(userId, "GOAL_COMPLETED",
            "🎉 Goal Achieved!",
            "You completed goal: '" + goalName + "'!",
            "/goals");
    }

    @Transactional
    public void notifyBadgeEarned(Long userId, String badgeName) {
        sendNotification(userId, "BADGE_EARNED",
            "🏅 New Badge Earned!",
            "You earned the '" + badgeName + "' badge!",
            "/badges");
    }

    @Transactional
    public void notifyBadgeDeleted(Long userId, String badgeName) {
        sendNotification(userId, "BADGE_DELETED",
            "🗑️ Badge Removed",
            "Badge '" + badgeName + "' removed.",
            "/badges");
    }

    @Transactional
    public void notifyWelcome(Long userId, String userName) {
        sendNotification(userId, "WELCOME",
            "🌿 Welcome to CarbonTrack!",
            "Welcome " + userName + "! Start tracking your footprint.",
            "/dashboard");
    }

    @Transactional
    public void notifyLogin(Long userId) {
        sendNotification(userId, "LOGIN",
            "👋 Welcome Back!",
            "You logged in to CarbonTrack.",
            "/dashboard");
    }

    @Transactional
    public void notifyPasswordReset(Long userId) {
        sendNotification(userId, "PASSWORD_RESET",
            "🔑 Password Reset Successful",
            "Your password was reset successfully.",
            "/settings");
    }

    @Transactional
    public void notifyRegistration(Long userId, String userName) {
        sendNotification(userId, "REGISTRATION",
            "🌿 Registration Successful!",
            "Welcome " + userName + "! Your account is ready.",
            "/dashboard");
    }

    @Transactional
    public void notifyNewTicket(Long adminId, String ticketId, String userName, String priority) {
        sendNotification(adminId, "NEW_TICKET",
            "🆕 New Ticket",
            "Ticket #" + ticketId + " by " + userName + " (Priority: " + priority + ")",
            "/admin/tickets");
    }

    @Transactional
    public void notifyTicketReply(Long userId, String ticketId, String replierName, boolean isAdmin) {
        String title = isAdmin ? "💬 Admin Replied" : "💬 User Replied";
        String message = isAdmin ?
            "Admin replied to ticket #" + ticketId :
            replierName + " replied to ticket #" + ticketId;
        sendNotification(userId, "TICKET_REPLY", title, message, "/support/tickets");
    }

    @Transactional
    public void notifyTicketStatusChange(Long userId, String ticketId, String oldStatus, String newStatus) {
        sendNotification(userId, "TICKET_STATUS_CHANGED",
            "📋 Ticket Status Updated",
            "Ticket #" + ticketId + " status changed from " + oldStatus + " to " + newStatus,
            "/support/tickets");
    }

    @Transactional
    public void notifyTicketAssigned(Long userId, String ticketId, String assignedBy) {
        sendNotification(userId, "TICKET_ASSIGNED",
            "📋 Ticket Assigned",
            "Ticket #" + ticketId + " assigned to you by " + assignedBy,
            "/support/tickets");
    }

    @Transactional
    public void notifyTicketResolved(Long userId, String ticketId) {
        sendNotification(userId, "TICKET_RESOLVED",
            "✅ Ticket Resolved",
            "Your ticket #" + ticketId + " has been resolved.",
            "/support/tickets");
    }

    // ==================== NEW: ORGANIZATION INVITATION ====================

    public void sendOrganizationInvitationEmail(String to, String inviterName, String orgName, String inviteLink, LocalDateTime expiry) {
        String html = buildInvitationEmail(inviterName, orgName, inviteLink, expiry);
        sendHtmlEmail(to, "🌿 You're Invited to Join " + orgName + " on CarbonTrack!", html);
        // Optionally send an in-app notification to the inviter? Not needed here.
    }

    private String buildInvitationEmail(String inviterName, String orgName, String inviteLink, LocalDateTime expiry) {
        String expiryDate = expiry != null ? 
                expiry.format(DateTimeFormatter.ofPattern("MMMM dd, yyyy 'at' hh:mm a")) : 
                "7 days";
        return """
        <!DOCTYPE html>
        <html>
        <head><meta charset="UTF-8"></head>
        <body style="font-family: 'Segoe UI', Arial, sans-serif; background: #f4f7f6; padding: 20px; margin: 0;">
        <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 16px; padding: 30px; box-shadow: 0 4px 12px rgba(0,0,0,0.06);">
          <div style="text-align: center; margin-bottom: 24px;">
            <span style="font-size: 30px; font-weight: bold; color: #22c55e;">🌿 CarbonTrack</span>
          </div>
          <h2 style="color: #0f172a; margin-top: 0;">You're Invited! 🎉</h2>
          <p style="color: #475569; font-size: 16px; line-height: 1.6;">
            <strong>%s</strong> has invited you to join the organization <strong>%s</strong> on CarbonTrack.
          </p>
          <p style="color: #475569; font-size: 16px; line-height: 1.6;">
            Click the button below to accept the invitation and start tracking your carbon footprint as part of this organization.
          </p>
          <div style="text-align: center; margin: 28px 0;">
            <a href="%s" style="display: inline-block; background: #22c55e; color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">Accept Invitation</a>
          </div>
          <p style="color: #475569; font-size: 14px; line-height: 1.6;">
            This link expires on <strong>%s</strong>. If you didn't expect this invitation, you can ignore this email.
          </p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;">
          <p style="color: #94a3b8; font-size: 12px; text-align: center;">
            If the button doesn't work, copy this link into your browser:<br>
            <span style="word-break: break-all;">%s</span>
          </p>
        </div>
        </body>
        </html>
        """.formatted(inviterName, orgName, inviteLink, expiryDate, inviteLink);
    }

        // ==================== EMPLOYEE CREDENTIALS EMAIL ====================

       public void sendEmployeeCredentialsEmail(String to, String employeeName,
                                             String inviterName, String orgName,
                                             String username, String tempPassword) {
        // Add ?switch=true so an existing session is cleared on the login page
        String loginUrl = frontendUrl + "/login?switch=true";
        String html = buildCredentialsEmail(employeeName, inviterName, orgName, username, tempPassword, loginUrl);
        sendHtmlEmail(to, "🌿 Welcome to " + orgName + " on CarbonTrack — Your Login Credentials", html);
    }

       public void sendPasswordResetByAdminEmail(String to, String employeeName, String orgName,
                                              String username, String tempPassword) {
        // Add ?switch=true so an existing session is cleared on the login page
        String loginUrl = frontendUrl + "/login?switch=true";
        String html = buildResetByAdminEmail(employeeName, orgName, username, tempPassword, loginUrl);
        sendHtmlEmail(to, "🔑 Your password has been reset — " + orgName, html);
    }

    private String buildCredentialsEmail(String name, String inviter, String org,
                                         String username, String pwd, String loginUrl) {
        return """
        <!DOCTYPE html>
        <html>
        <head><meta charset="UTF-8"></head>
        <body style="font-family: 'Segoe UI', Arial, sans-serif; background: #f4f7f6; padding: 20px; margin: 0;">
        <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 16px; padding: 30px; box-shadow: 0 4px 12px rgba(0,0,0,0.06);">
          <div style="text-align: center; margin-bottom: 24px;">
            <span style="font-size: 30px; font-weight: bold; color: #22c55e;">🌿 CarbonTrack</span>
          </div>
          <h2 style="color: #0f172a; margin-top: 0;">Welcome, %s! 🎉</h2>
          <p style="color: #475569; font-size: 16px; line-height: 1.6;">
            <strong>%s</strong> has added you to the organization <strong>%s</strong> on CarbonTrack.
            Use the credentials below to log in and start tracking your carbon footprint.
          </p>
          <div style="background: #f0fdf4; border-radius: 12px; padding: 20px; margin: 24px 0; border: 1px solid #bbf7d0;">
            <p style="margin: 0 0 8px 0; font-size: 13px; color: #16a34a; font-weight: 600;">YOUR LOGIN CREDENTIALS</p>
            <p style="margin: 6px 0; font-size: 15px; color: #0f172a;"><strong>Username:</strong> <span style="font-family: monospace; background: #ffffff; padding: 3px 8px; border-radius: 4px;">%s</span></p>
            <p style="margin: 6px 0; font-size: 15px; color: #0f172a;"><strong>Temporary Password:</strong> <span style="font-family: monospace; background: #ffffff; padding: 3px 8px; border-radius: 4px;">%s</span></p>
          </div>
          <div style="text-align: center; margin: 28px 0;">
            <a href="%s" style="display: inline-block; background: #22c55e; color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">Log In Now</a>
          </div>
          <p style="color: #475569; font-size: 14px; line-height: 1.6;">
            ⚠️ <strong>Security tip:</strong> Please change your password after your first login from Settings.
          </p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;">
          <p style="color: #94a3b8; font-size: 12px; text-align: center;">If you did not expect this email, please ignore it.</p>
        </div>
        </body>
        </html>
        """.formatted(name, inviter, org, username, pwd, loginUrl);
    }

    private String buildResetByAdminEmail(String name, String org, String username, String pwd, String loginUrl) {
        return """
        <!DOCTYPE html>
        <html>
        <head><meta charset="UTF-8"></head>
        <body style="font-family: 'Segoe UI', Arial, sans-serif; background: #f4f7f6; padding: 20px; margin: 0;">
        <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 16px; padding: 30px; box-shadow: 0 4px 12px rgba(0,0,0,0.06);">
          <div style="text-align: center; margin-bottom: 24px;">
            <span style="font-size: 30px; font-weight: bold; color: #22c55e;">🌿 CarbonTrack</span>
          </div>
          <h2 style="color: #0f172a; margin-top: 0;">Password Reset 🔑</h2>
          <p style="color: #475569; font-size: 16px; line-height: 1.6;">
            Hi <strong>%s</strong>, your password for <strong>%s</strong> has been reset by an administrator.
          </p>
          <div style="background: #f0fdf4; border-radius: 12px; padding: 20px; margin: 24px 0; border: 1px solid #bbf7d0;">
            <p style="margin: 0 0 8px 0; font-size: 13px; color: #16a34a; font-weight: 600;">NEW CREDENTIALS</p>
            <p style="margin: 6px 0; font-size: 15px;"><strong>Username:</strong> <span style="font-family: monospace; background: #ffffff; padding: 3px 8px; border-radius: 4px;">%s</span></p>
            <p style="margin: 6px 0; font-size: 15px;"><strong>Temporary Password:</strong> <span style="font-family: monospace; background: #ffffff; padding: 3px 8px; border-radius: 4px;">%s</span></p>
          </div>
          <div style="text-align: center; margin: 28px 0;">
            <a href="%s" style="display: inline-block; background: #22c55e; color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">Log In</a>
          </div>
          <p style="color: #475569; font-size: 14px;">Please change your password after logging in.</p>
        </div>
        </body>
        </html>
        """.formatted(name, org, username, pwd, loginUrl);
    }
}