-- Add portfolio views tracking table
CREATE TABLE portfolio_views (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    visitor_ip VARCHAR(45),
    user_agent TEXT,
    viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_viewed_at (viewed_at),
    INDEX idx_visitor_ip (visitor_ip)
);

-- Add view count column to users table
ALTER TABLE users ADD COLUMN portfolio_views BIGINT DEFAULT 0;