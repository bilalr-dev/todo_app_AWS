const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'todo_app',
  user: process.env.DB_USER || process.env.USER || 'bilalrahaoui',
  password: process.env.DB_PASSWORD,
});

async function runMigrations() {
  const client = await pool.connect();
  
  try {
    console.log('Running database migrations...');
    
    // Read and execute the initial schema
    const migrationPath = path.join(__dirname, '../database/migrations', '001_initial_schema.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    await client.query(migrationSQL);
    console.log('✅ Migration 001_initial_schema.sql completed successfully');
    
    // Read and execute additional migrations
    const migrations = [
      '002_add_advanced_features.sql',
      '003_optimize_indexes.sql',
      '004_add_todo_state.sql',
      '004_update_demo_user.sql',
      '005_add_theme_preference.sql',
      '006_add_file_attachments.sql',
      '007_add_state_timestamps.sql',
      '007_add_websocket_features.sql',
      '008_consolidate_todo_status.sql'
    ];
    
    for (const migration of migrations) {
      const migrationPath = path.join(__dirname, '../database/migrations', migration);
      if (fs.existsSync(migrationPath)) {
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
        await client.query(migrationSQL);
        console.log(`✅ Migration ${migration} completed successfully`);
      } else {
        console.log(`⚠️  Migration ${migration} not found, skipping...`);
      }
    }
    
    console.log('🎉 All migrations completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations();



