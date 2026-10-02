-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
    id BIGINT NOT NULL AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    avatar_url VARCHAR(500),
    bio VARCHAR(500),
    preferred_units VARCHAR(20) DEFAULT 'METRIC',
    diet_type VARCHAR(20) DEFAULT 'OMNIVORE',
    primary_transport_mode VARCHAR(20) DEFAULT 'CAR',
    energy_source VARCHAR(20) DEFAULT 'GRID',
    notifications_enabled BOOLEAN DEFAULT TRUE,
    theme VARCHAR(20) DEFAULT 'light',
    language VARCHAR(10) DEFAULT 'en',
    updated_at DATETIME(6),
    PRIMARY KEY (id),
    CONSTRAINT fk_user_profiles_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE UNIQUE INDEX idx_user_profiles_user_id ON user_profiles(user_id);