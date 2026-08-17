import sqlite3 from 'sqlite3';
import * as path from 'path';

// Database file path
const DB_PATH = path.join(__dirname, '../../maya.db');

// Create database connection
const db = new sqlite3.Database(DB_PATH);

// Helper Promise wrappers for SQLite3
function dbRun(sql: string, params: any[] = []): Promise<{ lastID: number; changes: number }> {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (this: any, err: any) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

function dbAll(sql: string, params: any[] = []): Promise<any[]> {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

function dbGet(sql: string, params: any[] = []): Promise<any> {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

// ============ INITIALIZE DATABASE ============

/**
 * Initialize the database tables
 */
export async function initDatabase() {
  console.log('📅 Initializing reminder database...');
  
  try {
    // Create reminders table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS reminders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        text TEXT NOT NULL,
        datetime TEXT NOT NULL,
        recurring TEXT DEFAULT 'none',
        completed INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        priority TEXT DEFAULT 'medium',
        category TEXT DEFAULT 'general'
      )
    `);

    // Create index for faster queries
    await dbRun(`
      CREATE INDEX IF NOT EXISTS idx_reminders_datetime 
      ON reminders(datetime)
    `);

    await dbRun(`
      CREATE INDEX IF NOT EXISTS idx_reminders_completed 
      ON reminders(completed)
    `);

    console.log('✅ Database initialized successfully!');
  } catch (error) {
    console.error('❌ Database initialization error:', error);
    throw error;
  }
}

// ============ REMINDER OPERATIONS ============

/**
 * Add a new reminder
 */
export async function addReminder(
  text: string,
  datetime: string,
  recurring: string = 'none',
  priority: string = 'medium',
  category: string = 'general'
) {
  try {
    const result = await dbRun(
      `INSERT INTO reminders (text, datetime, recurring, priority, category) 
       VALUES (?, ?, ?, ?, ?)`,
      [text, datetime, recurring, priority, category]
    );
    
    console.log(`✅ Reminder added: "${text}" at ${datetime}`);
    return { id: result.lastID, text, datetime, recurring, priority, category };
  } catch (error) {
    console.error('❌ Error adding reminder:', error);
    throw error;
  }
}

/**
 * Get all reminders
 */
export async function getAllReminders() {
  try {
    const rows = await dbAll(
      `SELECT * FROM reminders 
       ORDER BY datetime ASC`
    );
    return rows;
  } catch (error) {
    console.error('❌ Error getting reminders:', error);
    throw error;
  }
}

/**
 * Get due reminders (current time or past)
 */
export async function getDueReminders() {
  try {
    const rows = await dbAll(
      `SELECT * FROM reminders 
       WHERE datetime <= datetime('now', 'localtime') 
       AND completed = 0 
       ORDER BY datetime ASC`
    );
    return rows;
  } catch (error) {
    console.error('❌ Error getting due reminders:', error);
    throw error;
  }
}

/**
 * Get upcoming reminders (future)
 */
export async function getUpcomingReminders() {
  try {
    const rows = await dbAll(
      `SELECT * FROM reminders 
       WHERE datetime > datetime('now', 'localtime') 
       AND completed = 0 
       ORDER BY datetime ASC 
       LIMIT 10`
    );
    return rows;
  } catch (error) {
    console.error('❌ Error getting upcoming reminders:', error);
    throw error;
  }
}

/**
 * Get reminders for today
 */
export async function getTodayReminders() {
  try {
    const rows = await dbAll(
      `SELECT * FROM reminders 
       WHERE date(datetime) = date('now', 'localtime') 
       AND completed = 0 
       ORDER BY datetime ASC`
    );
    return rows;
  } catch (error) {
    console.error('❌ Error getting today\'s reminders:', error);
    throw error;
  }
}

/**
 * Complete a reminder
 */
export async function completeReminder(id: number) {
  try {
    await dbRun(
      `UPDATE reminders 
       SET completed = 1 
       WHERE id = ?`,
      [id]
    );
    console.log(`✅ Reminder ${id} marked as completed`);
    return { id, completed: true };
  } catch (error) {
    console.error('❌ Error completing reminder:', error);
    throw error;
  }
}

/**
 * Delete a reminder
 */
export async function deleteReminder(id: number) {
  try {
    await dbRun(
      `DELETE FROM reminders 
       WHERE id = ?`,
      [id]
    );
    console.log(`🗑️ Reminder ${id} deleted`);
    return { id, deleted: true };
  } catch (error) {
    console.error('❌ Error deleting reminder:', error);
    throw error;
  }
}

/**
 * Update a reminder
 */
export async function updateReminder(
  id: number,
  text?: string,
  datetime?: string,
  priority?: string,
  category?: string
) {
  try {
    const updates: string[] = [];
    const values: any[] = [];

    if (text) {
      updates.push('text = ?');
      values.push(text);
    }
    if (datetime) {
      updates.push('datetime = ?');
      values.push(datetime);
    }
    if (priority) {
      updates.push('priority = ?');
      values.push(priority);
    }
    if (category) {
      updates.push('category = ?');
      values.push(category);
    }

    if (updates.length === 0) {
      throw new Error('No fields to update');
    }

    values.push(id);
    
    await dbRun(
      `UPDATE reminders 
       SET ${updates.join(', ')} 
       WHERE id = ?`,
      values
    );
    
    console.log(`✅ Reminder ${id} updated`);
    return { id, updated: true };
  } catch (error) {
    console.error('❌ Error updating reminder:', error);
    throw error;
  }
}

/**
 * Search reminders
 */
export async function searchReminders(query: string) {
  try {
    const rows = await dbAll(
      `SELECT * FROM reminders 
       WHERE text LIKE ? 
       AND completed = 0 
       ORDER BY datetime ASC`,
      [`%${query}%`]
    );
    return rows;
  } catch (error) {
    console.error('❌ Error searching reminders:', error);
    throw error;
  }
}

/**
 * Get reminders by category
 */
export async function getRemindersByCategory(category: string) {
  try {
    const rows = await dbAll(
      `SELECT * FROM reminders 
       WHERE category = ? 
       AND completed = 0 
       ORDER BY datetime ASC`,
      [category]
    );
    return rows;
  } catch (error) {
    console.error('❌ Error getting reminders by category:', error);
    throw error;
  }
}

/**
 * Get reminder statistics
 */
export async function getReminderStats() {
  try {
    const total = await dbGet(
      `SELECT COUNT(*) as count FROM reminders`
    );
    
    const completed = await dbGet(
      `SELECT COUNT(*) as count FROM reminders WHERE completed = 1`
    );
    
    const due = await dbGet(
      `SELECT COUNT(*) as count FROM reminders 
       WHERE datetime <= datetime('now', 'localtime') 
       AND completed = 0`
    );
    
    const upcoming = await dbGet(
      `SELECT COUNT(*) as count FROM reminders 
       WHERE datetime > datetime('now', 'localtime') 
       AND completed = 0`
    );
    
    return {
      total: total ? total.count : 0,
      completed: completed ? completed.count : 0,
      due: due ? due.count : 0,
      upcoming: upcoming ? upcoming.count : 0
    };
  } catch (error) {
    console.error('❌ Error getting stats:', error);
    throw error;
  }
}

// ============ RECURRING REMINDERS ============

/**
 * Handle recurring reminders
 * This should be called periodically to reschedule recurring reminders
 */
export async function handleRecurringReminders() {
  try {
    const rows = await dbAll(
      `SELECT * FROM reminders 
       WHERE recurring != 'none' 
       AND completed = 1`
    );
    
    for (const reminder of rows) {
      let newDate = new Date(reminder.datetime);
      const now = new Date();
      
      switch (reminder.recurring) {
        case 'daily':
          newDate.setDate(newDate.getDate() + 1);
          break;
        case 'weekly':
          newDate.setDate(newDate.getDate() + 7);
          break;
        case 'monthly':
          newDate.setMonth(newDate.getMonth() + 1);
          break;
        case 'yearly':
          newDate.setFullYear(newDate.getFullYear() + 1);
          break;
        default:
          continue;
      }
      
      // Only reschedule if new date is in the future
      if (newDate > now) {
        await dbRun(
          `INSERT INTO reminders (text, datetime, recurring, priority, category) 
           VALUES (?, ?, ?, ?, ?)`,
          [reminder.text, newDate.toISOString(), reminder.recurring, reminder.priority, reminder.category]
        );
        console.log(`🔄 Rescheduled recurring reminder: "${reminder.text}"`);
      }
    }
  } catch (error) {
    console.error('❌ Error handling recurring reminders:', error);
    throw error;
  }
}

// ============ HELPER FUNCTIONS ============

/**
 * Format datetime for display
 */
export function formatDateTime(datetime: string): string {
  const date = new Date(datetime);
  return date.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Close database connection
 */
export function closeDatabase() {
  db.close((err) => {
    if (err) {
      console.error('❌ Error closing database:', err);
    } else {
      console.log('✅ Database connection closed');
    }
  });
}

export default {
  initDatabase,
  addReminder,
  getAllReminders,
  getDueReminders,
  getUpcomingReminders,
  getTodayReminders,
  completeReminder,
  deleteReminder,
  updateReminder,
  searchReminders,
  getRemindersByCategory,
  getReminderStats,
  handleRecurringReminders,
  formatDateTime,
  closeDatabase
};
