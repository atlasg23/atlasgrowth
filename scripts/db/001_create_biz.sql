-- Create the biz table that your app expects
create table if not exists public.biz (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  niche text,
  phone text,
  email1 text,
  email1_status text check (email1_status in ('valid','invalid','unknown')),
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

-- Enable RLS and allow public read access
alter table public.biz enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where polname = 'allow_anon_read_biz') then
    create policy allow_anon_read_biz on public.biz
    for select to anon using (true);
  end if;
end$$;

-- Insert sample data for testing
insert into public.biz (slug, name, niche, phone, email1, email1_status, addr1, city, state, postal, rating, reviews, reviews_link) 
values 
  ('demo-plumbing', 'Demo Plumbing Co', 'Plumbing', '(555) 123-4567', 'info@demoplumbing.com', 'valid', '123 Main St', 'New Orleans', 'LA', '70115', 4.8, 127, 'https://google.com/maps'),
  ('demo-hvac', 'Demo HVAC Services', 'HVAC', '(555) 987-6543', 'contact@demohvac.com', 'valid', '456 Oak Ave', 'New Orleans', 'LA', '70130', 4.6, 89, 'https://google.com/maps')
on conflict (slug) do nothing;