-- Create messages table for SMS conversation tracking
CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  message_id TEXT UNIQUE,
  phone_number TEXT,
  direction TEXT,
  body TEXT,
  status TEXT DEFAULT 'pending',
  business_name TEXT,
  demo_url TEXT,
  experiment_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX messages_phone_number_idx ON messages (phone_number);
CREATE INDEX messages_created_at_idx ON messages (created_at DESC);
CREATE INDEX messages_direction_idx ON messages (direction);
CREATE INDEX messages_status_idx ON messages (status);