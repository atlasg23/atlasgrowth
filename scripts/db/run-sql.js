// Simple SQL runner: applies every .sql file in scripts/db in lexicographic order.
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '../../.env.local') });

const DRY = process.argv.includes('--dry');
const MIGRATIONS_DIR = path.join(__dirname);

(async () => {
  const dbUrl = process.env.SUPABASE_DB_URL;
  if (!dbUrl) {
    console.error('❌ SUPABASE_DB_URL not found in .env.local file.');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false }
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

  try {
    // Create a simple migrations table to avoid reruns
    await pool.query(`
      create table if not exists _migrations (
        filename text primary key,
        applied_at timestamptz default now()
      )
    `);

    for (const f of files) {
      const already = await pool.query('select 1 from _migrations where filename = $1', [f]);
      if (already.rowCount) {
        console.log(`Skipping ${f} (already applied)`);
        continue;
      }
      const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, f), 'utf8');
      console.log(`Applying ${f}...`);
      
      // Use a transaction
      const client = await pool.connect();
      try {
        await client.query('begin');
        await client.query(sql);
        await client.query('insert into _migrations(filename) values($1)', [f]);
        await client.query('commit');
        console.log(`✅ Applied ${f}`);
      } catch (e) {
        await client.query('rollback');
        throw e;
      } finally {
        client.release();
      }
    }
  } catch (e) {
    console.error('❌ Migration failed:', e.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
})();