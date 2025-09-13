require('dotenv').config({ path: '.env.local' });

const accountSid = process.env.TEXTGRID_ACCOUNT_SID;
const authToken = process.env.TEXTGRID_AUTH_TOKEN;
const fromPhone = process.env.TEXTGRID_PHONE_1;
const toPhone = '205-500-5170'; // The number you requested
const myPhone = process.env.MY_PHONE_NUMBER;

const message = 'Hello! This is Claude Code 🤖 - Your Supabase database migration system is working perfectly! Migration system successfully created tables, connected via pooler, and ready for business data import. 🚀';

// TextGrid API call using the correct format from your working project
async function sendSMS() {
  try {
    console.log(`📱 Sending SMS to ${toPhone} from ${fromPhone}...`);
    console.log(`🔑 Using Account SID: ${accountSid}`);
    
    // Use the correct TextGrid API format: Twilio-compatible endpoint
    const response = await fetch(`https://api2.textgrid.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        From: fromPhone,
        To: toPhone,
        Body: message,
      }),
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ SMS sent successfully!');
      console.log('Message SID:', result.sid);
      console.log('Status:', result.status);
    } else {
      const errorText = await response.text();
      console.log('❌ SMS failed:', response.status, response.statusText);
      console.log('Error details:', errorText);
    }
    
  } catch (error) {
    console.log('❌ Error sending SMS:', error.message);
  }
}

sendSMS();