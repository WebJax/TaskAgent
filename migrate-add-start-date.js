// migrate-add-start-date.js - Tilføjer start_date kolonne for bedre recurring task håndtering
import mysql from 'mysql2/promise';

const config = {
  host: '127.0.0.1',
  user: 'root',
  password: '2010Thuva',
  database: 'opgavestyring'
};

const addStartDate = async () => {
  try {
    const connection = await mysql.createConnection(config);
    
    console.log('📅 Tilføjer start_date kolonne...');
    
    // Tilføj start_date kolonne
    try {
      await connection.execute(`
        ALTER TABLE tasks 
        ADD COLUMN start_date DATE NOT NULL DEFAULT (DATE(created_at))
      `);
      console.log('✅ start_date kolonne tilføjet');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('⚠️ start_date kolonne eksisterer allerede');
      } else {
        throw error;
      }
    }
    
    // Opdater eksisterende data så start_date matcher created_at
    await connection.execute(`
      UPDATE tasks 
      SET start_date = DATE(created_at) 
      WHERE start_date = DATE(created_at)
    `);
    
    console.log('📊 Opdaterer test data med korrekte start datoer...');
    
    // Opdater test data med mere logiske start datoer
    await connection.execute(`
      UPDATE tasks 
      SET start_date = '2025-09-01' 
      WHERE id IN (1, 4)
    `); // Design forsiden og Implementer checkout - i dag
    
    await connection.execute(`
      UPDATE tasks 
      SET start_date = '2025-08-28' 
      WHERE id = 2
    `); // Dagligt standup - startede onsdag
    
    await connection.execute(`
      UPDATE tasks 
      SET start_date = '2025-08-26' 
      WHERE id = 3
    `); // Ugentlig rapport - startede mandag
    
    await connection.execute(`
      UPDATE tasks 
      SET start_date = '2025-08-01' 
      WHERE id = 5
    `); // Månedlig review - startede 1. august
    
    await connection.end();
    console.log('✅ Start date migration gennemført!');
    
  } catch (error) {
    console.error('❌ Migration fejlede:', error.message);
    process.exit(1);
  }
};

addStartDate();
