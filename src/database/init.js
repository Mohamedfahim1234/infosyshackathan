import sqlite3 from 'sqlite3';
import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let db = null;

export async function initializeDatabase() {
  try {
    // Ensure data directory exists
    const dataDir = join(__dirname, '../../data');
    await fs.mkdir(dataDir, { recursive: true });
    
    const dbPath = join(dataDir, config.database.filename);
    
    db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        logger.error('Error opening database:', err);
        throw err;
      }
      logger.info('Connected to SQLite database');
    });
    
    // Enable foreign keys
    db.run('PRAGMA foreign_keys = ON');
    
    // Create tables
    await createTables();
    
    return db;
  } catch (error) {
    logger.error('Database initialization failed:', error);
    throw error;
  }
}

async function createTables() {
  const schema = await fs.readFile(join(__dirname, 'schema.sql'), 'utf8');
  const statements = schema.split(';').filter(stmt => stmt.trim());
  
  for (const statement of statements) {
    await new Promise((resolve, reject) => {
      db.run(statement, (err) => {
        if (err) {
          logger.error('Error executing SQL:', statement, err);
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }
  
  logger.info('Database tables created successfully');
}

export function getDatabase() {
  if (!db) {
    throw new Error('Database not initialized');
  }
  return db;
}

export function closeDatabase() {
  if (db) {
    db.close((err) => {
      if (err) {
        logger.error('Error closing database:', err);
      } else {
        logger.info('Database connection closed');
      }
    });
  }
}