// import { google } from 'googleapis';
// import * as fs from 'fs';
// import * as path from 'path';
// import * as readline from 'readline';

// const CREDENTIALS_PATH = path.join(__dirname, '../../credentials.json');
// const TOKEN_PATH = path.join(__dirname, '../../token.json');

// // Load credentials from the json file you downloaded
// function loadCredentials() {
//   const content = fs.readFileSync(CREDENTIALS_PATH, 'utf8');
//   return JSON.parse(content);
// }

// // Get OAuth2 client
// function getOAuth2Client() {
//   const credentials = loadCredentials();
//   const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;

//   return new google.auth.OAuth2(
//     client_id,
//     client_secret,
//     redirect_uris[0]
//   );
// }

// // Get authorization URL
// function getAuthUrl() {
//   const oAuth2Client = getOAuth2Client();
//   return oAuth2Client.generateAuthUrl({
//     access_type: 'offline',
//     scope: ['https://www.googleapis.com/auth/gmail.readonly'],
//   });
// }

// // Save token for future use
// function saveToken(token: any) {
//   fs.writeFileSync(TOKEN_PATH, JSON.stringify(token, null, 2));
//   console.log('✅ Token saved! You won\'t need to authorize again.');
// }

// // Authorize and get Gmail client
// export async function authorizeGmail() {
//   const oAuth2Client = getOAuth2Client();

//   // Check if we already have a saved token
//   if (fs.existsSync(TOKEN_PATH)) {
//     const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
//     oAuth2Client.setCredentials(token);
//     return oAuth2Client;
//   }

//   // If no token, get new one
//   const authUrl = getAuthUrl();
//   console.log('\n🔑 Open this URL in your browser:');
//   console.log(authUrl);
//   console.log('\n📝 After authorizing, paste the code here:\n');

//   // Get code from user
//   const rl = readline.createInterface({
//     input: process.stdin,
//     output: process.stdout,
//   });

//   const code = await new Promise<string>((resolve) => {
//     rl.question('Enter the code: ', (answer) => {
//       rl.close();
//       resolve(answer);
//     });
//   });

//   // Exchange code for token
//   const { tokens } = await oAuth2Client.getToken(code);
//   oAuth2Client.setCredentials(tokens);
//   saveToken(tokens);

//   return oAuth2Client;
// }

// // Get Gmail client
// export async function getGmailClient() {
//   const auth = await authorizeGmail();
//   return google.gmail({ version: 'v1', auth });
// }

// // Read emails
// export async function readEmails(maxResults: number = 5) {
//   const gmail = await getGmailClient();
//   const response = await gmail.users.messages.list({
//     userId: 'me',
//     maxResults: maxResults,
//   });

//   if (!response.data.messages) return [];

//   const emails = await Promise.all(
//     response.data.messages.map(async (msg) => {
//       const message = await gmail.users.messages.get({
//         userId: 'me',
//         id: msg.id!,
//       });

//       const headers = message.data.payload?.headers || [];
//       const subject = headers.find(h => h.name === 'Subject')?.value || 'No Subject';
//       const from = headers.find(h => h.name === 'From')?.value || 'Unknown';

//       return {
//         id: message.data.id,
//         subject,
//         from,
//         snippet: message.data.snippet,
//       };
//     })
//   );

//   return emails;
// }



import { google } from 'googleapis';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

const CREDENTIALS_PATH = path.join(__dirname, '../../credentials.json');
const TOKEN_PATH = path.join(__dirname, '../../token.json');

// Load credentials
function loadCredentials() {
  const content = fs.readFileSync(CREDENTIALS_PATH, 'utf8');
  return JSON.parse(content);
}

// Get OAuth2 client
function getOAuth2Client() {
  const credentials = loadCredentials();
  const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;

  return new google.auth.OAuth2(
    client_id,
    client_secret,
    'urn:ietf:wg:oauth:2.0:oob' // This uses manual code entry instead of localhost
  );
}

// Get authorization URL
function getAuthUrl() {
  const oAuth2Client = getOAuth2Client();
  return oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/gmail.readonly'],
    // This forces manual code entry
    redirect_uri: 'urn:ietf:wg:oauth:2.0:oob',
  });
}

