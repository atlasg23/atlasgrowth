-- Add new tracking columns to template_views table
ALTER TABLE public.template_views 
ADD COLUMN IF NOT EXISTS session_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS is_unique BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS duration_seconds INTEGER,
ADD COLUMN IF NOT EXISTS interactions INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS left_at TIMESTAMP WITH TIME ZONE;

-- Create template_sends table for tracking SMS sends
CREATE TABLE IF NOT EXISTS public.template_sends (
    id SERIAL PRIMARY KEY,
    lead_id UUID REFERENCES public.leads(id),
    business_slug VARCHAR(255) NOT NULL,
    template_type VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    template_url TEXT NOT NULL,
    sms_message_id VARCHAR(255),
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_template_views_session_id ON public.template_views(session_id);
CREATE INDEX IF NOT EXISTS idx_template_views_is_unique ON public.template_views(is_unique);
CREATE INDEX IF NOT EXISTS idx_template_sends_lead_id ON public.template_sends(lead_id);
CREATE INDEX IF NOT EXISTS idx_template_sends_sent_at ON public.template_sends(sent_at DESC);

-- Create a view for analytics dashboard
CREATE OR REPLACE VIEW template_analytics AS
SELECT 
    tv.business_slug,
    tv.template_type,
    COUNT(DISTINCT tv.session_id) as unique_visitors,
    COUNT(*) as total_views,
    AVG(tv.duration_seconds) as avg_duration_seconds,
    SUM(tv.interactions) as total_interactions,
    MAX(tv.viewed_at) as last_viewed,
    COUNT(CASE WHEN tv.duration_seconds > 30 THEN 1 END) as engaged_views
FROM template_views tv
GROUP BY tv.business_slug, tv.template_type;