import pool from './db.js';

console.log('Checking recurring_task_completions structure...');

try {
    const [columns] = await pool.execute('DESCRIBE recurring_task_completions');
    console.log('📋 Current recurring_task_completions structure:');
    columns.forEach(col => {
        console.log(`  - ${col.Field}: ${col.Type}${col.Null === 'YES' ? ' (nullable)' : ''}`);
    });
    
} catch (error) {
    console.error('❌ Error checking structure:', error.message);
    process.exit(1);
}

process.exit(0);