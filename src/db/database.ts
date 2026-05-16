import * as SQLite from "expo-sqlite";

export const DATABASE_NAME = "finance_sms_poc.db";

export async function initDatabase() {
  const db = await SQLite.openDatabaseAsync(DATABASE_NAME);

  // transactions table
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sms_id TEXT,
      hash TEXT UNIQUE,
      raw_sms TEXT,
      sender TEXT,
      bank TEXT,
      category TEXT,
      transaction_type TEXT,
      amount REAL,
      merchant TEXT,
      card_last4 TEXT,
      account_last4 TEXT,
      upi_ref TEXT,
      txn_date TEXT,
      due_date TEXT,
      total_due REAL,
      minimum_due REAL,
      confidence_score REAL,
      is_expense INTEGER,
      is_duplicate INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // sms_messages table
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS sms_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sms_id TEXT UNIQUE,
      sender TEXT,
      body TEXT,
      date INTEGER,
      thread_id INTEGER,
      parsed INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // cards table
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS cards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bank TEXT,
      card_last4 TEXT,
      nickname TEXT,
      statement_day INTEGER,
      due_day INTEGER,
      cycle_start_day INTEGER,
      cycle_end_day INTEGER,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // settings table
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);

  return db;
}

export async function getDatabase() {
  return await SQLite.openDatabaseAsync(DATABASE_NAME);
}
