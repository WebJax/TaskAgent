import pool from './db.js';

console.log('Adding time tracking to recurring task completions...');

try {
    // Add time_spent and last_start columns to recurring_task_completions
    await pool.execute(`
        ALTER TABLE recurring_task_completions 
        ADD COLUMN time_spent INT DEFAULT 0 COMMENT 'Time spent in seconds for this completion',
        ADD COLUMN last_start TIMESTAMP NULL COMMENT 'When timer was last started for this completion'
    `);
    
    console.log('✅ Successfully added time tracking columns to recurring_task_completions');
    
    // Check the updated structure
    const [columns] = await pool.execute('DESCRIBE recurring_task_completions');
    console.log('📋 Updated recurring_task_completions structure:');
    columns.forEach(col => {
        console.log(`  - ${col.Field}: ${col.Type}${col.Null === 'YES' ? ' (nullable)' : ''}`);
    });
    
} catch (error) {
    console.error('❌ Error adding time tracking columns:', error.message);
    process.exit(1);
}

process.exit(0);