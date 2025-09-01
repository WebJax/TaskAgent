// add-sample-data.js - Add sample time data for reports demonstration
import mysql from 'mysql2/promise';

const config = {
  host: '127.0.0.1',
  user: 'root',
  password: '2010Thuva',
  database: 'opgavestyring'
};

const addSampleData = async () => {
  try {
    const connection = await mysql.createConnection(config);
    
    console.log('📊 Tilføjer eksempel data for rapporter...');
    
    // Update existing tasks with sample time data
    await connection.execute(`
      UPDATE tasks SET 
        time_spent = 3600
      WHERE id = 1
    `);
    
    await connection.execute(`
      UPDATE tasks SET 
        time_spent = 7200
      WHERE id = 2
    `);
    
    await connection.execute(`
      UPDATE tasks SET 
        time_spent = 5400
      WHERE id = 3
    `);
    
    // Add more sample tasks with varying dates
    await connection.execute(`
      INSERT INTO tasks (title, project_id, repeat_interval, time_spent, created_at) VALUES
      ('Implementer login system', 2, NULL, 4500, DATE_SUB(NOW(), INTERVAL 4 DAY)),
      ('Design mobile layout', 1, 'weekly', 2700, DATE_SUB(NOW(), INTERVAL 5 DAY)),
      ('Database optimering', 3, NULL, 6300, DATE_SUB(NOW(), INTERVAL 6 DAY)),
      ('Bruger testing', 2, NULL, 1800, DATE_SUB(NOW(), INTERVAL 7 DAY)),
      ('SEO optimering', 1, 'monthly', 3900, DATE_SUB(NOW(), INTERVAL 8 DAY)),
      ('Performance testing', 3, NULL, 5100, DATE_SUB(NOW(), INTERVAL 9 DAY)),
      ('Content migration', 1, NULL, 2400, DATE_SUB(NOW(), INTERVAL 10 DAY))
    `);
    
    await connection.end();
    console.log('✅ Eksempel data tilføjet!');
    console.log('📊 Gå til http://localhost:3000/reports for at se rapporterne');
    
  } catch (error) {
    console.error('❌ Fejl ved tilføjelse af eksempel data:', error.message);
    process.exit(1);
  }
};

addSampleData();
