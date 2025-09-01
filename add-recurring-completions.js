// add-recurring-completions.js
import mysql from 'mysql2/promise';

const config = {
  host: '127.0.0.1',
  user: 'root',
  password: '2010Thuva',
  database: 'opgavestyring'
};

const addRecurringCompletions = async () => {
  try {
    const connection = await mysql.createConnection(config);
    
    console.log('📅 Opretter tabel for gentagende opgave udførelser...');
    
    // Opret tabel til at holde styr på gentagende opgaver udført på specifikke datoer
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS recurring_task_completions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        task_id INT NOT NULL,
        completion_date DATE NOT NULL,
        time_spent INT DEFAULT 0,
        completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
        UNIQUE KEY unique_task_date (task_id, completion_date),
        INDEX idx_completion_date (completion_date),
        INDEX idx_task_completion (task_id, completion_date)
      );
    `);
    
    console.log('✅ Recurring task completions tabel oprettet!');
    
    await connection.end();
    
  } catch (error) {
    console.error('❌ Kunne ikke oprette tabel:', error.message);
    process.exit(1);
  }
};

addRecurringCompletions();
