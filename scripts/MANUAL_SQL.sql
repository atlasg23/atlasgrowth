-- Run this SQL in your Supabase SQL Editor
-- This adds the color columns to the leads table

ALTER TABLE leads ADD COLUMN IF NOT EXISTS primary_color VARCHAR(7);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS secondary_color VARCHAR(7);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_leads_primary_color ON leads(primary_color);
CREATE INDEX IF NOT EXISTS idx_leads_secondary_color ON leads(secondary_color);

-- Add comments for documentation
COMMENT ON COLUMN leads.primary_color IS 'Primary brand color extracted from business logo (hex format)';
COMMENT ON COLUMN leads.secondary_color IS 'Secondary brand color extracted from business logo (hex format)';