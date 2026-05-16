import * as SQLite from "expo-sqlite";

export const DATABASE_NAME = "finance_sms_poc.db";

let dbInstance: SQLite.SQLiteDatabase | null = null;
let initPromise: Promise<SQLite.SQLiteDatabase> | null = null;

/**
 * Initializes the database and creates tables if they don't exist.
 * Uses a singleton pattern to ensure initialization happens only once.
 */
export async function initDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    try {
      const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
      dbInstance = db;

      // Use a single transaction for schema creation for better reliability on Android
      await db.execAsync(`
        PRAGMA journal_mode = WAL;
        PRAGMA synchronous = NORMAL;

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
          txn_timestamp INTEGER,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

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

        CREATE TABLE IF NOT EXISTS cards (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          bank TEXT,
          card_last4 TEXT,
          nickname TEXT,
          statement_day INTEGER,
          due_day INTEGER,
          grace_period INTEGER DEFAULT 20,
          cycle_start_day INTEGER,
          cycle_end_day INTEGER,
          is_active INTEGER DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(bank, card_last4)
        );

        CREATE TABLE IF NOT EXISTS settings (
          key TEXT PRIMARY KEY,
          value TEXT
        );
      `);

      return db;
    } catch (error) {
      initPromise = null; // Allow retry on failure
      dbInstance = null;
      console.error("Database initialization failed:", error);
      throw error;
    }
  })();

  return initPromise;
}

/**
 * Provides access to the database instance.
 * Ensures initDatabase has been called or triggers it.
 */
export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (dbInstance) {
    return dbInstance;
  }
  return await initDatabase();
}
