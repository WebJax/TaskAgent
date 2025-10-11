<?php
/**
 * Migration: Add completed field to recurring_task_completions
 * Run: php migrate-add-completed-field.php
 */

require_once __DIR__ . '/config/database.php';

echo "🚀 Migration: Tilføjer completed felt til recurring_task_completions...\n\n";

try {
    $db = Database::getInstance();
    $pdo = $db->getConnection();
    
    // Add completed column
    echo "✅ Tilføjer completed kolonne...\n";
    $pdo->exec("
        ALTER TABLE recurring_task_completions 
        ADD COLUMN completed BOOLEAN DEFAULT FALSE AFTER completed_at
    ");
    echo "✅ completed kolonne tilføjet\n\n";
    
    // Opdater eksisterende rows - sæt completed=TRUE kun hvis der er tidtagning
    echo "📝 Opdaterer eksisterende completions...\n";
    $pdo->exec("
        UPDATE recurring_task_completions 
        SET completed = TRUE 
        WHERE time_spent > 0
    ");
    echo "✅ Eksisterende completions opdateret\n\n";
    
    echo "🎉 Migration gennemført succesfuldt!\n";
    echo "\n📝 Ændringer:\n";
    echo "  - completed kolonne tilføjet (BOOLEAN)\n";
    echo "  - Eksisterende completions med tidtagning markeret som completed\n";
    
} catch (PDOException $e) {
    echo "❌ Fejl: " . $e->getMessage() . "\n";
    exit(1);
}
?>
