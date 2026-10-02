-- Drop existing goals table if it has old structure
-- WARNING: This will delete all existing goal data
DROP TABLE IF EXISTS goals;

-- Create goals table with new structure
CREATE TABLE goals (
    id BIGINT NOT NULL AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    goal_name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    target_co2 DECIMAL(14,4) NOT NULL,
    current_co2 DECIMAL(14,4) DEFAULT 0,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'NOT_STARTED',
    progress_percentage DECIMAL(5,2) DEFAULT 0,
    created_at DATETIME(6),
    updated_at DATETIME(6),
    PRIMARY KEY (id),
    CONSTRAINT fk_goals_user FOREIGN KEY (user_id) REFERENCES users(id)
);