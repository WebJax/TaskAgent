// migrate-add-completed.js - Tilføj completed kolonner til tasks tabellen
import mysql from 'mysql2/promise';
import fs from 'fs';

const config = {
  host: '127.0.0.1',
  user: 'root',
  password: '2010Thuva',
  port: 3306,
};

async function migrateDatabase() {
  try {
    console.log('🔄 Starter migration for completed funktionalitet...');
    
    const connection = await mysql.createConnection({
      ...config,
      database: 'opgavestyring'
    });
    
    console.log('📋 Tilføjer completed kolonner til tasks tabellen...');
    
    // Tilføj completed kolonne hvis den ikke eksisterer
    try {
      await connection.execute(`
        ALTER TABLE tasks 
        ADD COLUMN completed BOOLEAN DEFAULT FALSE,
        ADD COLUMN completed_at TIMESTAMP NULL
      `);
      console.log('✅ completed og completed_at kolonner tilføjet succesfuldt');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹ️ completed kolonner eksisterer allerede');
      } else {
        throw error;
      }
    }
    
    // Opdater eksisterende data
    console.log('🔄 Opdaterer eksisterende opgaver...');
    await connection.execute(`
      UPDATE tasks 
      SET completed = FALSE 
      WHERE completed IS NULL
    `);
    
    await connection.end();
    console.log('✅ Migration fuldført succesfuldt!');
    
  } catch (error) {
    console.error('❌ Fejl under migration:', error);
    process.exit(1);
  }
}

migrateDatabase();
