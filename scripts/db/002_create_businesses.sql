-- Create businesses table with sample data
create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  niche text not null,
  template_key text not null,
  phone text,
  email1 text,
  email1_status text check (email1_status in ('valid','invalid','unknown') or email1_status is null),
  addr1 text,
  city text,
  state text,
  postal text,
  latitude double precision,
  longitude double precision,
  rating numeric(2,1),
  reviews integer,
  reviews_link text,
  logo text,
  logo_good boolean,
  facebook text,
  instagram text,
  primary_color text,
  secondary_color text,
  site text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS and allow anon SELECT
alter table public.businesses enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'allow_anon_read_businesses') then
    create policy allow_anon_read_businesses on public.businesses
    for select to anon using (true);
  end if;
end$$;

-- Insert mock business data
insert into public.businesses (slug, name, niche, template_key, phone, email1, email1_status, addr1, city, state, postal, latitude, longitude, rating, reviews, reviews_link, logo, logo_good, facebook, instagram, primary_color, secondary_color, site) values 
('mock-plumbing-pro', 'Mock Plumbing Pro', 'Plumbing', 'plumbing_t1', '+1234567890', 'info@mockplumbing.com', 'valid', '123 Main St', 'New Orleans', 'LA', '70115', 29.9511, -90.0715, 4.8, 156, 'https://maps.google.com/?q=Mock+Plumbing', 'https://via.placeholder.com/300x120?text=Mock+Plumbing', true, 'https://facebook.com/mockplumbing', 'https://instagram.com/mockplumbing', '#0EA5E9', '#F59E0B', 'https://mockplumbing.example'),
('test-hvac-solutions', 'Test HVAC Solutions', 'HVAC', 'hvac_t1', '+1987654321', 'contact@testhvac.com', 'valid', '456 Oak Ave', 'New Orleans', 'LA', '70130', 29.9434, -90.0684, 4.6, 89, 'https://maps.google.com/?q=Test+HVAC', 'https://via.placeholder.com/300x120?text=Test+HVAC', true, 'https://facebook.com/testhvac', 'https://instagram.com/testhvac', '#1E3A8A', '#10B981', 'https://testhvac.example')
on conflict (slug) do nothing;

-- Create helpful indexes
create index if not exists businesses_slug_idx on public.businesses (slug);
create index if not exists businesses_template_key_idx on public.businesses (template_key);
create index if not exists businesses_city_state_idx on public.businesses (city, state);