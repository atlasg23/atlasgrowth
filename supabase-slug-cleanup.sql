-- SQL to clean up slugs in Supabase
-- Run this in your Supabase SQL Editor

-- Create function to generate clean slugs
CREATE OR REPLACE FUNCTION generate_clean_slug(business_name TEXT)
RETURNS TEXT AS $$
BEGIN
  -- Convert business name to clean slug
  RETURN LOWER(
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        REGEXP_REPLACE(business_name, '[^a-zA-Z0-9\s-]', '', 'g'), -- Remove special chars
        '\s+', '-', 'g'  -- Replace spaces with dashes
      ),
      '-+', '-', 'g'  -- Replace multiple dashes with single
    )
  );
END;
$$ LANGUAGE plpgsql;

-- Update slugs for all leads, removing ID suffixes
UPDATE public.leads 
SET slug = generate_clean_slug(name)
WHERE slug IS NULL 
   OR slug = ''
   OR slug ~ '_\d+$'  -- Has ID suffix like _1234
   OR slug ~ '^_\d+$' -- Is just an ID like _1234
   OR slug NOT SIMILAR TO '[a-z0-9-]+'; -- Contains invalid characters

-- Handle duplicates by adding numbers
WITH duplicate_slugs AS (
  SELECT slug, COUNT(*) as count
  FROM public.leads
  WHERE slug IS NOT NULL
  GROUP BY slug
  HAVING COUNT(*) > 1
),
ranked_duplicates AS (
  SELECT 
    l.id,
    l.name,
    l.slug,
    ROW_NUMBER() OVER (PARTITION BY l.slug ORDER BY l.id) as rn
  FROM public.leads l
  INNER JOIN duplicate_slugs d ON l.slug = d.slug
)
UPDATE public.leads 
SET slug = CONCAT(generate_clean_slug(leads.name), '-', rd.rn)
FROM ranked_duplicates rd
WHERE leads.id = rd.id 
  AND rd.rn > 1;

-- Clean up the function
DROP FUNCTION generate_clean_slug(TEXT);

-- Create index on slug for better performance
CREATE INDEX IF NOT EXISTS idx_leads_slug ON public.leads(slug);

-- Show results
SELECT 
  'Total leads' as metric,
  COUNT(*) as count
FROM public.leads
UNION ALL
SELECT 
  'With clean slugs' as metric,
  COUNT(*) as count
FROM public.leads 
WHERE slug IS NOT NULL AND slug ~ '^[a-z0-9-]+$'
UNION ALL
SELECT 
  'Still messy slugs' as metric,
  COUNT(*) as count
FROM public.leads 
WHERE slug IS NULL OR slug = '' OR slug !~ '^[a-z0-9-]+$';

-- Show sample of clean slugs
SELECT name, slug
FROM public.leads 
WHERE slug IS NOT NULL 
  AND slug ~ '^[a-z0-9-]+$'
ORDER BY name
LIMIT 10;