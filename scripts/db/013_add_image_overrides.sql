-- Add image_overrides column to leads table for custom images
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS image_overrides JSONB;

-- Add primary_color and secondary_color columns for theme customization
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS primary_color VARCHAR(7),
ADD COLUMN IF NOT EXISTS secondary_color VARCHAR(7);

-- Create index on image_overrides for better query performance
CREATE INDEX IF NOT EXISTS idx_leads_image_overrides ON leads USING gin(image_overrides);

-- Add comment explaining the structure
COMMENT ON COLUMN leads.image_overrides IS 'JSON object storing custom image URLs: {logo: string, hero: string, about: string}';
COMMENT ON COLUMN leads.primary_color IS 'Primary brand color in hex format (#RRGGBB)';
COMMENT ON COLUMN leads.secondary_color IS 'Secondary brand color in hex format (#RRGGBB)';