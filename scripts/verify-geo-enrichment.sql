-- =======================================
-- GEO ENRICHMENT VERIFICATION QUERIES
-- =======================================

-- 1. COUNT SUMMARY: Businesses with/without coordinates
SELECT 
  'With Coordinates' as status,
  COUNT(*) as count
FROM leads 
WHERE latitude IS NOT NULL AND longitude IS NOT NULL
UNION ALL
SELECT 
  'Missing Coordinates' as status,
  COUNT(*) as count
FROM leads 
WHERE latitude IS NULL OR longitude IS NULL
UNION ALL  
SELECT 
  'Total Businesses' as status,
  COUNT(*) as count
FROM leads;

-- 2. RECENT UPDATES: Businesses recently geo-enriched (last hour)
SELECT 
  name,
  city,
  state,
  latitude,
  longitude,
  updated_at
FROM leads 
WHERE updated_at > NOW() - INTERVAL '1 hour'
  AND latitude IS NOT NULL 
  AND longitude IS NOT NULL
ORDER BY updated_at DESC
LIMIT 20;

-- 3. GEOGRAPHIC DISTRIBUTION: Count by state
SELECT 
  state,
  COUNT(*) as business_count,
  COUNT(CASE WHEN latitude IS NOT NULL THEN 1 END) as with_coordinates,
  ROUND(
    COUNT(CASE WHEN latitude IS NOT NULL THEN 1 END) * 100.0 / COUNT(*), 
    1
  ) as percent_enriched
FROM leads 
WHERE state IS NOT NULL
GROUP BY state
ORDER BY business_count DESC
LIMIT 15;

-- 4. COORDINATE QUALITY CHECK: Look for invalid coordinates
SELECT 
  'Invalid Latitude (outside -90 to 90)' as issue,
  COUNT(*) as count
FROM leads 
WHERE latitude < -90 OR latitude > 90
UNION ALL
SELECT 
  'Invalid Longitude (outside -180 to 180)' as issue,
  COUNT(*) as count
FROM leads 
WHERE longitude < -180 OR longitude > 180
UNION ALL
SELECT 
  'Zero Coordinates (0,0)' as issue,
  COUNT(*) as count
FROM leads 
WHERE latitude = 0 AND longitude = 0;

-- 5. SAMPLE ENRICHED BUSINESSES: Show some results
SELECT 
  name,
  city,
  state,
  latitude,
  longitude,
  CASE 
    WHEN updated_at > NOW() - INTERVAL '1 hour' THEN '🆕 Just Updated'
    ELSE '✅ Has Coordinates'
  END as status
FROM leads 
WHERE latitude IS NOT NULL AND longitude IS NOT NULL
ORDER BY updated_at DESC
LIMIT 10;

-- 6. STILL MISSING COORDINATES: Businesses that need enrichment
SELECT 
  name,
  city,
  state,
  country
FROM leads 
WHERE (latitude IS NULL OR longitude IS NULL)
  AND name IS NOT NULL
ORDER BY name
LIMIT 10;