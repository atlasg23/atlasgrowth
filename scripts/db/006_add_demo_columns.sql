-- Add new columns to biz table for demo URLs and experiment tracking
ALTER TABLE biz 
ADD COLUMN IF NOT EXISTS DemoURL1 text,
ADD COLUMN IF NOT EXISTS owner text,
ADD COLUMN IF NOT EXISTS experimentId text;

-- Update plumber businesses with demo URLs, owner, and experiment ID
UPDATE biz 
SET 
    DemoURL1 = 'https://83184377-f57f-4089-96cc-5840efa2845d-00-1c4ru31dtek4m.kirk.replit.dev/plumbing-template/' || slug,
    owner = 'test',
    experimentId = 'PL-LA-001'
WHERE niche = 'Plumber' AND slug IS NOT NULL;

-- Create index for better query performance on new columns
CREATE INDEX IF NOT EXISTS biz_experimentId_idx ON biz (experimentId);
CREATE INDEX IF NOT EXISTS biz_owner_idx ON biz (owner);