import { Octokit } from "@octokit/rest";
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

// Simple token storage
const TOKEN_PATH = path.join(__dirname, '../../github-token.json');

// For Personal Access Token (simpler method)
export function createGitHubClient(token: string) {
  return new Octokit({ 
    auth: token 
  });
}

// Save token
function saveToken(token: string) {
  fs.writeFileSync(TOKEN_PATH, JSON.stringify({ token }, null, 2));
  console.log('✅ GitHub token saved!');
}

// Load token
function loadToken(): string | null {
  try {
    if (fs.existsSync(TOKEN_PATH)) {
      const data = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
      return data.token;
    }
    return null;
  } catch (error) {
    console.error('Error loading token:', error);
    return null;
  }
}

// ============ PERSONAL ACCESS TOKEN METHOD (EASIEST) ============

/**
 * Get GitHub client using Personal Access Token
 * This is simpler than OAuth for desktop apps
 */
export async function getGitHubClient() {
  // Check for saved token
  let token = loadToken();
  
  if (!token) {
    console.log('\n🔑 ========================================');
    console.log('🐙 MAYA ASSISTANT - GITHUB AUTHORIZATION');
    console.log('========================================\n');
    console.log('📌 You need a GitHub Personal Access Token');
    console.log('\n1️⃣ Go to: https://github.com/settings/tokens');
    console.log('2️⃣ Click "Generate new token (classic)"');
    console.log('3️⃣ Select scopes: repo, user');
    console.log('4️⃣ Generate and COPY the token');
    console.log('5️⃣ PASTE it here\n');
    console.log('========================================\n');
    
    // Get token from user
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    
    token = await new Promise<string>((resolve) => {
      rl.question('📝 Paste your GitHub token: ', (answer) => {
        rl.close();
        resolve(answer.trim());
      });
    });
    
    saveToken(token);
  }
  
  return createGitHubClient(token);
}

// ============ GITHUB OPERATIONS ============

/**
 * Get authenticated user info
 */
export async function getGitHubUser() {
  try {
    const octokit = await getGitHubClient();
    const { data: user } = await octokit.users.getAuthenticated();
    return user;
  } catch (error) {
    console.error('❌ Error getting user:', error);
    throw error;
  }
}

/**
 * List user repositories
 */
export async function listRepositories() {
  try {
    const octokit = await getGitHubClient();
    const { data: repos } = await octokit.repos.listForAuthenticatedUser({
      sort: 'updated',
      per_page: 10,
    });
    return repos;
  } catch (error) {
    console.error('❌ Error listing repos:', error);
    throw error;
  }
}

/**
 * Create an issue in a repository
 */
export async function createIssue(
  owner: string,
  repo: string,
  title: string,
  body: string
) {
  try {
    const octokit = await getGitHubClient();
    const { data: issue } = await octokit.issues.create({
      owner,
      repo,
      title,
      body,
    });
    console.log(`✅ Issue created: ${issue.html_url}`);
    return issue;
  } catch (error) {
    console.error('❌ Error creating issue:', error);
    throw error;
  }
}

/**
 * List issues from a repository
 */
export async function listIssues(owner: string, repo: string) {
  try {
    const octokit = await getGitHubClient();
    const { data: issues } = await octokit.issues.listForRepo({
      owner,
      repo,
      state: 'open',
      per_page: 10,
    });
    return issues;
  } catch (error) {
    console.error('❌ Error listing issues:', error);
    throw error;
  }
}

/**
 * Search repositories
 */
export async function searchRepositories(query: string) {
  try {
    const octokit = await getGitHubClient();
    const { data } = await octokit.search.repos({
      q: query,
      per_page: 10,
    });
    return data.items;
  } catch (error) {
    console.error('❌ Error searching repos:', error);
    throw error;
  }
}

/**
 * Create a gist
 */
export async function createGist(
  description: string,
  filename: string,
  content: string,
  isPublic: boolean = false
) {
  try {
    const octokit = await getGitHubClient();
    const { data: gist } = await octokit.gists.create({
      description,
      public: isPublic,
      files: {
        [filename]: {
          content,
        },
      },
    });
    console.log(`✅ Gist created: ${gist.html_url}`);
    return gist;
  } catch (error) {
    console.error('❌ Error creating gist:', error);
    throw error;
  }
}

/**
 * Get Repository Details
 */
export async function getRepoDetails(owner: string, repo: string) {
  try {
    const octokit = await getGitHubClient();
    const { data } = await octokit.repos.get({
      owner,
      repo,
    });
    return data;
  } catch (error) {
    console.error('❌ Error getting repo details:', error);
    throw error;
  }
}

