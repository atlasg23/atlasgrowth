import pg from 'pg'
import dotenv from 'dotenv'

const { Client } = pg
dotenv.config({ path: '.env.local' })

async function testDirectConnection() {
  // Use DATABASE_URL which we know exists
  const databaseUrl = process.env.DATABASE_URL || 'https://oyjezdyioyzijbnecvnh.supabase.co'
  const password = process.env.DATABASE_PASSWORD || 'glhQN5geT3GEkbmj'
  
  // Construct PostgreSQL connection string
  const connectionString = `postgresql://postgres:${password}@${databaseUrl.replace('https://', '')}/postgres`
  
  console.log('🔗 Connecting directly to PostgreSQL...')
  console.log('Host:', databaseUrl.replace('https://', ''))
  
  const client = new Client({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false } // Required for Supabase
  })
  
  try {
    await client.connect()
    console.log('✅ Connected successfully!')
    
    // Create test table
    console.log('📝 Creating test table...')
    await client.query(`
      CREATE TABLE IF NOT EXISTS test_table (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `)
    console.log('✅ Table created successfully!')
    
    // Insert test data
    console.log('📝 Inserting test data...')
    await client.query(`
      INSERT INTO test_table (name, description) VALUES 
      ('Claude Direct Test 1', 'Test entry created via direct PostgreSQL connection'),
      ('Claude Direct Test 2', 'Second test entry to verify direct DB access')
      ON CONFLICT (id) DO NOTHING
    `)
    console.log('✅ Test data inserted!')
    
    // Read test data
    console.log('📖 Reading test data...')
    const result = await client.query('SELECT * FROM test_table LIMIT 5')
    console.log('✅ Data retrieved successfully:')
    console.table(result.rows)
    
    console.log('🎉 Direct PostgreSQL connection test completed successfully!')
    
  } catch (error) {
    console.log('❌ Error:', error.message)
  } finally {
    await client.end()
  }
}

testDirectConnection().catch(console.error)