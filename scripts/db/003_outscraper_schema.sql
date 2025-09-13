-- Raw keeper (lossless) for Outscraper data
create table if not exists os_raw (
  id uuid primary key default gen_random_uuid(),
  batch_id text not null,
  src_row jsonb not null,
  created_at timestamptz not null default now()
);

-- Drop existing businesses table to recreate with full Outscraper schema
drop table if exists public.businesses;

-- Create the full biz table for Outscraper data
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

-- Make place_id unique when present (multiple NULLs allowed)
create unique index if not exists biz_place_id_uidx on biz ((nullif(place_id, '')));

-- Indexes for performance
create index if not exists biz_slug_idx on biz (slug);
create index if not exists biz_city_state_idx on biz (city, state);
create index if not exists biz_niche_idx on biz (niche);
create index if not exists biz_phone_idx on biz (phone);
create index if not exists biz_rating_idx on biz (rating);

-- Enable RLS and allow anon SELECT
alter table public.biz enable row level security;
alter table public.os_raw enable row level security;

-- Policies for biz table
do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'allow_anon_read_biz') then
    create policy allow_anon_read_biz on public.biz
    for select to anon using (true);
  end if;
end$$;

-- Policies for os_raw table (admin only)
do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'allow_service_role_os_raw') then
    create policy allow_service_role_os_raw on public.os_raw
    for all to service_role using (true);
  end if;
end$$;

-- Updated trigger function
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists set_updated_at on public.biz;
create trigger set_updated_at before update on public.biz
for each row execute function public.set_updated_at();