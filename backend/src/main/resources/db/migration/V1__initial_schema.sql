-- ============================================================
-- DATABASE SCHEMA - CARBON FOOTPRINT TRACKER
-- ============================================================

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    provider VARCHAR(20) DEFAULT 'LOCAL',
    provider_id VARCHAR(100),
    enabled BOOLEAN DEFAULT TRUE,
    role VARCHAR(20) DEFAULT 'USER',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. USER_PREFERENCES TABLE
CREATE TABLE IF NOT EXISTS user_preferences (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL UNIQUE,
    preferred_units VARCHAR(20) DEFAULT 'METRIC',
    diet_type VARCHAR(50),
    primary_transport_mode VARCHAR(50),
    energy_source VARCHAR(50),
    reduction_target_percent DECIMAL(5,2),
    notifications_enabled BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. EMISSION_FACTORS TABLE
CREATE TABLE IF NOT EXISTS emission_factors (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    category VARCHAR(50) NOT NULL,
    activity_type VARCHAR(60) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    factor_kg_co2e_per_unit DECIMAL(12,6) NOT NULL,
    source VARCHAR(20) NOT NULL,
    effective_date DATE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 4. ACTIVITY_LOGS TABLE
CREATE TABLE IF NOT EXISTS activity_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    category VARCHAR(50) NOT NULL,
    activity_type VARCHAR(60) NOT NULL,
    quantity DECIMAL(14,4) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    log_date DATE NOT NULL,
    co2e_kg DECIMAL(14,4) NOT NULL,
    notes VARCHAR(500),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 5. GOALS TABLE
CREATE TABLE IF NOT EXISTS goals (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    target_reduction_percent DECIMAL(5,2) NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    baseline_footprint DECIMAL(14,4) NOT NULL,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 6. BADGES TABLE
CREATE TABLE IF NOT EXISTS badges (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    badge_type VARCHAR(50) NOT NULL,
    earned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 7. PASSWORD_RESET_TOKENS TABLE
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    token VARCHAR(255) NOT NULL UNIQUE,
    user_id BIGINT NOT NULL,
    expiry_date DATETIME NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
-- SAMPLE EMISSION FACTORS (IPCC/EPA)
-- ============================================================

INSERT IGNORE INTO emission_factors (category, activity_type, unit, factor_kg_co2e_per_unit, source, effective_date) VALUES
('TRANSPORT', 'CAR', 'km', 0.171, 'IPCC', '2024-01-01'),
('TRANSPORT', 'FLIGHT', 'km', 0.285, 'IPCC', '2024-01-01'),
('TRANSPORT', 'PUBLIC_TRANSIT', 'km', 0.042, 'IPCC', '2024-01-01'),
('ELECTRICITY', 'GRID', 'kWh', 0.475, 'EPA', '2024-01-01'),
('ELECTRICITY', 'SOLAR', 'kWh', 0.041, 'EPA', '2024-01-01'),
('FOOD', 'BEEF', 'serving', 6.61, 'IPCC', '2024-01-01'),
('FOOD', 'CHICKEN', 'serving', 2.10, 'IPCC', '2024-01-01'),
('FOOD', 'VEGETARIAN', 'serving', 0.57, 'IPCC', '2024-01-01'),
('SHOPPING', 'CLOTHING', 'USD', 0.012, 'EPA', '2024-01-01'),
('SHOPPING', 'ELECTRONICS', 'USD', 0.015, 'EPA', '2024-01-01');