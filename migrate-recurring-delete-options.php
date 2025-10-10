<?php
/**
 * Migration: Add end_date and support for hiding specific recurring task dates
 * Run: php migrate-recurring-delete-options.php
 */

require_once __DIR__ . '/config/database.php';

echo "🚀 Migration: Tilføjer end_date og hidden_dates support...\n\n";

try {
    $db = Database::getInstance();
    $pdo = $db->getConnection();
    
    // Add end_date column to tasks table
    echo "📅 Tilføjer end_date kolonne til tasks...\n";
    $pdo->exec("
        ALTER TABLE tasks 
        ADD COLUMN end_date DATE NULL AFTER start_date,
        ADD INDEX idx_end_date (end_date)
    ");
    echo "✅ end_date kolonne tilføjet\n\n";
    
    // Create table for hidden recurring task dates
    echo "🙈 Opretter recurring_task_hidden_dates tabel...\n";
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS recurring_task_hidden_dates (
            id INT AUTO_INCREMENT PRIMARY KEY,
            task_id INT NOT NULL,
            hidden_date DATE NOT NULL,
            hidden_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
            UNIQUE KEY unique_hidden (task_id, hidden_date),
            INDEX idx_task_date (task_id, hidden_date)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    echo "✅ recurring_task_hidden_dates tabel oprettet\n\n";
    
    echo "🎉 Migration gennemført succesfuldt!\n";
    echo "\n📝 Ændringer:\n";
    echo "  - end_date kolonne i tasks (bruges til at stoppe gentagelser)\n";
    echo "  - recurring_task_hidden_dates tabel (bruges til at skjule enkelte forekomster)\n";
    
} catch (PDOException $e) {
    echo "❌ Fejl: " . $e->getMessage() . "\n";
    exit(1);
}
?>
