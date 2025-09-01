// setup-database.js
import mysql from 'mysql2/promise';

const config = {
  host: '127.0.0.1',
  user: 'root',
  password: '2010Thuva',
  multipleStatements: true
};

const createDatabase = async () => {
  try {
    const connection = await mysql.createConnection(config);
    
    console.log('📦 Opretter database...');
    await connection.execute(`
      CREATE DATABASE IF NOT EXISTS opgavestyring
      CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `);
    
    await connection.end();
    
    // Opret ny connection til den specifikke database
    const dbConnection = await mysql.createConnection({
      ...config,
      database: 'opgavestyring'
    });
    
    console.log('📋 Opretter tabeller...');
    
    // Clients tabel
    await dbConnection.execute(`
      CREATE TABLE IF NOT EXISTS clients (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `);
    
    // Projects tabel
    await dbConnection.execute(`
      CREATE TABLE IF NOT EXISTS projects (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        client_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL
      );
    `);
    
    // Tasks tabel
    await dbConnection.execute(`
      CREATE TABLE IF NOT EXISTS tasks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        project_id INT,
        repeat_interval VARCHAR(50),
        time_spent INT DEFAULT 0,
        last_start TIMESTAMP NULL,
        completed BOOLEAN DEFAULT FALSE,
        completed_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
      );
    `);
    
    console.log('🌱 Indsætter test data...');
    
    // Test data
    await dbConnection.execute(`
      INSERT IGNORE INTO clients (id, name) VALUES 
      (1, 'ACME Inc.'),
      (2, 'TechCorp'),
      (3, 'StartupXYZ')
    `);
    
    await dbConnection.execute(`
      INSERT IGNORE INTO projects (id, name, client_id) VALUES
      (1, 'Website redesign', 1),
      (2, 'Mobile app', 2),
      (3, 'E-commerce platform', 1)
    `);
    
    await dbConnection.execute(`
      INSERT IGNORE INTO tasks (id, title, project_id, repeat_interval) VALUES
      (1, 'Design forsiden', 1, 'daily'),
      (2, 'Implementer checkout', 3, NULL),
      (3, 'API dokumentation', 2, 'weekly')
    `);
    
    await dbConnection.end();
    console.log('✅ Database setup gennemført!');
    
  } catch (error) {
    console.error('❌ Database setup fejlede:', error.message);
    process.exit(1);
  }
};

createDatabase();
