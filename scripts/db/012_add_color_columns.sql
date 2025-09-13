-- Add primary_color and secondary_color columns to leads table
-- These will store hex color codes extracted from business logos

-- Add primary_color column (stores hex color like #1E40AF)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS primary_color VARCHAR(7);

-- Add secondary_color column (stores hex color like #F59E0B)  
ALTER TABLE leads ADD COLUMN IF NOT EXISTS secondary_color VARCHAR(7);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_leads_primary_color ON leads(primary_color);
CREATE INDEX IF NOT EXISTS idx_leads_secondary_color ON leads(secondary_color);

-- Add comments for documentation
COMMENT ON COLUMN leads.primary_color IS 'Primary brand color extracted from business logo (hex format)';
COMMENT ON COLUMN leads.secondary_color IS 'Secondary brand color extracted from business logo (hex format)';