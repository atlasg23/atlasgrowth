# Database Migration System - WORKING SETUP ✅

**Status: COMPLETED** - The migration system is now fully functional and tested.

## How to Edit Database (For Next Agent)

The database migration system is **already set up and working**. To edit the Supabase database schema:

1. **Create new migration file** in `scripts/db/` with format: `00X_description.sql`
2. **Run migration**: `npm run db:migrate` 
3. **Test first**: `npm run db:check` (dry run)

### Example: Adding a new table
```bash
# Create scripts/db/003_add_new_table.sql
echo "create table if not exists new_table (id serial primary key, name text);" > scripts/db/003_add_new_table.sql

# Test migration (dry run)
npm run db:check

# Apply migration
npm run db:migrate
```

## Working Environment Variables

The `.env.local` file contains the correct configuration:
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Public API key for client
- `SUPABASE_SERVICE_ROLE_KEY` - Admin key for server operations
- `SUPABASE_DB_URL` - **CRITICAL**: Uses pooler connection string for Replit compatibility

## Key Success Factors

1. **Use PostgreSQL Pool, not Client** - Required for Replit environment
2. **Use pooler connection string** - Format: `postgresql://postgres.PROJECT:PASSWORD@aws-1-us-east-2.pooler.supabase.com:5432/postgres`
3. **Correct policy checks** - Use `policyname` not `polname` in pg_policies queries

## Existing Tables

- `test_table` - Simple test table with RLS
- `businesses` - Main business data with mock entries
- `_migrations` - Tracks applied migrations (auto-created)

## Database Connection Test

To verify database access:
```bash
node -e "const {createClient} = require('@supabase/supabase-js'); require('dotenv').config({path:'.env.local'}); const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY); supabase.from('businesses').select('name').then(({data}) => console.log('✅ Connected:', data?.length, 'businesses'));"
```

## Next Steps for Business Directory

1. **Migrate CSV data** - Import existing business data from `data/businesses.csv` to Supabase
2. **Update data loader** - Modify `lib/loadBiz.ts` to read from Supabase instead of CSV  
3. **Add Outscraper integration** - Create functions to import business data from Outscraper API
4. **Implement business management** - Add CRUD operations for managing business listings

## Migration System Files

- `scripts/db/run-sql.js` - Migration runner (uses Pool + pooler connection)
- `scripts/db/001_create_biz.sql` - Test table migration  
- `scripts/db/002_create_businesses.sql` - Business table with mock data
- `package.json` - Contains `db:migrate` and `db:check` scripts

**⚠️ IMPORTANT**: The system works because it uses the **pooler connection string**. Direct database connections (`db.PROJECT.supabase.co`) don't work in Replit - must use pooler (`aws-1-us-east-2.pooler.supabase.com`).
