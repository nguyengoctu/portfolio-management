-- Add portfolio privacy setting to users table
ALTER TABLE users ADD COLUMN is_portfolio_public BOOLEAN DEFAULT TRUE;