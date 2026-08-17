import {
  getGitHubUser,
  listRepositories,
  createIssue,
  listIssues,
  searchRepositories,
  createGist,
  getRepoDetails
} from './services/githubService';

async function testGitHub() {
  console.log('\n🐙 ===== MAYA ASSISTANT GITHUB TEST =====\n');
  
  try {
    // 1. Get user info
    console.log('👤 Getting user info...');
    const user = await getGitHubUser();
    console.log(`✅ Logged in as: ${user.login} (${user.name || 'No name'})\n`);
    
    // 2. List repositories
    console.log('📂 Fetching your repositories...');
    const repos = await listRepositories();
    console.log(`✅ Found ${repos.length} recent repositories:\n`);
    
    repos.forEach((repo, i) => {
      console.log(`${i + 1}. ${repo.name}`);
      console.log(`   📝 ${repo.description || 'No description'}`);
      console.log(`   ⭐ ${repo.stargazers_count} stars | 🍴 ${repo.forks_count} forks`);
      console.log(`   🔗 ${repo.html_url}\n`);
    });
    
    // 3. Search for repositories
    console.log('🔍 Searching for "electron" repositories...');
    const searchResults = await searchRepositories('electron');
    console.log(`✅ Found ${searchResults.length} results:\n`);
    
    searchResults.slice(0, 3).forEach((repo: any) => {
      console.log(`   📦 ${repo.full_name}`);
      console.log(`   ⭐ ${repo.stargazers_count} stars`);
      console.log(`   🔗 ${repo.html_url}\n`);
    });

    // 4. Create an Issue
    console.log('📌 Creating issue...');
    await createIssue(
      'GADDAMPAVANSIVAKRISHNA',
      'JAVASCRIT-Learning-Tutorial',
      'Suggestion: Add more examples',
      '### Feature Request\nI would love to see more advanced JavaScript examples.\n\nThanks! 🤖'
    );

    // 5. Create a Gist
    console.log('📝 Creating gist...');
    await createGist(
      'My first gist from Maya Assistant',
      'hello.js',
      'console.log("Hello from Maya Assistant!");',
      true // public
    );

    // 6. Get Repository Details
    console.log('ℹ️ Getting repository details...');
    const repoInfo = await getRepoDetails('GADDAMPAVANSIVAKRISHNA', 'JAVASCRIT-Learning-Tutorial');
    console.log(`✅ Repository ${repoInfo.name}: Default Branch = ${repoInfo.default_branch}, Open Issues = ${repoInfo.open_issues_count}\n`);
    
    console.log('━'.repeat(60));
    console.log('\n✅ All GitHub features tested successfully!\n');
    
  } catch (error: any) {
    console.error('\n❌ Error:', error.message || error);
    console.log('\n💡 Tips:');
    console.log('   1. Make sure your token has the right scopes (repo, user)');
    console.log('   2. Token should be valid and not expired');
    console.log('   3. Check your internet connection\n');
  }
}

// Run the test
testGitHub();
