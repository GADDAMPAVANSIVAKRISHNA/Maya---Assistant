// import { readEmails } from './services/gmailService';

// async function testGmail() {
//   console.log('📧 Testing Gmail Integration...\n');

//   try {
//     const emails = await readEmails(5);
//     console.log(`✅ Found ${emails.length} emails:\n`);

//     emails.forEach((email, i) => {
//       console.log(`${i + 1}. From: ${email.from}`);
//       console.log(`   Subject: ${email.subject}`);
//       console.log(`   Preview: ${email.snippet}\n`);
//     });

//   } catch (error) {
//     console.error('❌ Error:', error);
//   }
// }

// testGmail();


import { readEmails } from './services/gmailService';

async function testGmail() {
  console.log('\n📧 ===== MAYA ASSISTANT GMAIL TEST =====\n');

  try {
    console.log('🔄 Reading your emails...\n');
    const emails = await readEmails(5);

    if (emails.length === 0) {
      console.log('📭 No emails found in your inbox.');
      return;
    }

    console.log(`✅ Found ${emails.length} recent emails:\n`);
    console.log('━'.repeat(60));

    emails.forEach((email, i) => {
      console.log(`\n📨 Email ${i + 1}:`);
      console.log(`   📤 From: ${email.from}`);
      console.log(`   📝 Subject: ${email.subject}`);
      console.log(`   📅 Date: ${email.date || 'Unknown'}`);
      console.log(`   💬 Preview: ${email.snippet || 'No preview'}`);
    });

    console.log('\n' + '━'.repeat(60));
    console.log('\n✅ Gmail integration is working!\n');

  } catch (error: any) {
    console.error('\n❌ Error:', error.message || error);
    console.log('\n💡 Tips:');
    console.log('   1. Make sure you added your email as a test user');
    console.log('   2. Copy the ENTIRE authorization code');
    console.log('   3. Make sure credentials.json is in the project root\n');
  }
}

// Run the test
testGmail();