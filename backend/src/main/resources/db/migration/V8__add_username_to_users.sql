ALTER TABLE users ADD COLUMN username VARCHAR(100) NULL;
CREATE UNIQUE INDEX idx_users_username ON users(username);