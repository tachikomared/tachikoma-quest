-- Add missing columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS fc_pfp_url TEXT,
ADD COLUMN IF NOT EXISTS fc_bio TEXT,
ADD COLUMN IF NOT EXISTS fc_followers INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS fc_following INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS fc_power_badge BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW();

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
