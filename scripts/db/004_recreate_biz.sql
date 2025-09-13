-- Recreate biz table after deletion
create table if not exists biz (
  id uuid primary key default gen_random_uuid(),

  -- Core + routing
  name                           text not null,
  niche                          text,
  slug                           text unique,

  -- Website / category
  site                           text,
  category                       text,

  -- Phone
  phone                          text,
  phone_carrier_type             text,

  -- Address
  addr1                          text,
  city                           text,
  state                          text,
  postal                         text,
  country                        text,
  latitude                       double precision,
  longitude                      double precision,

  -- Reputation / footprint
  rating                         numeric,
  reviews                        int,
  reviews_link                   text,
  photos_count                   int,
  working_hours                  jsonb,

  -- Profile
  about                          text,
  logo                           text,
  description                    text,
  verified                       boolean,
  booking_appointment_link       text,
  place_id                       text,

  -- Email 1
  email1                         text,
  email1_status                  text,
  email1_status_details          text,
  email1_first_name              text,
  email1_last_name               text,
  email1_title                   text,

  -- Email 2
  email2                         text,
  email2_status                  text,
  email2_status_details          text,
  email2_first_name              text,
  email2_last_name               text,
  email2_title                   text,

  -- Email 3
  email3                         text,
  email3_status                  text,
  email3_status_details          text,
  email3_first_name              text,
  email3_last_name               text,
  email3_title                   text,

  -- Socials
  facebook                       text,
  instagram                      text,
  linkedin                       text,
  tiktok                         text,

  -- Website meta
  website_generator              text,
  website_description            text,
  website_has_facebook_pixel     boolean,
  website_has_google_pixel       boolean,

  -- Simple tags
  tag_no_site                    boolean,
  tag_has_mobile_phone           boolean,

  created_at                     timestamptz not null default now(),
  updated_at                     timestamptz not null default now()
);

-- Indexes
create unique index if not exists biz_place_id_uidx on biz ((nullif(place_id, '')));
create index if not exists biz_slug_idx on biz (slug);
create index if not exists biz_city_state_idx on biz (city, state);
create index if not exists biz_niche_idx on biz (niche);

-- RLS
alter table public.biz enable row level security;
create policy allow_anon_read_biz on public.biz for select to anon using (true);