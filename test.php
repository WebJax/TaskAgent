<?php
// test.php - Diagnosticering af hosting setup

echo "<h1>TaskAgent PHP Test</h1>";
echo "<h2>System Information</h2>";
echo "<p><strong>PHP Version:</strong> " . PHP_VERSION . "</p>";
echo "<p><strong>Server Software:</strong> " . $_SERVER['SERVER_SOFTWARE'] . "</p>";
echo "<p><strong>Document Root:</strong> " . $_SERVER['DOCUMENT_ROOT'] . "</p>";
echo "<p><strong>Current Directory:</strong> " . __DIR__ . "</p>";

echo "<h2>PHP Modules</h2>";
echo "<p><strong>PDO Available:</strong> " . (extension_loaded('pdo') ? 'Yes' : 'No') . "</p>";
echo "<p><strong>PDO MySQL:</strong> " . (extension_loaded('pdo_mysql') ? 'Yes' : 'No') . "</p>";
echo "<p><strong>Rewrite Module:</strong> " . (function_exists('apache_get_modules') && in_array('mod_rewrite', apache_get_modules()) ? 'Yes' : 'Unknown') . "</p>";

echo "<h2>Directory Structure</h2>";
$dirs = ['config', 'api', 'public'];
foreach($dirs as $dir) {
    echo "<p><strong>$dir/:</strong> " . (is_dir($dir) ? 'Exists' : 'Missing') . "</p>";
}

echo "<h2>Key Files</h2>";
$files = ['config/database.php', 'api/index.php', 'public/index.html'];
foreach($files as $file) {
    echo "<p><strong>$file:</strong> " . (file_exists($file) ? 'Exists' : 'Missing') . "</p>";
}

echo "<h2>Database Test</h2>";
try {
    require_once 'config/database.php';
    $db = getDB();
    echo "<p><strong>Database Connection:</strong> <span style='color: green;'>SUCCESS</span></p>";
    $tables = $db->query("SHOW TABLES");
    echo "<p><strong>Tables Found:</strong> " . count($tables) . "</p>";
} catch (Exception $e) {
    echo "<p><strong>Database Connection:</strong> <span style='color: red;'>FAILED - " . $e->getMessage() . "</span></p>";
}

echo "<h2>URL Tests</h2>";
echo "<p><a href='/api/clients'>Test API: /api/clients</a></p>";
echo "<p><a href='/public/index.html'>Test Frontend: /public/index.html</a></p>";
echo "<p><a href='/'>Test Root: /</a></p>";

?>
<style>
body { font-family: Arial, sans-serif; margin: 20px; }
h1 { color: #333; }
h2 { color: #666; border-bottom: 1px solid #ddd; }
p { margin: 5px 0; }
a { color: #007cba; }
</style>