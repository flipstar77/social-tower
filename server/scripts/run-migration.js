/**
 * Simple Migration Runner
 * Runs SQL migration files against Supabase
 */

const fs = require('fs').promises;
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

async function runMigration(migrationName) {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    const migrationPath = path.join(__dirname, '../database/migrations', `${migrationName}.sql`);

    console.log(`📄 Reading migration: ${migrationName}.sql`);
    const sql = await fs.readFile(migrationPath, 'utf-8');

    console.log(`🚀 Running migration...`);
    const { data, error } = await supabase.rpc('exec_sql', { sql_string: sql });

    if (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }

    console.log('✅ Migration completed successfully!');
}

// Get migration name from command line
const migrationName = process.argv[2];

if (!migrationName) {
    console.error('Usage: node run-migration.js <migration-name>');
    console.error('Example: node run-migration.js 006_game_knowledge_base');
    process.exit(1);
}

runMigration(migrationName).catch(console.error);
