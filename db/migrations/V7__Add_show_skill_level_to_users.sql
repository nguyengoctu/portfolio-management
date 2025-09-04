-- Add show_skill_level column to users table
ALTER TABLE users ADD COLUMN show_skill_level BOOLEAN DEFAULT TRUE;

-- Update existing users to show skill levels by default
UPDATE users SET show_skill_level = TRUE WHERE show_skill_level IS NULL;