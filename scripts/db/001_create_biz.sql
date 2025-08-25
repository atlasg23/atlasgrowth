-- Extensions (idempotent)
create extension if not exists pgcrypto;

-- Table (idempotent via IF NOT EXISTS)
create table if not exists public.biz (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  niche text not null,
  slug text not null unique,
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

-- updated_at trigger (recreate safely)
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists set_updated_at on public.biz;
create trigger set_updated_at before update on public.biz
for each row execute function public.set_updated_at();

-- RLS: enable and allow anon SELECT
alter table public.biz enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where polname = 'allow_anon_read_biz') then
    create policy allow_anon_read_biz on public.biz
    for select to anon using (true);
  end if;
end$$;

-- Helpful indexes
create index if not exists biz_niche_idx on public.biz (niche);
create index if not exists biz_city_state_idx on public.biz (city, state);