const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Load environment variables from backend directory
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'todo_app',
  user: process.env.DB_USER || process.env.USER || 'bilalrahaoui',
  password: process.env.DB_PASSWORD,
});

async function runSingleMigration() {
  const client = await pool.connect();
  
  try {
    console.log('Running single migration: 007_add_state_timestamps.sql');
    
    // Read and execute the new migration
    const migrationPath = path.join(__dirname, 'migrations', '007_add_state_timestamps.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    await client.query(migrationSQL);
    console.log('✅ Migration 007_add_state_timestamps.sql completed successfully');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runSingleMigration();
