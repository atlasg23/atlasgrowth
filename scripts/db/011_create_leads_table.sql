-- Create comprehensive leads table for all business types
DROP TABLE IF EXISTS public.leads;

CREATE TABLE public.leads (
  id uuid primary key default gen_random_uuid(),
  
  -- Meta information
  business_type text not null, -- hvac, plumbing, roofing, etc.
  source_file text,            -- which file this came from
  import_date timestamptz default now(),
  
  -- Core business info (from outscraper schema)
  query text,
  name text not null,
  name_for_emails text,
  site text,
  subtypes text,
  category text,
  type text,
  
  -- Primary phone and enrichment
  phone text,
  phone_phones_enricher_carrier_type text,
  phone_phones_enricher_carrier_name text,
  phone_phones_enricher_avoid_saving_cache text,
  phone_whitepages_phones_address text,
  phone_whitepages_phones_lookup_type text,
  phone_whitepages_phones_name text,
  phone_whitepages_phones_person_id text,
  phone_whitepages_phones_fastbackgroundcheck text,
  phone_whitepages_phones_source_url text,
  phone_whitepages_phones_avoid_saving_cache text,
  phone_whitepages_phones_phone_type text,
  
  -- Address fields
  full_address text,
  borough text,
  street text,
  city text,
  postal_code text,
  state text,
  us_state text,
  country text,
  country_code text,
  latitude double precision,
  longitude double precision,
  h3 text,
  time_zone text,
  plus_code text,
  area_service boolean,
  
  -- Reviews and ratings
  rating text,
  reviews text,
  reviews_link text,
  reviews_tags text,
  reviews_per_score text,
  reviews_per_score_1 text,
  reviews_per_score_2 text,
  reviews_per_score_3 text,
  reviews_per_score_4 text,
  reviews_per_score_5 text,
  
  -- Photos and visuals
  photos_count text,
  photo text,
  street_view text,
  logo text,
  
  -- Business details
  located_in text,
  working_hours text,
  working_hours_csv_compatible text,
  working_hours_old_format text,
  other_hours text,
  popular_times text,
  business_status text,
  about jsonb,
  range text,
  prices text,
  posts text,
  description text,
  typical_time_spent text,
  verified text,
  
  -- Owner information
  owner_id text,
  owner_title text,
  owner_link text,
  
  -- Business links
  reservation_links text,
  booking_appointment_link text,
  menu_link text,
  order_links text,
  location_link text,
  location_reviews_link text,
  
  -- Google identifiers
  place_id text unique, -- Make this unique to prevent duplicates
  google_id text,
  cid bigint,
  kgmid text,
  reviews_id text,
  located_google_id text,
  
  -- Email contacts (3 sets)
  email_1 text,
  email_1_emails_validator_status text,
  email_1_emails_validator_status_details text,
  email_1_full_name text,
  email_1_first_name text,
  email_1_last_name text,
  email_1_title text,
  email_1_phone text,
  
  email_2 text,
  email_2_emails_validator_status text,
  email_2_emails_validator_status_details text,
  email_2_full_name text,
  email_2_first_name text,
  email_2_last_name text,
  email_2_title text,
  email_2_phone text,
  
  email_3 text,
  email_3_emails_validator_status text,
  email_3_emails_validator_status_details text,
  email_3_full_name text,
  email_3_first_name text,
  email_3_last_name text,
  email_3_title text,
  email_3_phone text,
  
  -- Additional phones
  phone_1 text,
  phone_1_phones_enricher_carrier_name text,
  phone_1_phones_enricher_carrier_type text,
  phone_1_whitepages_phones_address text,
  phone_1_whitepages_phones_lookup_type text,
  phone_1_whitepages_phones_name text,
  phone_1_whitepages_phones_person_id text,
  phone_1_whitepages_phones_fastbackgroundcheck text,
  phone_1_whitepages_phones_source_url text,
  phone_1_whitepages_phones_phone_type text,
  phone_1_whitepages_phones_avoid_saving_cache text,
  
  phone_2 text,
  phone_2_phones_enricher_carrier_name text,
  phone_2_phones_enricher_carrier_type text,
  phone_2_whitepages_phones_address text,
  phone_2_whitepages_phones_lookup_type text,
  phone_2_whitepages_phones_name text,
  phone_2_whitepages_phones_person_id text,
  phone_2_whitepages_phones_phone_type text,
  phone_2_whitepages_phones_source_url text,
  phone_2_whitepages_phones_avoid_saving_cache text,
  phone_2_whitepages_phones_fastbackgroundcheck text,
  
  phone_3 text,
  phone_3_phones_enricher_carrier_name text,
  phone_3_phones_enricher_carrier_type text,
  phone_3_whitepages_phones_address text,
  phone_3_whitepages_phones_lookup_type text,
  phone_3_whitepages_phones_name text,
  phone_3_whitepages_phones_person_id text,
  phone_3_whitepages_phones_fastbackgroundcheck text,
  phone_3_whitepages_phones_source_url text,
  phone_3_whitepages_phones_phone_type text,
  phone_3_whitepages_phones_avoid_saving_cache text,
  
  -- Social media
  facebook text,
  instagram text,
  linkedin text,
  tiktok text,
  medium text,
  reddit text,
  skype text,
  snapchat text,
  telegram text,
  whatsapp text,
  twitter text,
  vimeo text,
  youtube text,
  github text,
  crunchbase text,
  
  -- Website intelligence
  website_title text,
  website_generator text,
  website_description text,
  website_keywords text,
  website_has_fb_pixel text,
  website_has_google_tag text,
  
  -- Company insights
  company_insights_address text,
  company_insights_city text,
  company_insights_country text,
  company_insights_description text,
  company_insights_employees text,
  company_insights_founded_year text,
  company_insights_industry text,
  company_insights_is_public text,
  company_insights_linkedin_bio text,
  company_insights_linkedin_company_page text,
  company_insights_name text,
  company_insights_phone text,
  company_insights_revenue text,
  company_insights_state text,
  company_insights_timezone text,
  company_insights_zip text,
  company_insights_facebook_company_page text,
  company_insights_twitter_handle text,
  company_insights_total_money_raised text,
  
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Create indexes for performance
CREATE INDEX leads_business_type_idx ON leads (business_type);
CREATE INDEX leads_state_idx ON leads (state);
CREATE INDEX leads_city_state_idx ON leads (city, state);
CREATE INDEX leads_place_id_idx ON leads (place_id);
CREATE INDEX leads_import_date_idx ON leads (import_date);

-- Enable RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Allow anonymous read access for now
CREATE POLICY allow_anon_read_leads ON public.leads 
  FOR SELECT TO anon USING (true);

-- Allow authenticated users full access
CREATE POLICY allow_auth_all_leads ON public.leads 
  FOR ALL TO authenticated USING (true);

COMMENT ON TABLE public.leads IS 'Comprehensive business leads from Outscraper imports with full data enrichment';