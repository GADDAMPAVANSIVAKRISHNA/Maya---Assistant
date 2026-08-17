import {
  initDatabase,
  addReminder,
  getAllReminders,
  getDueReminders,
  getUpcomingReminders,
  getTodayReminders,
  completeReminder,
  deleteReminder,
  getReminderStats,
  searchReminders,
  formatDateTime,
  closeDatabase
} from './services/reminderService';

async function testReminders() {
  console.log('\n📅 ===== MAYA ASSISTANT REMINDERS TEST =====\n');
  
  try {
    // 1. Initialize database
    console.log('📦 Initializing database...');
    await initDatabase();
    console.log('✅ Database ready!\n');

    // 2. Add sample reminders
    console.log('➕ Adding sample reminders...');
    
    const now = new Date();
    const today = now.toISOString();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString();
    const nextWeek = new Date(now);
    nextWeek.setDate(nextWeek.getDate() + 7);
    const nextWeekStr = nextWeek.toISOString();

    await addReminder(
      'Team meeting at 3 PM',
      tomorrowStr,
      'none',
      'high',
      'work'
    );

    await addReminder(
      'Submit project report',
      tomorrowStr,
      'none',
      'high',
      'work'
    );

    await addReminder(
      'Buy groceries',
      today,
      'weekly',
      'medium',
      'personal'
    );

    await addReminder(
      'Call mom',
      nextWeekStr,
      'none',
      'medium',
      'personal'
    );

    console.log('✅ Sample reminders added!\n');

    // 3. Get all reminders
    console.log('📋 All reminders:');
    const allReminders = await getAllReminders();
    allReminders.forEach((r: any) => {
      console.log(`   ${r.id}. ${r.text}`);
      console.log(`      📅 ${formatDateTime(r.datetime)}`);
      console.log(`      🔄 ${r.recurring} | ⭐ ${r.priority} | 📂 ${r.category}`);
      console.log(`      ✅ ${r.completed ? 'Completed' : 'Pending'}\n`);
    });

    // 4. Get due reminders
    console.log('⏰ Due reminders:');
    const dueReminders = await getDueReminders();
    if (dueReminders.length === 0) {
      console.log('   No due reminders! 🎉\n');
    } else {
      dueReminders.forEach((r: any) => {
        console.log(`   📌 ${r.text} (${formatDateTime(r.datetime)})`);
      });
      console.log();
    }

    // 5. Get upcoming reminders
    console.log('🔮 Upcoming reminders:');
    const upcomingReminders = await getUpcomingReminders();
    upcomingReminders.forEach((r: any) => {
      console.log(`   📌 ${r.text} (${formatDateTime(r.datetime)})`);
    });
    console.log();

    // 6. Get today's reminders
    console.log('📅 Today\'s reminders:');
    const todayReminders = await getTodayReminders();
    todayReminders.forEach((r: any) => {
      console.log(`   📌 ${r.text} (${formatDateTime(r.datetime)})`);
    });
    console.log();

    // 7. Get statistics
    console.log('📊 Reminder Statistics:');
    const stats = await getReminderStats();
    console.log(`   Total: ${stats.total}`);
    console.log(`   Completed: ${stats.completed}`);
    console.log(`   Due: ${stats.due}`);
    console.log(`   Upcoming: ${stats.upcoming}`);
    console.log();

    // 8. Search reminders
    console.log('🔍 Searching for "meeting":');
    const searchResults = await searchReminders('meeting');
    searchResults.forEach((r: any) => {
      console.log(`   📌 ${r.text} (${formatDateTime(r.datetime)})`);
    });
    console.log();

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n✅ Reminder system is working!\n');

    // Close database
    closeDatabase();

  } catch (error: any) {
    console.error('\n❌ Error:', error.message || error);
    console.log('\n💡 Tips:');
    console.log('   1. Make sure SQLite is installed');
    console.log('   2. Check write permissions in the project folder');
    console.log('   3. Try running as administrator if needed\n');
  }
}

// Run the test
testReminders();
