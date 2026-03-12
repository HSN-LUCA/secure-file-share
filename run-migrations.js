#!/usr/bin/env node

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Get DATABASE_URL from environment or use provided one
// URL encode the password: ZXCasdqwe!@#$%^123456789 -> ZXCasdqwe%21%40%23%24%25%5E123456789
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:ZXCasdqwe%21%40%23%24%25%5E123456789@db.sglkuzxuxxbxspzymcib.supabase.co:5432/postgres';

console.log('🔄 Connecting to Supabase...');

const pool = new Pool({
  host: 'db.sglkuzxuxxbxspzymcib.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'ZXCasdqwe!@#$%^123456789',
  ssl: { rejectUnauthorized: false }
});

async function runMigrations() {
  const client = await pool.connect();
  
  try {
    // Read migrations file
    const migrationsPath = path.join(__dirname, 'lib/db/migrations.sql');
    const migrations = fs.readFileSync(migrationsPath, 'utf8');
    
    console.log('📝 Running migrations...');
    
    // Execute migrations
    await client.query(migrations);
    
    console.log('✅ Migrations completed successfully!');
    
    // Verify tables
    const result = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    console.log('\n📊 Tables created:');
    result.rows.forEach(row => {
      console.log(`  ✓ ${row.table_name}`);
    });
    
    console.log(`\n✨ Total tables: ${result.rows.length}`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
    await pool.end();
  }
}

runMigrations();