// Save token
function saveToken(token: any) {
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(token, null, 2));
  console.log('✅ Token saved successfully!');
}

// Authorize Gmail
export async function authorizeGmail() {
  const oAuth2Client = getOAuth2Client();

  // Check for saved token
  if (fs.existsSync(TOKEN_PATH)) {
    const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
    oAuth2Client.setCredentials(token);
    console.log('✅ Using saved token!');
    return oAuth2Client;
  }

  // Get new token
  const authUrl = getAuthUrl();
  console.log('\n🔑 ========================================');
  console.log('📧 MAYA ASSISTANT - GMAIL AUTHORIZATION');
  console.log('========================================\n');
  console.log('1️⃣ Open this URL in your browser:');
  console.log('\n' + authUrl + '\n');
  console.log('2️⃣ Sign in with your Google account');
  console.log('3️⃣ Click "Continue" to grant access');
  console.log('4️⃣ COPY the authorization code from the browser');
  console.log('5️⃣ PASTE it here when prompted\n');
  console.log('========================================\n');

  // Get code from user
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const code = await new Promise<string>((resolve) => {
    rl.question('📝 Paste the authorization code: ', (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });

  // Exchange code for tokens
  try {
    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);
    saveToken(tokens);
    console.log('\n✅ Authorization successful!');
    return oAuth2Client;
  } catch (error) {
    console.error('\n❌ Error getting token:', error);
    throw error;
  }
}

// Get Gmail client
export async function getGmailClient() {
  const auth = await authorizeGmail();
  return google.gmail({ version: 'v1', auth });
}

// Read emails
export async function readEmails(maxResults: number = 5) {
  try {
    const gmail = await getGmailClient();
    const response = await gmail.users.messages.list({
      userId: 'me',
      maxResults: maxResults,
    });

    if (!response.data.messages) {
      console.log('📭 No emails found');
      return [];
    }

    console.log(`📥 Found ${response.data.messages.length} emails, fetching details...`);

    const emails = await Promise.all(
      response.data.messages.map(async (msg) => {
        const message = await gmail.users.messages.get({
          userId: 'me',
          id: msg.id!,
        });

        const headers = message.data.payload?.headers || [];
        const subject = headers.find(h => h.name === 'Subject')?.value || 'No Subject';
        const from = headers.find(h => h.name === 'From')?.value || 'Unknown';
        const date = headers.find(h => h.name === 'Date')?.value || 'Unknown';

        return {
          id: message.data.id,
          subject,
          from,
          date,
          snippet: message.data.snippet || '',
        };
      })
    );

    return emails;
  } catch (error) {
    console.error('❌ Error reading emails:', error);
    throw error;
  }
}

// Search emails
export async function searchEmails(query: string, maxResults: number = 10) {
  try {
    const gmail = await getGmailClient();
    const response = await gmail.users.messages.list({
      userId: 'me',
      q: query,
      maxResults: maxResults,
    });

    if (!response.data.messages) {
      return [];
    }

    const emails = await Promise.all(
      response.data.messages.map(async (msg) => {
        const message = await gmail.users.messages.get({
          userId: 'me',
          id: msg.id!,
        });

        const headers = message.data.payload?.headers || [];
        return {
          id: message.data.id,
          subject: headers.find(h => h.name === 'Subject')?.value || 'No Subject',
          from: headers.find(h => h.name === 'From')?.value || 'Unknown',
          snippet: message.data.snippet || '',
        };
      })
    );

    return emails;
  } catch (error) {
    console.error('❌ Error searching emails:', error);
    throw error;
  }
}

// Send email
export async function sendEmail(to: string, subject: string, body: string) {
  try {
    const gmail = await getGmailClient();

    const emailContent = [
      'Content-Type: text/plain; charset="UTF-8"\n',
      'MIME-Version: 1.0\n',
      'Content-Transfer-Encoding: 7bit\n',
      `To: ${to}\n`,
      `Subject: ${subject}\n\n`,
      body
    ].join('');

    const encodedEmail = Buffer.from(emailContent)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const response = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedEmail,
      },
    });

    console.log('✅ Email sent successfully!');
    return response.data;
  } catch (error) {
    console.error('❌ Error sending email:', error);
    throw error;
  }
}
