<?php
// setup-database.php - Database setup for TaskAgent PHP version

require_once 'config/database.php';

function setupDatabase() {
    try {
        // Create connection without database selection first
        $host = 'mysql58.unoeuro.com';
        $username = 'jaxweb_dk';
        $password = 'zh9ktrcp';
        $database = 'jaxweb_dk_db';
        $port = 3306;
        
        echo "🔗 Forbinder til mysql58.unoeuro.com...\n";
        
        // First, connect without selecting database
        $dsn = "mysql:host={$host};port={$port};charset=utf8mb4";
        $pdo = new PDO($dsn, $username, $password, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);
        
        echo "📦 Opretter tabeller i database: {$database}...\n";
        
        // Use the existing database
        $pdo->exec("USE `{$database}`");
        
        // Drop existing TaskAgent tables if they exist
        echo "🗑️ Fjerner eksisterende TaskAgent tabeller hvis de findes...\n";
        $pdo->exec("DROP TABLE IF EXISTS recurring_task_completions");
        $pdo->exec("DROP TABLE IF EXISTS tasks");  
        $pdo->exec("DROP TABLE IF EXISTS projects");
        $pdo->exec("DROP TABLE IF EXISTS clients");
        
        echo "📋 Opretter nye tabeller...\n";
        
        // Create clients table
        $pdo->exec("
            CREATE TABLE clients (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");
        
        // Create projects table
        $pdo->exec("
            CREATE TABLE projects (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                client_id INT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");
        
        // Create tasks table with recurring task support
        $pdo->exec("
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
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");
        
        // Create recurring task completions table
        $pdo->exec("
            CREATE TABLE recurring_task_completions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                task_id INT NOT NULL,
                completion_date DATE NOT NULL,
                completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                time_spent INT DEFAULT 0 COMMENT 'Time spent in seconds for this completion',
                last_start TIMESTAMP NULL COMMENT 'When timer was last started for this completion',
                FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
                UNIQUE KEY unique_completion (task_id, completion_date)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");
        
        echo "🌱 Indsætter test data...\n";
        
        // Insert test clients
        $pdo->exec("
            INSERT INTO clients (name) VALUES 
            ('ACME Inc.'),
            ('TechCorp'),
            ('StartupXYZ')
        ");
        
        // Insert test projects
        $pdo->exec("
            INSERT INTO projects (name, client_id) VALUES
            ('Website redesign', 1),
            ('Mobile app', 2),
            ('E-commerce platform', 1)
        ");
        
        // Insert test tasks - both normal and recurring
        $pdo->exec("
            INSERT INTO tasks (title, project_id, estimated_hours, is_recurring, recurrence_type, recurrence_interval, start_date, created_at) VALUES
            ('Design forsiden', 1, '02:00:00', FALSE, NULL, 1, '2025-09-01', '2025-09-01 08:00:00'),
            ('Dagligt standup', 2, '00:30:00', TRUE, 'daily', 1, '2025-08-28', '2025-08-28 09:00:00'),
            ('Ugentlig rapport', 1, '01:00:00', TRUE, 'weekly', 1, '2025-08-26', '2025-08-26 14:00:00'),
            ('Implementer checkout', 3, '04:00:00', FALSE, NULL, 1, '2025-09-01', '2025-09-01 10:00:00'),
            ('Månedlig review', 2, '02:00:00', TRUE, 'monthly', 1, '2025-08-01', '2025-08-01 15:00:00')
        ");
        
        // Insert some test recurring completions
        $pdo->exec("
            INSERT INTO recurring_task_completions (task_id, completion_date, completed_at) VALUES
            (2, '2025-09-20', '2025-09-20 09:30:00'),
            (2, '2025-09-21', '2025-09-21 09:30:00'),
            (3, '2025-09-16', '2025-09-16 14:30:00')
        ");
        
        echo "✅ Database setup gennemført!\n";
        echo "🔄 Inklusive gentagende opgaver og completion tracking\n";
        echo "📊 Database: {$database} på {$host}\n";
        echo "📁 Tabeller: clients, projects, tasks, recurring_task_completions\n";
        
    } catch (PDOException $e) {
        echo "❌ Database setup fejlede: " . $e->getMessage() . "\n";
        exit(1);
    }
}

// Run setup if called directly
if (php_sapi_name() === 'cli') {
    setupDatabase();
}
?>