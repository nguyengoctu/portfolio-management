-- Add OAuth fields to users table
ALTER TABLE users 
ADD COLUMN provider VARCHAR(50) DEFAULT 'local',
ADD COLUMN provider_id VARCHAR(255),
ADD COLUMN avatar_url VARCHAR(500);

-- Make password nullable for OAuth users
ALTER TABLE users 
MODIFY password VARCHAR(255) NULL;

-- Add unique constraint for provider and provider_id combination
ALTER TABLE users 
ADD UNIQUE KEY unique_provider_user (provider, provider_id);