-- First, let's see what we have before cleanup
SELECT 
  niche, 
  COUNT(*) as count 
FROM biz 
GROUP BY niche 
ORDER BY count DESC;

-- Show phone carrier types
SELECT 
  phone_carrier_type, 
  COUNT(*) as count 
FROM biz 
WHERE phone_carrier_type IS NOT NULL
GROUP BY phone_carrier_type 
ORDER BY count DESC;

-- Delete businesses that are NOT Plumber, Air conditioning contractor, or HVAC contractor
DELETE FROM biz 
WHERE niche NOT IN ('Plumber', 'Air conditioning contractor', 'HVAC contractor');

-- Delete businesses with fixed line or landline phone types (for remaining businesses)
DELETE FROM biz 
WHERE phone_carrier_type IN ('fixed line', 'landline');

-- Show final counts
SELECT 
  niche, 
  COUNT(*) as count 
FROM biz 
GROUP BY niche 
ORDER BY count DESC;