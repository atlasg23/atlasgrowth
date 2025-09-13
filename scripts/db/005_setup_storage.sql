-- Create storage bucket for business assets (only if it doesn't exist)
INSERT INTO storage.buckets (id, name, public)
SELECT 'business-assets', 'business-assets', true
WHERE NOT EXISTS (
  SELECT 1 FROM storage.buckets WHERE id = 'business-assets'
);

-- Create policy to allow public reads (drop if exists first)
DROP POLICY IF EXISTS "Public read access" ON storage.objects;
CREATE POLICY "Public read access" ON storage.objects
FOR SELECT USING (bucket_id = 'business-assets');

-- Create policy to allow authenticated uploads (drop if exists first)
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
CREATE POLICY "Authenticated users can upload" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'business-assets');

-- Create policy to allow authenticated updates (drop if exists first)
DROP POLICY IF EXISTS "Authenticated users can update" ON storage.objects;
CREATE POLICY "Authenticated users can update" ON storage.objects
FOR UPDATE USING (bucket_id = 'business-assets');

-- Add business_assets table to track uploaded images (only if it doesn't exist)
CREATE TABLE IF NOT EXISTS business_assets (
  id SERIAL PRIMARY KEY,
  business_id TEXT REFERENCES biz(slug) ON DELETE CASCADE,
  asset_type VARCHAR(20) NOT NULL, -- 'logo', 'hero', 'about', etc.
  file_path TEXT NOT NULL,
  original_filename TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_business_assets_business_id ON business_assets(business_id);
CREATE INDEX IF NOT EXISTS idx_business_assets_type ON business_assets(asset_type);