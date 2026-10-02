-- ============================================
-- V6__create_system_settings_table.sql
-- ============================================

-- Drop table if exists
DROP TABLE IF EXISTS `system_settings`;

-- Create table
CREATE TABLE `system_settings` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `setting_key` VARCHAR(100) NOT NULL UNIQUE,
    `setting_value` TEXT,
    `description` VARCHAR(500),
    `is_editable` BOOLEAN DEFAULT TRUE,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `updated_by` VARCHAR(100),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default settings
INSERT INTO `system_settings` (
    `setting_key`, 
    `setting_value`, 
    `description`, 
    `is_editable`, 
    `updated_by`
) VALUES (
    'platform_settings',
    '{"appName":"CarbonTrack","appDescription":"Track your carbon footprint. Make a difference.","emailNotifications":"true","userRegistration":"true","defaultRole":"USER","carbonGoalEnabled":"true","leaderboardEnabled":"true","badgesEnabled":"true","allowSocialLogin":"true","maintenanceMode":"false","theme":"light"}',
    'Platform-wide system settings stored as JSON',
    TRUE,
    'system'
);

-- Verify
SELECT * FROM system_settings;