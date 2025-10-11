<?php
// api/index.php - Main PHP API Router for TaskAgent

// Enable error reporting for development
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Set JSON response headers
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Include database connection
require_once dirname(__DIR__) . '/config/database.php';

// Parse request URI and method
$request_uri = $_SERVER['REQUEST_URI'];
$path = parse_url($request_uri, PHP_URL_PATH);
$path = str_replace('/api', '', $path); // Remove /api prefix
$method = $_SERVER['REQUEST_METHOD'];



// Parse input data
$input = json_decode(file_get_contents('php://input'), true);

try {
    $db = getDB();
    
    // Route the request
    switch (true) {
        // Root HTML routes
        case $path === '/':
        case $path === '':
            serveHTML('index.html');
            break;
            
        case $path === '/reports':
            serveHTML('reports.html');
            break;
            
        // CLIENT ROUTES
        case $path === '/clients' && $method === 'GET':
            handleGetClients($db);
            break;
            
        case $path === '/clients' && $method === 'POST':
            handleCreateClient($db, $input);
            break;
            
        case preg_match('/^\/clients\/(\d+)$/', $path, $matches) && $method === 'PUT':
            handleUpdateClient($db, $matches[1], $input);
            break;
            
        case preg_match('/^\/clients\/(\d+)$/', $path, $matches) && $method === 'DELETE':
            handleDeleteClient($db, $matches[1]);
            break;
            
        // PROJECT ROUTES  
        case $path === '/projects' && $method === 'GET':
            handleGetProjects($db);
            break;
            
        case $path === '/projects' && $method === 'POST':
            handleCreateProject($db, $input);
            break;
            
        case preg_match('/^\/projects\/(\d+)$/', $path, $matches) && $method === 'PUT':
            handleUpdateProject($db, $matches[1], $input);
            break;
            
        case preg_match('/^\/projects\/(\d+)$/', $path, $matches) && $method === 'DELETE':
            handleDeleteProject($db, $matches[1]);
            break;
            
        // TASK ROUTES
        case $path === '/tasks' && $method === 'GET':
            handleGetTasks($db);
            break;
            
        case $path === '/tasks' && $method === 'POST':
            handleCreateTask($db, $input);
            break;
            
        case preg_match('/^\/tasks\/(\d+)$/', $path, $matches) && $method === 'PUT':
            handleUpdateTask($db, $matches[1], $input);
            break;
            
        case preg_match('/^\/tasks\/(\d+)\/move$/', $path, $matches) && $method === 'PUT':
            handleMoveTask($db, $matches[1], $input);
            break;
            
        case preg_match('/^\/tasks\/(\d+)\/start$/', $path, $matches) && $method === 'POST':
            handleStartTask($db, $matches[1]);
            break;
            
        case preg_match('/^\/tasks\/(\d+)\/stop$/', $path, $matches) && $method === 'POST':
            handleStopTask($db, $matches[1]);
            break;
            
        case preg_match('/^\/tasks\/(\d+)\/start-recurring$/', $path, $matches) && $method === 'POST':
            handleStartRecurringTask($db, $matches[1], $input);
            break;
            
        case preg_match('/^\/tasks\/(\d+)\/stop-recurring$/', $path, $matches) && $method === 'POST':
            handleStopRecurringTask($db, $matches[1], $input);
            break;
            
        case preg_match('/^\/tasks\/(\d+)\/complete$/', $path, $matches) && $method === 'POST':
            handleCompleteTask($db, $matches[1]);
            break;
            
        case preg_match('/^\/tasks\/(\d+)\/uncomplete$/', $path, $matches) && $method === 'POST':
            handleUncompleteTask($db, $matches[1]);
            break;
            
        case preg_match('/^\/tasks\/(\d+)\/complete-recurring$/', $path, $matches) && $method === 'POST':
            handleCompleteRecurringTask($db, $matches[1], $input);
            break;
            
        case preg_match('/^\/tasks\/(\d+)\/uncomplete-recurring$/', $path, $matches) && $method === 'POST':
            handleUncompleteRecurringTask($db, $matches[1], $input);
            break;
            
        case preg_match('/^\/tasks\/(\d+)\/hide-recurring$/', $path, $matches) && $method === 'POST':
            handleHideRecurringTask($db, $matches[1], $input);
            break;
            
        case preg_match('/^\/tasks\/(\d+)\/end-recurrence$/', $path, $matches) && $method === 'DELETE':
            handleEndRecurrence($db, $matches[1], $_GET);
            break;
            
        case preg_match('/^\/tasks\/(\d+)$/', $path, $matches) && $method === 'DELETE':
            handleDeleteTask($db, $matches[1], $_GET);
            break;
            
        case $path === '/recurring-completions' && $method === 'GET':
            handleGetRecurringCompletions($db);
            break;
            
        case $path === '/hidden-dates' && $method === 'GET':
            handleGetHiddenDates($db);
            break;
            
        // REPORTS ROUTES
        case $path === '/reports/time' && $method === 'GET':
            handleTimeReport($db, $_GET);
            break;
            
        case $path === '/reports/projects' && $method === 'GET':
            handleProjectReport($db);
            break;
            
        case $path === '/reports/clients' && $method === 'GET':
            handleClientReport($db);
            break;
            
        case $path === '/reports/productivity' && $method === 'GET':
            handleProductivityReport($db);
            break;
            
        default:
            http_response_code(404);
            echo json_encode(['error' => 'Endpoint ikke fundet']);
            break;
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}

// Helper function to serve HTML files
function serveHTML($filename) {
    $filepath = '../public/' . $filename;
    if (file_exists($filepath)) {
        header('Content-Type: text/html');
        header('Cache-Control: no-cache, no-store, must-revalidate, max-age=0');
        header('Pragma: no-cache');
        header('Expires: 0');
        readfile($filepath);
    } else {
        http_response_code(404);
        echo json_encode(['error' => 'Fil ikke fundet']);
    }
}

// Set no-cache headers for API responses
function setNoCacheHeaders() {
    header('Cache-Control: no-cache, no-store, must-revalidate');
    header('Pragma: no-cache');
    header('Expires: 0');
}

// CLIENT HANDLERS
function handleGetClients($db) {
    setNoCacheHeaders();
    $clients = $db->query('SELECT * FROM clients ORDER BY name');
    echo json_encode($clients);
}

function handleCreateClient($db, $input) {
    if (empty($input['name'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Navn er påkrævet']);
        return;
    }
    
    $result = $db->execute('INSERT INTO clients (name) VALUES (?)', [$input['name']]);
    echo json_encode(['id' => $result['last_insert_id'], 'name' => $input['name']]);
}

function handleUpdateClient($db, $id, $input) {
    if (empty($input['name'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Navn er påkrævet']);
        return;
    }
    
    $result = $db->execute(
        'UPDATE clients SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [$input['name'], $id]
    );
    
    if ($result['affected_rows'] === 0) {
        http_response_code(404);
        echo json_encode(['error' => 'Kunde ikke fundet']);
        return;
    }
    
    echo json_encode(['id' => (int)$id, 'name' => $input['name']]);
}

function handleDeleteClient($db, $id) {
    try {
        $pdo = $db->getConnection();
        
        // Check if client has projects and update them
        $stmt = $pdo->prepare('SELECT id FROM projects WHERE client_id = ?');
        $stmt->execute([$id]);
        $projects = $stmt->fetchAll();
        
        if (!empty($projects)) {
            $stmt = $pdo->prepare('UPDATE projects SET client_id = NULL WHERE client_id = ?');
            $stmt->execute([$id]);
        }
        
        $stmt = $pdo->prepare('DELETE FROM clients WHERE id = ?');
        $stmt->execute([$id]);
        
        if ($stmt->rowCount() === 0) {
            http_response_code(404);
            echo json_encode(['error' => 'Kunde ikke fundet']);
            return;
        }
        
        echo json_encode(['message' => 'Kunde slettet succesfuldt']);
    } catch (Exception $e) {
        error_log("Delete client error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Database fejl: ' . $e->getMessage()]);
    }
}

// PROJECT HANDLERS
function handleGetProjects($db) {
    setNoCacheHeaders();
    $projects = $db->query("
        SELECT p.*, c.name as client_name 
        FROM projects p 
        LEFT JOIN clients c ON p.client_id = c.id 
        ORDER BY p.name
    ");
    echo json_encode($projects);
}

function handleCreateProject($db, $input) {
    if (empty($input['name'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Navn er påkrævet']);
        return;
    }
    
    $client_id = isset($input['client_id']) ? $input['client_id'] : null;
    $result = $db->execute(
        'INSERT INTO projects (name, client_id) VALUES (?, ?)',
        [$input['name'], $client_id]
    );
    
    echo json_encode([
        'id' => $result['last_insert_id'], 
        'name' => $input['name'], 
        'client_id' => $client_id
    ]);
}

function handleUpdateProject($db, $id, $input) {
    if (empty($input['name'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Navn er påkrævet']);
        return;
    }
    
    $client_id = isset($input['client_id']) ? $input['client_id'] : null;
    $result = $db->execute(
        'UPDATE projects SET name = ?, client_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [$input['name'], $client_id, $id]
    );
    
    if ($result['affected_rows'] === 0) {
        http_response_code(404);
        echo json_encode(['error' => 'Projekt ikke fundet']);
        return;
    }
    
    echo json_encode(['id' => (int)$id, 'name' => $input['name'], 'client_id' => $client_id]);
}

function handleDeleteProject($db, $id) {
    // Check if project has tasks and update them
    $tasks = $db->query('SELECT id FROM tasks WHERE project_id = ?', [$id]);
    if (!empty($tasks)) {
        $db->execute('UPDATE tasks SET project_id = NULL WHERE project_id = ?', [$id]);
    }
    
    $result = $db->execute('DELETE FROM projects WHERE id = ?', [$id]);
    
    if ($result['affected_rows'] === 0) {
        http_response_code(404);
        echo json_encode(['error' => 'Projekt ikke fundet']);
        return;
    }
    
    echo json_encode(['message' => 'Projekt slettet succesfuldt']);
}

// TASK HANDLERS
function handleGetTasks($db) {
    setNoCacheHeaders();
    $tasks = $db->query("
        SELECT t.*, p.name as project_name, c.name as client_name
        FROM tasks t
        LEFT JOIN projects p ON t.project_id = p.id
        LEFT JOIN clients c ON p.client_id = c.id
        ORDER BY t.created_at DESC
    ");
    echo json_encode($tasks);
}

function handleCreateTask($db, $input) {
    setNoCacheHeaders();
    
    if (empty($input['title'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Titel er påkrævet']);
        return;
    }
    
    try {
        $project_id = isset($input['project_id']) ? $input['project_id'] : null;
        $notes = isset($input['notes']) ? $input['notes'] : null;
        $is_recurring = isset($input['is_recurring']) ? (int)$input['is_recurring'] : 0;
        $recurrence_type = isset($input['recurrence_type']) ? $input['recurrence_type'] : null;
        $recurrence_interval = isset($input['recurrence_interval']) ? $input['recurrence_interval'] : 1;
        $next_occurrence = isset($input['next_occurrence']) ? $input['next_occurrence'] : null;
        $start_date = isset($input['start_date']) ? $input['start_date'] : date('Y-m-d');  // Brug modtaget dato eller dagens dato
        
        // Use direct PDO for debugging
        $pdo = $db->getConnection();
        $stmt = $pdo->prepare('INSERT INTO tasks (title, notes, project_id, is_recurring, recurrence_type, recurrence_interval, next_occurrence, start_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
        $stmt->execute([$input['title'], $notes, $project_id, $is_recurring, $recurrence_type, $recurrence_interval, $next_occurrence, $start_date]);
        $lastId = $pdo->lastInsertId();
    } catch (Exception $e) {
        error_log("Create task error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Database fejl: ' . $e->getMessage()]);
        return;
    }
    
    echo json_encode([
        'id' => $lastId,
        'title' => $input['title'],
        'project_id' => $project_id,
        'is_recurring' => $is_recurring,
        'recurrence_type' => $recurrence_type,
        'recurrence_interval' => $recurrence_interval,
        'next_occurrence' => $next_occurrence
    ]);
}

function handleUpdateTask($db, $id, $input) {
    if (empty($input['title'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Titel er påkrævet']);
        return;
    }
    
    try {
        $pdo = $db->getConnection();
        $notes = isset($input['notes']) ? $input['notes'] : null;
        $project_id = isset($input['project_id']) ? $input['project_id'] : null;
        $completed = isset($input['completed']) ? (int)$input['completed'] : 0;
        
        $stmt = $pdo->prepare('UPDATE tasks SET title = ?, notes = ?, project_id = ?, completed = ? WHERE id = ?');
        $stmt->execute([$input['title'], $notes, $project_id, $completed, $id]);
        
        if ($stmt->rowCount() === 0) {
            http_response_code(404);
            echo json_encode(['error' => 'Opgave ikke fundet']);
            return;
        }
        
        echo json_encode(['id' => (int)$id, 'title' => $input['title'], 'notes' => $notes, 'project_id' => $project_id, 'completed' => $completed]);
    } catch (Exception $e) {
        error_log("Update task error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Database fejl: ' . $e->getMessage()]);
    }
}

function handleMoveTask($db, $id, $input) {
    setNoCacheHeaders();
    
    if (empty($input['newDate'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Ny dato er påkrævet']);
        return;
    }
    
    // Validate date format
    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $input['newDate'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Ugyldig datoformat. Brug YYYY-MM-DD']);
        return;
    }
    
    $result = $db->execute('UPDATE tasks SET start_date = ? WHERE id = ?', [$input['newDate'], $id]);
    
    if ($result['affected_rows'] === 0) {
        http_response_code(404);
        echo json_encode(['error' => 'Opgave ikke fundet']);
        return;
    }
    
    echo json_encode([
        'success' => true,
        'id' => (int)$id,
        'newDate' => $input['newDate'],
        'message' => 'Opgave flyttet til ny dato'
    ]);
}

function handleStartTask($db, $id) {
    try {
        $pdo = $db->getConnection();
        $stmt = $pdo->prepare('UPDATE tasks SET last_start = NOW() WHERE id = ?');
        $stmt->execute([$id]);
        echo json_encode(['status' => 'started', 'id' => $id]);
    } catch (Exception $e) {
        error_log("Start task error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Database fejl: ' . $e->getMessage()]);
    }
}

function handleStopTask($db, $id) {
    try {
        $pdo = $db->getConnection();
        
        // Update time_spent and get the new value
        $stmt = $pdo->prepare("
            UPDATE tasks
            SET time_spent = time_spent + TIMESTAMPDIFF(SECOND, last_start, NOW()),
                last_start = NULL
            WHERE id = ?
        ");
        $stmt->execute([$id]);
        
        // Get the updated time_spent
        $stmt = $pdo->prepare("SELECT time_spent FROM tasks WHERE id = ?");
        $stmt->execute([$id]);
        $result = $stmt->fetch();
        
        echo json_encode([
            'status' => 'stopped', 
            'id' => $id,
            'time_spent' => $result ? (int)$result['time_spent'] : 0
        ]);
    } catch (Exception $e) {
        error_log("Stop task error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Database fejl: ' . $e->getMessage()]);
    }
}

function handleStartRecurringTask($db, $id, $input) {
    if (empty($input['completion_date'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Completion date er påkrævet']);
        return;
    }
    
    try {
        $pdo = $db->getConnection();
        
        // Insert or update - explicitly set completed = FALSE when starting timer
        // This ensures that starting a timer doesn't accidentally mark task as complete
        $stmt = $pdo->prepare("
            INSERT INTO recurring_task_completions (task_id, completion_date, last_start, completed) 
            VALUES (?, ?, NOW(), FALSE) 
            ON DUPLICATE KEY UPDATE last_start = NOW(), completed = FALSE
        ");
        $stmt->execute([$id, $input['completion_date']]);
        
        echo json_encode(['status' => 'started', 'taskId' => $id, 'completionDate' => $input['completion_date']]);
    } catch (Exception $e) {
        error_log("Start recurring task error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Database fejl: ' . $e->getMessage()]);
    }
}

function handleStopRecurringTask($db, $id, $input) {
    if (empty($input['completion_date'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Completion date er påkrævet']);
        return;
    }
    
    try {
        $pdo = $db->getConnection();
        
        // Update time_spent
        $stmt = $pdo->prepare("
            UPDATE recurring_task_completions
            SET time_spent = COALESCE(time_spent, 0) + TIMESTAMPDIFF(SECOND, last_start, NOW()),
                last_start = NULL
            WHERE task_id = ? AND completion_date = ? AND last_start IS NOT NULL
        ");
        $stmt->execute([$id, $input['completion_date']]);
        
        // Get the updated time_spent
        $stmt = $pdo->prepare("
            SELECT time_spent 
            FROM recurring_task_completions 
            WHERE task_id = ? AND completion_date = ?
        ");
        $stmt->execute([$id, $input['completion_date']]);
        $result = $stmt->fetch();
        
        echo json_encode([
            'status' => 'stopped', 
            'taskId' => $id, 
            'completionDate' => $input['completion_date'],
            'time_spent' => $result ? (int)$result['time_spent'] : 0
        ]);
    } catch (Exception $e) {
        error_log("Stop recurring task error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Database fejl: ' . $e->getMessage()]);
    }
}

function handleCompleteTask($db, $id) {
    // Get task details first
    $tasks = $db->query('SELECT * FROM tasks WHERE id = ?', [$id]);
    
    if (empty($tasks)) {
        http_response_code(404);
        echo json_encode(['error' => 'Opgave ikke fundet']);
        return;
    }
    
    $task = $tasks[0];
    
    // Stop timer if running
    if ($task['last_start']) {
        $db->execute("
            UPDATE tasks
            SET time_spent = time_spent + TIMESTAMPDIFF(SECOND, last_start, NOW()),
                last_start = NULL
            WHERE id = ?
        ", [$id]);
    }
    
    // Mark as completed
    $db->execute("
        UPDATE tasks 
        SET completed = TRUE, 
            completed_at = CURRENT_TIMESTAMP
        WHERE id = ?
    ", [$id]);
    
    // If recurring, create new task
    $newTaskId = null;
    if (!empty($task['repeat_interval'])) {
        $result = $db->execute("
            INSERT INTO tasks (title, project_id, repeat_interval, time_spent, completed, completed_at)
            VALUES (?, ?, ?, 0, FALSE, NULL)
        ", [$task['title'], $task['project_id'], $task['repeat_interval']]);
        $newTaskId = $result['last_insert_id'];
    }
    
    echo json_encode([
        'status' => 'completed',
        'id' => (int)$id,
        'newTaskId' => $newTaskId,
        'wasRepeating' => !empty($task['repeat_interval'])
    ]);
}

function handleUncompleteTask($db, $id) {
    $db->execute("
        UPDATE tasks 
        SET completed = FALSE, 
            completed_at = NULL
        WHERE id = ?
    ", [$id]);
    
    echo json_encode(['status' => 'uncompleted', 'id' => (int)$id]);
}

function handleCompleteRecurringTask($db, $id, $input) {
    $date = $input['date'];
    
    try {
        $pdo = $db->getConnection();
        
        // Insert or update with completed=TRUE
        $stmt = $pdo->prepare("
            INSERT INTO recurring_task_completions (task_id, completion_date, completed_at, completed) 
            VALUES (?, ?, NOW(), TRUE) 
            ON DUPLICATE KEY UPDATE completed_at = NOW(), completed = TRUE
        ");
        $stmt->execute([$id, $date]);
        
        echo json_encode(['success' => true]);
    } catch (Exception $e) {
        error_log("Complete recurring task error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Database fejl: ' . $e->getMessage()]);
    }
}

function handleUncompleteRecurringTask($db, $id, $input) {
    $date = $input['date'];
    
    try {
        $pdo = $db->getConnection();
        
        // Check if there's time spent on this completion
        $stmt = $pdo->prepare("
            SELECT time_spent FROM recurring_task_completions 
            WHERE task_id = ? AND completion_date = ?
        ");
        $stmt->execute([$id, $date]);
        $result = $stmt->fetch();
        
        if ($result && $result['time_spent'] > 0) {
            // If there's time spent, just mark as not completed but keep the record
            $stmt = $pdo->prepare("
                UPDATE recurring_task_completions 
                SET completed = FALSE, completed_at = NULL 
                WHERE task_id = ? AND completion_date = ?
            ");
            $stmt->execute([$id, $date]);
        } else {
            // If no time spent, delete the record
            $stmt = $pdo->prepare("
                DELETE FROM recurring_task_completions 
                WHERE task_id = ? AND completion_date = ?
            ");
            $stmt->execute([$id, $date]);
        }
        
        echo json_encode(['success' => true]);
    } catch (Exception $e) {
        error_log("Uncomplete recurring task error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Database fejl: ' . $e->getMessage()]);
    }
}

function handleDeleteTask($db, $id, $params = []) {
    $deleteAll = isset($params['delete_all']) && $params['delete_all'] === 'true';
    
    if ($deleteAll) {
        // Delete everything - task and all related data
        $db->execute('DELETE FROM tasks WHERE id = ?', [$id]);
    } else {
        // Normal delete (only if not recurring with history)
        $db->execute('DELETE FROM tasks WHERE id = ?', [$id]);
    }
    
    echo json_encode(['status' => 'deleted', 'id' => $id]);
}

function handleHideRecurringTask($db, $id, $input) {
    if (empty($input['date'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Date er påkrævet']);
        return;
    }
    
    try {
        $pdo = $db->getConnection();
        
        // Insert into hidden dates table
        $stmt = $pdo->prepare("
            INSERT IGNORE INTO recurring_task_hidden_dates (task_id, hidden_date) 
            VALUES (?, ?)
        ");
        $stmt->execute([$id, $input['date']]);
        
        echo json_encode(['status' => 'hidden', 'taskId' => $id, 'date' => $input['date']]);
    } catch (Exception $e) {
        error_log("Hide recurring task error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Database fejl: ' . $e->getMessage()]);
    }
}

function handleEndRecurrence($db, $id, $params) {
    if (empty($params['end_date'])) {
        http_response_code(400);
        echo json_encode(['error' => 'End date er påkrævet']);
        return;
    }
    
    try {
        $pdo = $db->getConnection();
        
        // Set end_date to stop future recurrences
        $stmt = $pdo->prepare("UPDATE tasks SET end_date = ? WHERE id = ?");
        $stmt->execute([$params['end_date'], $id]);
        
        echo json_encode(['status' => 'ended', 'taskId' => $id, 'endDate' => $params['end_date']]);
    } catch (Exception $e) {
        error_log("End recurrence error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Database fejl: ' . $e->getMessage()]);
    }
}

function handleGetRecurringCompletions($db) {
    setNoCacheHeaders();
    $completions = $db->query('SELECT * FROM recurring_task_completions ORDER BY completion_date DESC');
    echo json_encode($completions);
}

function handleGetHiddenDates($db) {
    setNoCacheHeaders();
    $hiddenDates = $db->query('SELECT * FROM recurring_task_hidden_dates ORDER BY hidden_date DESC');
    echo json_encode($hiddenDates);
}

// REPORT HANDLERS
function handleTimeReport($db, $params) {
    $period = isset($params['period']) ? $params['period'] : 'week';
    $start_date = isset($params['start_date']) ? $params['start_date'] : null;
    $end_date = isset($params['end_date']) ? $params['end_date'] : null;
    
    $dateFilter = '';
    
    if ($start_date && $end_date) {
        $dateFilter = "AND DATE(t.created_at) BETWEEN '$start_date' AND '$end_date'";
    } else {
        switch($period) {
            case 'today':
                $dateFilter = 'AND DATE(t.created_at) = CURDATE()';
                break;
            case 'week':
                $dateFilter = 'AND YEARWEEK(t.created_at) = YEARWEEK(NOW())';
                break;
            case 'month':
                $dateFilter = 'AND YEAR(t.created_at) = YEAR(NOW()) AND MONTH(t.created_at) = MONTH(NOW())';
                break;
        }
    }
    
    $report = $db->query("
        SELECT 
            t.id, t.title, t.time_spent,
            p.name as project_name,
            c.name as client_name,
            DATE(t.created_at) as date
        FROM tasks t
        LEFT JOIN projects p ON t.project_id = p.id
        LEFT JOIN clients c ON p.client_id = c.id
        WHERE t.time_spent > 0 $dateFilter
        ORDER BY t.created_at DESC
    ");
    
    echo json_encode($report);
}

function handleProjectReport($db) {
    $report = $db->query("
        SELECT 
            p.id, p.name as project_name,
            c.name as client_name,
            COUNT(t.id) as task_count,
            SUM(t.time_spent) as total_time,
            AVG(t.time_spent) as avg_time_per_task,
            MIN(t.created_at) as first_task,
            MAX(t.created_at) as last_activity
        FROM projects p
        LEFT JOIN clients c ON p.client_id = c.id
        LEFT JOIN tasks t ON p.id = t.project_id
        GROUP BY p.id, p.name, c.name
        HAVING task_count > 0
        ORDER BY total_time DESC
    ");
    
    echo json_encode($report);
}

function handleClientReport($db) {
    $report = $db->query("
        SELECT 
            c.id, c.name as client_name,
            COUNT(DISTINCT p.id) as project_count,
            COUNT(t.id) as task_count,
            SUM(t.time_spent) as total_time,
            AVG(t.time_spent) as avg_time_per_task
        FROM clients c
        LEFT JOIN projects p ON c.id = p.client_id
        LEFT JOIN tasks t ON p.id = t.project_id
        GROUP BY c.id, c.name
        HAVING task_count > 0
        ORDER BY total_time DESC
    ");
    
    echo json_encode($report);
}

function handleProductivityReport($db) {
    $stats = $db->query("
        SELECT 
            COUNT(id) as total_tasks,
            SUM(time_spent) as total_time,
            AVG(time_spent) as avg_task_time,
            COUNT(CASE WHEN time_spent > 0 THEN 1 END) as completed_tasks,
            COUNT(CASE WHEN last_start IS NOT NULL THEN 1 END) as active_tasks,
            COUNT(CASE WHEN DATE(created_at) = CURDATE() THEN 1 END) as tasks_today,
            COUNT(CASE WHEN YEARWEEK(created_at) = YEARWEEK(NOW()) THEN 1 END) as tasks_this_week
        FROM tasks
    ");
    
    $dailyStats = $db->query("
        SELECT 
            DATE(created_at) as date,
            COUNT(id) as tasks_worked,
            SUM(time_spent) as time_spent,
            COUNT(DISTINCT 
                CASE WHEN project_id IS NOT NULL THEN project_id END
            ) as projects_active
        FROM tasks 
        WHERE time_spent > 0 
            AND created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        GROUP BY DATE(created_at)
        ORDER BY date DESC
        LIMIT 30
    ");
    
    $timeDistribution = $db->query("
        SELECT 
            HOUR(created_at) as hour,
            SUM(time_spent) as time_spent,
            COUNT(id) as task_count
        FROM tasks 
        WHERE time_spent > 0 
            AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        GROUP BY HOUR(created_at)
        ORDER BY hour
    ");
    
    echo json_encode([
        'summary' => $stats[0],
        'daily_trends' => $dailyStats,
        'hourly_distribution' => $timeDistribution
    ]);
}
?>