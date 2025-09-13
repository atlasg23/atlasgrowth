CREATE TABLE IF NOT EXISTS google_reviews (
  id SERIAL PRIMARY KEY,
  place_id VARCHAR(255) NOT NULL,
  review_text TEXT,
  reviewer_name VARCHAR(255),
  review_date TIMESTAMP,
  stars INTEGER,
  reviewer_number_of_reviews INTEGER,
  is_local_guide BOOLEAN DEFAULT FALSE,
  likes_count INTEGER DEFAULT 0,
  response_from_owner_text TEXT,
  response_from_owner_date TIMESTAMP,
  review_context JSONB,
  scraped_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- Create unique constraint for deduplication
  UNIQUE(place_id, review_text, review_date)
);

-- Add index for faster queries by place_id
CREATE INDEX IF NOT EXISTS idx_google_reviews_place_id ON google_reviews(place_id);
CREATE INDEX IF NOT EXISTS idx_google_reviews_date ON google_reviews(review_date DESC);