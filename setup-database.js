// setup-database.js - Database setup med environment variabler
import 'dotenv/config';
import mysql from 'mysql2/promise';

const config = {
  host: process.env.MYSQLHOST || '127.0.0.1',
  user: process.env.MYSQLUSER || 'root',
  password: process.env.MYSQLPASSWORD || '2010Thuva',
  port: process.env.MYSQLPORT || 3306,
  multipleStatements: true,
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false
};

const createDatabase = async () => {
  try {
    const connection = await mysql.createConnection(config);
    
    const databaseName = process.env.MYSQLDATABASE || 'opgavestyring';
    
    console.log('🗑️ Dropper eksisterende database...');
    await connection.execute(`DROP DATABASE IF EXISTS ${databaseName}`);
    
    console.log('📦 Opretter ny database...');
    await connection.execute(`
      CREATE DATABASE ${databaseName}
      CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `);
    
    await connection.end();
    
    // Opret ny connection til den specifikke database
    const dbConnection = await mysql.createConnection({
      ...config,
      database: databaseName
    });
    
    console.log('📋 Opretter tabeller...');
    
    // Clients tabel
    await dbConnection.execute(`
      CREATE TABLE clients (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `);
    
    // Projects tabel
    await dbConnection.execute(`
      CREATE TABLE projects (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        client_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL
      );
    `);
    
    // Tasks tabel med gentagende opgaver fra starten
    await dbConnection.execute(`
      CREATE TABLE tasks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        project_id INT,
        estimated_hours TIME NULL,
        time_spent INT DEFAULT 0,
        last_start TIMESTAMP NULL,
        completed BOOLEAN DEFAULT FALSE,
        completed_at TIMESTAMP NULL,
        is_recurring BOOLEAN DEFAULT FALSE,
        recurrence_type ENUM('daily', 'weekly', 'monthly', 'yearly') NULL,
        recurrence_interval INT DEFAULT 1,
        next_occurrence DATE NULL,
        start_date DATE NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
        INDEX idx_recurrence (is_recurring, recurrence_type, next_occurrence),
        INDEX idx_created_date (created_at)
      );
    `);
    
    // Recurring task completions tabel
    await dbConnection.execute(`
      CREATE TABLE recurring_task_completions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        task_id INT NOT NULL,
        completion_date DATE NOT NULL,
        completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        time_spent INT DEFAULT 0 COMMENT 'Time spent in seconds for this completion',
        last_start TIMESTAMP NULL COMMENT 'When timer was last started for this completion',
        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
        UNIQUE KEY unique_completion (task_id, completion_date)
      );
    `);
    
    console.log('🌱 Indsætter test data...');
    
    // Test data
    await dbConnection.execute(`
      INSERT INTO clients (name) VALUES 
      ('ACME Inc.'),
      ('TechCorp'),
      ('StartupXYZ')
    `);
    
    await dbConnection.execute(`
      INSERT INTO projects (name, client_id) VALUES
      ('Website redesign', 1),
      ('Mobile app', 2),
      ('E-commerce platform', 1)
    `);
    
    // Test opgaver - både normale og gentagende
    await dbConnection.execute(`
      INSERT INTO tasks (title, project_id, estimated_hours, is_recurring, recurrence_type, recurrence_interval, start_date, created_at) VALUES
      ('Design forsiden', 1, '02:00', FALSE, NULL, 1, '2025-09-01', '2025-09-01 08:00:00'),
      ('Dagligt standup', 2, '00:30', TRUE, 'daily', 1, '2025-08-28', '2025-08-28 09:00:00'),
      ('Ugentlig rapport', 1, '01:00', TRUE, 'weekly', 1, '2025-08-26', '2025-08-26 14:00:00'),
      ('Implementer checkout', 3, '04:00', FALSE, NULL, 1, '2025-09-01', '2025-09-01 10:00:00'),
      ('Månedlig review', 2, '02:00', TRUE, 'monthly', 1, '2025-08-01', '2025-08-01 15:00:00')
    `);
    
    await dbConnection.end();
    console.log('✅ Database setup gennemført!');
    console.log('🔄 Inklusive gentagende opgaver og completion tracking');
    
  } catch (error) {
    console.error('❌ Database setup fejlede:', error.message);
    process.exit(1);
  }
};

createDatabase();
