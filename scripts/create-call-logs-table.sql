-- Create call_logs table for tracking calls to business leads
CREATE TABLE IF NOT EXISTS public.call_logs (
    id SERIAL PRIMARY KEY,
    business_id VARCHAR(255) NOT NULL,
    call_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    outcome VARCHAR(50) NOT NULL,
    owner_name VARCHAR(255),
    owner_email VARCHAR(255),
    owner_phone VARCHAR(50),
    notes TEXT,
    template_sent BOOLEAN DEFAULT FALSE,
    template_sent_date TIMESTAMP WITH TIME ZONE,
    template_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_call_logs_business_id ON public.call_logs(business_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_call_date ON public.call_logs(call_date DESC);
CREATE INDEX IF NOT EXISTS idx_call_logs_outcome ON public.call_logs(outcome);

-- Add foreign key constraint (assuming business_id references leads table)
-- ALTER TABLE public.call_logs 
-- ADD CONSTRAINT fk_call_logs_business_id 
-- FOREIGN KEY (business_id) REFERENCES public.leads(id) ON DELETE CASCADE;

-- Enable Row Level Security (RLS) if needed
-- ALTER TABLE public.call_logs ENABLE ROW LEVEL SECURITY;

-- Add RLS policy to allow authenticated users to access all records
-- CREATE POLICY "Enable all access for authenticated users" ON public.call_logs
-- FOR ALL USING (auth.role() = 'authenticated');

COMMENT ON TABLE public.call_logs IS 'Stores call log information for business leads';
COMMENT ON COLUMN public.call_logs.business_id IS 'References the leads table ID';
COMMENT ON COLUMN public.call_logs.outcome IS 'Call outcome: No Answer, Answered, Interested, Not Interested, Call Back Later';
COMMENT ON COLUMN public.call_logs.template_sent IS 'Whether template was sent to this contact';