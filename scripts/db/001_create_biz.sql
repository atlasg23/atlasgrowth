-- Simple test table creation
create table if not exists public.test_table (
  id serial primary key,
  name text not null,
  created_at timestamptz default now()
);

-- Allow public read access
alter table public.test_table enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where polname = 'allow_anon_read_test') then
    create policy allow_anon_read_test on public.test_table
    for select to anon using (true);
  end if;
end$$;