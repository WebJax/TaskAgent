// add-recurring-columns.js
import mysql from 'mysql2/promise';

const config = {
  host: '127.0.0.1',
  user: 'root',
  password: '2010Thuva',
  database: 'opgavestyring'
};

const addRecurringColumns = async () => {
  try {
    const connection = await mysql.createConnection(config);
    
    console.log('🔄 Tilføjer kolonner for gentagende opgaver...');
    
    // Tjek og tilføj kolonner en ad gangen
    try {
      await connection.execute(`
        ALTER TABLE tasks 
        ADD COLUMN is_recurring BOOLEAN DEFAULT FALSE
      `);
      console.log('✓ is_recurring kolonne tilføjet');
    } catch (error) {
      if (!error.message.includes('Duplicate column name')) {
        throw error;
      }
      console.log('✓ is_recurring kolonne eksisterer allerede');
    }
    
    try {
      await connection.execute(`
        ALTER TABLE tasks 
        ADD COLUMN recurrence_type ENUM('daily', 'weekly', 'monthly', 'yearly') NULL
      `);
      console.log('✓ recurrence_type kolonne tilføjet');
    } catch (error) {
      if (!error.message.includes('Duplicate column name')) {
        throw error;
      }
      console.log('✓ recurrence_type kolonne eksisterer allerede');
    }
    
    try {
      await connection.execute(`
        ALTER TABLE tasks 
        ADD COLUMN recurrence_interval INT DEFAULT 1
      `);
      console.log('✓ recurrence_interval kolonne tilføjet');
    } catch (error) {
      if (!error.message.includes('Duplicate column name')) {
        throw error;
      }
      console.log('✓ recurrence_interval kolonne eksisterer allerede');
    }
    
    try {
      await connection.execute(`
        ALTER TABLE tasks 
        ADD COLUMN next_occurrence DATE NULL
      `);
      console.log('✓ next_occurrence kolonne tilføjet');
    } catch (error) {
      if (!error.message.includes('Duplicate column name')) {
        throw error;
      }
      console.log('✓ next_occurrence kolonne eksisterer allerede');
    }
    
    try {
      await connection.execute(`
        ALTER TABLE tasks 
        ADD COLUMN parent_task_id INT NULL
      `);
      console.log('✓ parent_task_id kolonne tilføjet');
    } catch (error) {
      if (!error.message.includes('Duplicate column name')) {
        throw error;
      }
      console.log('✓ parent_task_id kolonne eksisterer allerede');
    }
    
    try {
      await connection.execute(`
        ALTER TABLE tasks 
        ADD COLUMN last_recurring_date DATE NULL
      `);
      console.log('✓ last_recurring_date kolonne tilføjet');
    } catch (error) {
      if (!error.message.includes('Duplicate column name')) {
        throw error;
      }
      console.log('✓ last_recurring_date kolonne eksisterer allerede');
    }
    
    // Tilføj indekser
    try {
      await connection.execute(`
        ALTER TABLE tasks 
        ADD INDEX idx_next_occurrence (next_occurrence)
      `);
      console.log('✓ next_occurrence indeks tilføjet');
    } catch (error) {
      if (!error.message.includes('Duplicate key name')) {
        console.log('⚠️ Indeks muligvis allerede tilføjet:', error.message);
      }
    }
    
    try {
      await connection.execute(`
        ALTER TABLE tasks 
        ADD INDEX idx_parent_task (parent_task_id)
      `);
      console.log('✓ parent_task indeks tilføjet');
    } catch (error) {
      if (!error.message.includes('Duplicate key name')) {
        console.log('⚠️ Indeks muligvis allerede tilføjet:', error.message);
      }
    }
    
    console.log('📝 Opdaterer eksisterende opgaver...');
    
    // Tjek om repeat_interval kolonnen eksisterer først
    const [columns] = await connection.execute(`
      SHOW COLUMNS FROM tasks LIKE 'repeat_interval'
    `);
    
    if (columns.length > 0) {
      // Opdater eksisterende opgaver der har repeat_interval sat
      await connection.execute(`
        UPDATE tasks 
        SET is_recurring = TRUE, 
            recurrence_type = CASE 
              WHEN repeat_interval = 'daily' THEN 'daily'
              WHEN repeat_interval = 'weekly' THEN 'weekly'
              WHEN repeat_interval = 'monthly' THEN 'monthly'
              WHEN repeat_interval = 'yearly' THEN 'yearly'
              ELSE NULL
            END,
            next_occurrence = CASE 
              WHEN repeat_interval = 'daily' THEN DATE_ADD(CURDATE(), INTERVAL 1 DAY)
              WHEN repeat_interval = 'weekly' THEN DATE_ADD(CURDATE(), INTERVAL 1 WEEK)
              WHEN repeat_interval = 'monthly' THEN DATE_ADD(CURDATE(), INTERVAL 1 MONTH)
              WHEN repeat_interval = 'yearly' THEN DATE_ADD(CURDATE(), INTERVAL 1 YEAR)
              ELSE NULL
            END
        WHERE repeat_interval IS NOT NULL
      `);
      
      console.log('🗑️ Fjerner gammel repeat_interval kolonne...');
      
      // Fjern den gamle repeat_interval kolonne efter migration
      await connection.execute(`
        ALTER TABLE tasks DROP COLUMN repeat_interval
      `);
      
      console.log('✓ Migrering af eksisterende data gennemført');
    } else {
      console.log('✓ Ingen gammel repeat_interval kolonne at migrere');
    }
    
    await connection.end();
    console.log('✅ Gentagende opgaver kolonner tilføjet!');
    
  } catch (error) {
    console.error('❌ Migration fejlede:', error.message);
    process.exit(1);
  }
};

addRecurringColumns();