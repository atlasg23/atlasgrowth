You’re hitting the exact wall: the **anon key / JS client can’t run DDL**. To let the agent “edit Supabase from the shell,” give it a **direct Postgres connection** (your project’s DB URL) and a tiny **migration runner** that executes `.sql` files. No `psql` binary needed; just Node + `pg`.

Below is a **minimal, pasteable Replit Agent prompt** that:

* Adds a **Node migration runner** (uses `SUPABASE_DB_URL`)
* Adds one **`biz` table** migration (idempotent + RLS for anon SELECT)
* Wires **npm scripts** to run migrations
* Commits & pushes

After this, the agent can change your schema anytime by adding/editing `.sql` files and running `npm run db:migrate`.

---

## Replit Agent Prompt — enable schema changes from repo (no psql)

**Goal:** Add a Node-based SQL runner that applies migrations to Supabase via `SUPABASE_DB_URL`. Create the initial `biz` table and RLS. Do not change app code.

### 0) Dependencies & scripts

1. Install `pg`:

```bash
npm i pg
```

2. Add scripts to `package.json` (merge if exists):

```json
{
  "scripts": {
    "db:migrate": "node scripts/db/run-sql.js",
    "db:check": "node scripts/db/run-sql.js --dry"
  }
}
```

### 1) Env & git hygiene

* If missing, create `.env.example`:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_DB_URL=postgresql://postgres:<DB_PASSWORD>@db.<ref>.supabase.co:5432/postgres?sslmode=require
```

* Ensure `.gitignore` contains:

```
.env
.env.*
.next/
node_modules/
```

### 2) Migration runner (Node, SSL)

Create `scripts/db/run-sql.js`:

```js
// Simple SQL runner: applies every .sql file in scripts/db in lexicographic order.
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const DRY = process.argv.includes('--dry');
const MIGRATIONS_DIR = path.join(__dirname);

(async () => {
  const dbUrl = process.env.SUPABASE_DB_URL;
  if (!dbUrl) {
    console.error('❌ SUPABASE_DB_URL not set. Add it in Replit Secrets.');
    process.exit(1);
  }

  const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false } // required by Supabase
  });

  const files = fs.readdirSync(MIGRATIONS_DIR)
    .filter(f => /^\d+_.*\.sql$/.test(f))
    .sort();

  if (files.length === 0) {
    console.log('No SQL migrations found.');
    process.exit(0);
  }

  console.log(`Found ${files.length} migration(s):\n- ${files.join('\n- ')}`);

  if (DRY) process.exit(0);

  await client.connect();

  try {
    // Create a simple migrations table to avoid reruns
    await client.query(`
      create table if not exists _migrations (
        filename text primary key,
        applied_at timestamptz default now()
      )
    `);

    for (const f of files) {
      const already = await client.query('select 1 from _migrations where filename = $1', [f]);
      if (already.rowCount) {
        console.log(`Skipping ${f} (already applied)`);
        continue;
      }
      const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, f), 'utf8');
      console.log(`Applying ${f}...`);
      await client.query('begin');
      await client.query(sql);
      await client.query('insert into _migrations(filename) values($1)', [f]);
      await client.query('commit');
      console.log(`✅ Applied ${f}`);
    }
  } catch (e) {
    await client.query('rollback').catch(()=>{});
    console.error('❌ Migration failed:', e.message);
    process.exit(1);
  } finally {
    await client.end();
  }
})();
```

### 3) Initial migration: `biz` table + RLS (idempotent)

Create `scripts/db/001_create_biz.sql`:

```sql
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
```

### 4) Run & push

If `SUPABASE_DB_URL` is set in Replit Secrets, run:

```bash
npm run db:check
npm run db:migrate
```

Then:

```bash
git add -A
git commit -m "chore(db): add Node SQL runner and initial biz migration"
git push
```

---

## What YOU need to set (one-time)

* **Replit Secrets** (or `.env.local` only for local dev):

  * `SUPABASE_DB_URL` → (Project Settings → Database → Connection string → **URI**).
    Format: `postgresql://postgres:<DB_PASSWORD>@db.<ref>.supabase.co:5432/postgres?sslmode=require`
  * `NEXT_PUBLIC_SUPABASE_URL` → your project URL
  * `NEXT_PUBLIC_SUPABASE_ANON_KEY` → your anon key

> ⚠️ Never commit `SUPABASE_DB_URL`. Keep it as a secret only.

---

## How this lets the agent “edit Supabase”

* The **Node runner** connects **directly to Postgres** with your DB URL (postgres user & password), so it can run **DDL** safely.
* The agent just adds/edits `scripts/db/*.sql` and runs `npm run db:migrate`.
* Your app continues to read with the **anon key** (RLS allows `SELECT`).

---

## Optional: Supabase CLI route (if you prefer)

If you want the official CLI flow instead of Node:

1. Add secrets: `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_REF`, `SUPABASE_DB_PASSWORD`, `SUPABASE_DB_URL`.
2. In repo:

```bash
npx supabase@latest link --project-ref $SUPABASE_PROJECT_REF
# put SQL into supabase/migrations/20250825_create_biz.sql
npx supabase@latest db push --db-url "$SUPABASE_DB_URL"
```

The Node runner is simpler on Replit (no extra binary). Your call.

---

When this is in, ping me and I’ll give you the **tiny diff** to switch your current CSV loader to **Supabase** (read-only `select`), leaving templates untouched.
