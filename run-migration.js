/**
 * Run database migrations
 */
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function runMigration(filePath) {
  console.log(`Running migration: ${filePath}`);

  const sql = fs.readFileSync(filePath, 'utf8');

  try {
    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      // Try direct query if RPC doesn't work
      console.log('Trying direct query execution...');

      // Split by semicolons and execute each statement
      const statements = sql.split(';').filter(s => s.trim());

      for (const statement of statements) {
        if (statement.trim()) {
          const result = await supabase.from('_sql').select().limit(0); // This won't work, need raw SQL
          console.log('Note: Supabase JS client has limited raw SQL support.');
          console.log('Please run this migration manually in Supabase SQL editor:');
          console.log(sql);
          return;
        }
      }
    }

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    console.log('\nPlease run this SQL manually in Supabase dashboard:');
    console.log(sql);
  }
}

runMigration('server/database/migrations/010_add_card_mastery.sql');
