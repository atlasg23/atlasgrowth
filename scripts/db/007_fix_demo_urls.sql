-- Fix demo URLs to use correct template name (plumbingtemplate instead of plumbing-template)
UPDATE biz 
SET demourl1 = REPLACE(demourl1, '/plumbing-template/', '/plumbingtemplate/')
WHERE niche = 'Plumber' 
AND demourl1 IS NOT NULL 
AND demourl1 LIKE '%/plumbing-template/%';