export interface Lead {
  id: string
  slug?: string // Database slug for URL routing
  
  // Meta information
  business_type: string
  source_file?: string
  import_date?: string
  
  // Core business info
  query?: string
  name: string
  name_for_emails?: string
  site?: string
  subtypes?: string
  category?: string
  type?: string
  
  // Phone and carrier info
  phone?: string
  phone_phones_enricher_carrier_type?: string
  phone_phones_enricher_carrier_name?: string
  phone_phones_enricher_avoid_saving_cache?: string
  phone_whitepages_phones_address?: string
  phone_whitepages_phones_lookup_type?: string
  phone_whitepages_phones_name?: string
  phone_whitepages_phones_person_id?: string
  phone_whitepages_phones_fastbackgroundcheck?: string
  phone_whitepages_phones_source_url?: string
  phone_whitepages_phones_avoid_saving_cache?: string
  phone_whitepages_phones_phone_type?: string
  
  // Address fields
  full_address?: string
  borough?: string
  street?: string
  city?: string
  postal_code?: string
  state?: string
  us_state?: string
  country?: string
  country_code?: string
  latitude?: number
  longitude?: number
  h3?: string
  time_zone?: string
  plus_code?: string
  area_service?: boolean
  
  // Reviews and ratings
  rating?: string
  reviews?: string
  reviews_link?: string
  reviews_tags?: string
  reviews_per_score?: string
  reviews_per_score_1?: string
  reviews_per_score_2?: string
  reviews_per_score_3?: string
  reviews_per_score_4?: string
  reviews_per_score_5?: string
  
  // Photos and visuals
  photos_count?: string
  photo?: string
  street_view?: string
  logo?: string
  
  // Business details
  located_in?: string
  working_hours?: string
  working_hours_csv_compatible?: string
  working_hours_old_format?: string
  other_hours?: string
  popular_times?: string
  business_status?: string
  about?: any
  range?: string
  prices?: string
  posts?: string
  description?: string
  typical_time_spent?: string
  verified?: string
  
  // Owner information
  owner_id?: string
  owner_title?: string
  owner_link?: string
  
  // Business links
  reservation_links?: string
  booking_appointment_link?: string
  menu_link?: string
  order_links?: string
  location_link?: string
  location_reviews_link?: string
  
  // Google identifiers
  place_id?: string
  google_id?: string
  cid?: number
  kgmid?: string
  reviews_id?: string
  located_google_id?: string
  
  // Email contacts
  email_1?: string
  email_1_emails_validator_status?: string
  email_1_emails_validator_status_details?: string
  email_1_full_name?: string
  email_1_first_name?: string
  email_1_last_name?: string
  email_1_title?: string
  email_1_phone?: string
  
  email_2?: string
  email_2_emails_validator_status?: string
  email_2_emails_validator_status_details?: string
  email_2_full_name?: string
  email_2_first_name?: string
  email_2_last_name?: string
  email_2_title?: string
  email_2_phone?: string
  
  email_3?: string
  email_3_emails_validator_status?: string
  email_3_emails_validator_status_details?: string
  email_3_full_name?: string
  email_3_first_name?: string
  email_3_last_name?: string
  email_3_title?: string
  email_3_phone?: string
  
  // Additional phones
  phone_1?: string
  phone_1_phones_enricher_carrier_name?: string
  phone_1_phones_enricher_carrier_type?: string
  phone_1_whitepages_phones_address?: string
  phone_1_whitepages_phones_lookup_type?: string
  phone_1_whitepages_phones_name?: string
  phone_1_whitepages_phones_person_id?: string
  phone_1_whitepages_phones_fastbackgroundcheck?: string
  phone_1_whitepages_phones_source_url?: string
  phone_1_whitepages_phones_phone_type?: string
  phone_1_whitepages_phones_avoid_saving_cache?: string
  
  phone_2?: string
  phone_2_phones_enricher_carrier_name?: string
  phone_2_phones_enricher_carrier_type?: string
  phone_2_whitepages_phones_address?: string
  phone_2_whitepages_phones_lookup_type?: string
  phone_2_whitepages_phones_name?: string
  phone_2_whitepages_phones_person_id?: string
  phone_2_whitepages_phones_phone_type?: string
  phone_2_whitepages_phones_source_url?: string
  phone_2_whitepages_phones_avoid_saving_cache?: string
  phone_2_whitepages_phones_fastbackgroundcheck?: string
  
  phone_3?: string
  phone_3_phones_enricher_carrier_name?: string
  phone_3_phones_enricher_carrier_type?: string
  phone_3_whitepages_phones_address?: string
  phone_3_whitepages_phones_lookup_type?: string
  phone_3_whitepages_phones_name?: string
  phone_3_whitepages_phones_person_id?: string
  phone_3_whitepages_phones_fastbackgroundcheck?: string
  phone_3_whitepages_phones_source_url?: string
  phone_3_whitepages_phones_phone_type?: string
  phone_3_whitepages_phones_avoid_saving_cache?: string
  
  // Social media
  facebook?: string
  instagram?: string
  linkedin?: string
  tiktok?: string
  medium?: string
  reddit?: string
  skype?: string
  snapchat?: string
  telegram?: string
  whatsapp?: string
  twitter?: string
  vimeo?: string
  youtube?: string
  github?: string
  crunchbase?: string
  
  // Website intelligence
  website_title?: string
  website_generator?: string
  website_description?: string
  website_keywords?: string
  website_has_fb_pixel?: string
  website_has_google_tag?: string
  
  // Company insights
  company_insights_address?: string
  company_insights_city?: string
  company_insights_country?: string
  company_insights_description?: string
  company_insights_employees?: string
  company_insights_founded_year?: string
  company_insights_industry?: string
  company_insights_is_public?: string
  company_insights_linkedin_bio?: string
  company_insights_linkedin_company_page?: string
  company_insights_name?: string
  company_insights_phone?: string
  company_insights_revenue?: string
  company_insights_state?: string
  company_insights_timezone?: string
  company_insights_zip?: string
  company_insights_facebook_company_page?: string
  company_insights_twitter_handle?: string
  company_insights_total_money_raised?: string
  
  created_at?: string
  updated_at?: string
}