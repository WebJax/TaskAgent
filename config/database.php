<?php
// config/database.php - PHP Database Connection for TaskAgent

class Database {
    private static $instance = null;
    private $connection;
    
    private function __construct() {
        try {
            // Environment-aware database configuration
            $isProduction = isset($_SERVER['HTTP_HOST']) && 
                          ($_SERVER['HTTP_HOST'] === 'taskagent.jaxweb.dk' || 
                           strpos($_SERVER['HTTP_HOST'], 'unoeuro.com') !== false ||
                           strpos($_SERVER['HTTP_HOST'], 'simply.com') !== false);
            
            if ($isProduction) {
                // Production database (Simply.com hosting)
                $dsn = "mysql:host=mysql58.unoeuro.com;port=3306;dbname=jaxweb_dk_db;charset=utf8mb4";
                $username = 'jaxweb_dk';
                $password = 'zh9ktrcp';
            } else {
                // Local development database
                $dsn = "mysql:host=127.0.0.1;port=3306;dbname=opgavestyring;charset=utf8mb4";
                $username = 'root';
                $password = '2010Thuva';
            }
            
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4"
            ];
            
            $this->connection = new PDO($dsn, $username, $password, $options);
            
        } catch (PDOException $e) {
            error_log("Database Connection Error: " . $e->getMessage());
            
            // If local development fails, try with production credentials
            if (!isset($isProduction) || !$isProduction) {
                error_log("Local database unavailable, falling back to production");
                try {
                    $dsn = "mysql:host=mysql58.unoeuro.com;port=3306;dbname=jaxweb_dk_db;charset=utf8mb4";
                    $this->connection = new PDO($dsn, 'jaxweb_dk', 'zh9ktrcp', $options);
                } catch (PDOException $e2) {
                    error_log("Production database also unavailable: " . $e2->getMessage());
                    throw new Exception("Database forbindelsesfejl: Ingen tilgængelige databaser");
                }
            } else {
                throw new Exception("Database forbindelsesfejl: Kan ikke oprette forbindelse til databasen");
            }
        }
    }
    
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    public function getConnection() {
        return $this->connection;
    }
    
    // Helper method for SELECT queries
    public function query($sql, $params = []) {
        try {
            $stmt = $this->connection->prepare($sql);
            $stmt->execute($params);
            return $stmt->fetchAll();
        } catch (PDOException $e) {
            error_log("Query Error: " . $e->getMessage());
            throw new Exception("Database forespørgsel fejlede");
        }
    }
    
    // Helper method for INSERT/UPDATE/DELETE
    public function execute($sql, $params = []) {
        try {
            $stmt = $this->connection->prepare($sql);
            $result = $stmt->execute($params);
            return [
                'success' => $result,
                'affected_rows' => $stmt->rowCount(),
                'last_insert_id' => $this->connection->lastInsertId()
            ];
        } catch (PDOException $e) {
            error_log("Execute Error: " . $e->getMessage());
            throw new Exception("Database operation fejlede");
        }
    }
}

// Function to get database instance (for convenience)
function getDB() {
    return Database::getInstance();
}
?>