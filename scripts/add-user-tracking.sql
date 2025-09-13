-- Add user tracking column to call_logs table
ALTER TABLE public.call_logs 
ADD COLUMN IF NOT EXISTS user_name VARCHAR(50) DEFAULT 'unknown';

-- Add index for user_name
CREATE INDEX IF NOT EXISTS idx_call_logs_user_name ON public.call_logs(user_name);

-- Add comment
COMMENT ON COLUMN public.call_logs.user_name IS 'Name of admin user who made the call (nick or jackson)';