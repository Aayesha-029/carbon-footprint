-- Create support_tickets table with LONGTEXT for screenshot_url
CREATE TABLE IF NOT EXISTS support_tickets (
    id BIGINT NOT NULL AUTO_INCREMENT,
    ticket_id VARCHAR(20) NOT NULL UNIQUE,
    user_id BIGINT NOT NULL,
    subject VARCHAR(200) NOT NULL,
    category VARCHAR(50) NOT NULL,
    priority VARCHAR(20) NOT NULL,
    description TEXT NOT NULL,
    screenshot_url LONGTEXT,
    status VARCHAR(20) DEFAULT 'OPEN',
    assigned_to BIGINT,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_ticket_user FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create ticket_replies table
CREATE TABLE IF NOT EXISTS ticket_replies (
    id BIGINT NOT NULL AUTO_INCREMENT,
    ticket_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    message TEXT NOT NULL,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_reply_ticket FOREIGN KEY (ticket_id) REFERENCES support_tickets(id) ON DELETE CASCADE,
    CONSTRAINT fk_reply_user FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create indexes for performance
CREATE INDEX idx_ticket_user_id ON support_tickets(user_id);
CREATE INDEX idx_ticket_status ON support_tickets(status);
CREATE INDEX idx_ticket_priority ON support_tickets(priority);
CREATE INDEX idx_ticket_created_at ON support_tickets(created_at DESC);
CREATE INDEX idx_reply_ticket_id ON ticket_replies(ticket_id);
CREATE INDEX idx_reply_created_at ON ticket_replies(created_at DESC);