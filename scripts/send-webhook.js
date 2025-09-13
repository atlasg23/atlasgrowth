const https = require('https');
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function sendWebhook() {
  const pool = new Pool({
    connectionString: process.env.SUPABASE_DB_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    // Get a sample plumber business
    const result = await pool.query(`
      SELECT name, phone, niche, demourl1, experimentid, slug
      FROM biz 
      WHERE niche = 'Plumber' 
      AND phone IS NOT NULL 
      AND demourl1 IS NOT NULL
      AND experimentid IS NOT NULL
      LIMIT 1
    `);

    if (result.rows.length === 0) {
      console.log('❌ No suitable business found for webhook');
      return;
    }

    const business = result.rows[0];
    
    // Prepare webhook payload (excluding niche as requested)
    const payload = {
      name: business.name,
      phone: business.phone,
      demoUrl: business.demourl1,
      experimentId: business.experimentid
    };

    console.log('📤 Sending webhook payload:');
    console.log(JSON.stringify(payload, null, 2));

    // Send webhook
    const webhookUrl = 'https://services.leadconnectorhq.com/hooks/R4NP0dhyOcoT5XRy1IOe/webhook-trigger/6c47723e-7646-4834-b68a-53aa19a6b701';
    
    const data = JSON.stringify(payload);
    
    const url = new URL(webhookUrl);
    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = https.request(options, (res) => {
      console.log(`📡 Webhook response status: ${res.statusCode}`);
      
      let responseData = '';
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        console.log('📥 Webhook response:', responseData);
        console.log('✅ Webhook sent successfully!');
      });
    });

    req.on('error', (error) => {
      console.error('❌ Webhook error:', error.message);
    });

    req.write(data);
    req.end();

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

sendWebhook();