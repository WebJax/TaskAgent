# TaskAgent - Copilot Instructions

## Project Overview

TaskAgent is a sophisticated task management web application built with Node.js/Fastify backend and vanilla JavaScript frontend. The system specializes in recurring task management, time tracking, and comprehensive reporting with a Danish user interface.

## Architecture Patterns

### Backend Structure
- **Framework**: Fastify with ES modules (`"type": "module"` in package.json)
- **Database**: MySQL with connection pooling using mysql2/promise
- **API Design**: RESTful endpoints with consistent JSON responses
- **Migration System**: Incremental database migrations with descriptive filenames
- **Development**: No-cache headers for static files during development

### Frontend Architecture
- **Pattern**: Single-class applications (TaskAgent, ReportsApp)
- **DOM Manipulation**: Vanilla JavaScript with querySelector/getElementById
- **State Management**: Class properties with manual state synchronization
- **API Communication**: Fetch API with async/await patterns
- **UI Updates**: Direct DOM manipulation, no virtual DOM

### Database Schema Conventions
```sql
-- Primary tables with standard fields
CREATE TABLE table_name (
    id INT AUTO_INCREMENT PRIMARY KEY,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Recurring task pattern with separate completion tracking
CREATE TABLE recurring_task_completions (
    task_id INT NOT NULL,
    completion_date DATE NOT NULL,
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_task_date (task_id, completion_date)
);
```

## Core Domain Patterns

### Recurring Task Logic
Tasks can be recurring with sophisticated date calculation logic:
- **Types**: daily, weekly, monthly, yearly with configurable intervals
- **Date Fields**: Use `start_date` for recurring logic, not `created_at`
- **Completion Tracking**: Separate table for date-specific completions
- **Display Logic**: `shouldShowRecurringTask()` method handles complex date math

```javascript
// Example recurring task check
shouldShowRecurringTask(task, targetDate) {
    const startDate = new Date(task.start_date || task.created_at);
    const checkDate = new Date(targetDate);
    
    switch (task.recurrence_type) {
        case 'daily':
            const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
            return daysDiff % task.recurrence_interval === 0;
        // ... other types
    }
}
```

### Timer System Pattern
- **State Management**: Active task ID with start time tracking
- **Real-time Updates**: setInterval for display updates
- **Persistence**: Server-side timer start/stop endpoints
- **Visual Feedback**: CSS classes for active states

### Date Navigation
- **Week-based**: Monday-Sunday date bar with navigation arrows  
- **State Sync**: weekStartDate and selectedDate properties
- **Visual Indicators**: Active date highlighting with CSS

## API Conventions

### Endpoint Patterns
```javascript
// CRUD Operations
GET    /tasks              // List with optional filtering
POST   /tasks              // Create new
PUT    /tasks/:id          // Update existing
DELETE /tasks/:id          // Delete

// Timer Operations  
POST   /tasks/:id/start    // Start timer
POST   /tasks/:id/stop     // Stop timer

// Recurring Task Completions
POST   /tasks/:id/complete-recurring     // Mark complete for date
POST   /tasks/:id/uncomplete-recurring   // Unmark complete for date
GET    /recurring-completions            // List all completions
```

### Response Patterns
```javascript
// Success responses
{ success: true, data: [...] }

// Error responses  
{ error: "Beskrivende fejlbesked på dansk" }

// Timer responses
{ 
    status: 'started|stopped',
    activeTaskId: number,
    timeSpent: number 
}
```

## UI/UX Patterns

### Danish Language
- All user-facing text in Danish
- Error messages in Danish
- Date formats: 'da-DK' locale
- Time display: HH:MM:SS format

### Component Patterns
```javascript
// Standard render method pattern
renderTasks() {
    const filteredTasks = this.applyFilters();
    const taskList = document.getElementById('taskList');
    taskList.innerHTML = '';
    
    filteredTasks.forEach(task => {
        const li = document.createElement('li');
        li.innerHTML = this.generateTaskHTML(task);
        taskList.appendChild(li);
    });
}
```

### Form Handling
- Show/hide patterns for dynamic forms
- Form validation before submission
- Reset forms after successful operations
- Real-time preview for recurring tasks

### State Management
```javascript
class TaskAgent {
    constructor() {
        // State properties
        this.tasks = [];
        this.selectedDate = new Date();
        this.activeTaskId = null;
        this.currentFilter = 'all';
        
        this.init();
    }
    
    async init() {
        // Load data and setup UI
        await this.loadData();
        this.setupEventListeners();
        this.render();
    }
}
```

## Development Workflow

### Migration Pattern
1. Create migration file: `migrate-add-feature.js`
2. Import mysql connection from `db.js`
3. Use descriptive console.log messages
4. Handle errors with process.exit(1)
5. Run manually: `node migrate-add-feature.js`

### Database Setup
- Clean setup: `setup-database-clean.js` 
- Development data: Include realistic test data
- Indexes: Add for commonly queried fields
- Foreign keys: Proper cascade relationships

### File Organization
```
/
├── server.js              # Main Fastify server
├── db.js                  # Database connection
├── package.json           # Dependencies and scripts  
├── migrate-*.js           # Database migrations
├── setup-database*.js     # Database initialization
└── public/
    ├── app.js             # Main TaskAgent class
    ├── reports.js         # ReportsApp class
    ├── index.html         # Main UI
    └── reports.html       # Reports UI
```

## Testing Strategies

### Manual Testing Flow
1. Server restart: `npm start`
2. Browser hard refresh (Cmd+Shift+R)
3. Database state verification via API
4. Timer functionality testing
5. Date navigation validation

### Debug Patterns
- Console.error for all catch blocks
- Descriptive error messages in Danish
- API response status code checking
- State logging before/after operations

## Performance Considerations

### Efficient Data Loading
```javascript
// Load related data in parallel
const [clients, projects, tasks, completions] = await Promise.all([
    this.loadClients(),
    this.loadProjects(), 
    this.loadTasks(),
    this.loadRecurringCompletions()
]);
```

### DOM Updates
- Batch DOM changes when possible
- Use DocumentFragment for multiple insertions
- Cache frequently accessed elements
- Minimize reflows during timer updates

## Security Patterns

### Input Validation
- Validate all user inputs on server-side
- Use parameterized queries for SQL
- Sanitize HTML content before display
- Validate date ranges and formats

### Error Handling
```javascript
try {
    const response = await fetch('/api/endpoint');
    if (!response.ok) {
        throw new Error('API error');
    }
    const data = await response.json();
    // Process data
} catch (error) {
    console.error('Operation failed:', error);
    // Show user-friendly error
}
```

## Extension Guidelines

### Adding New Features
1. Follow existing class patterns
2. Add API endpoints to server.js
3. Update database schema with migrations
4. Implement client-side state management
5. Add Danish language UI text
6. Test recurring task compatibility

### Code Style
- Use async/await over Promise chains
- Descriptive variable names in English
- Comments and UI text in Danish
- ES6+ features consistently
- 4-space indentation

### Database Changes
- Always create migration scripts
- Maintain foreign key integrity  
- Add appropriate indexes
- Document schema changes
- Test with existing data

## Common Pitfalls

1. **Browser Cache**: Always add no-cache headers during development
2. **Date Handling**: Use start_date for recurring logic, not created_at
3. **Timer State**: Clear intervals when stopping timers
4. **Async Operations**: Always await database operations
5. **Danish Text**: Keep all user-facing content in Danish
6. **Error Handling**: Catch and log all async operations

## Recurring Task Implementation Notes

The recurring task system is the most complex part:
- Separate completion tracking table prevents data duplication
- Date-specific completions allow per-date status
- Complex date math in `shouldShowRecurringTask()`
- Proper interval calculations for all recurrence types
- Visual indicators for recurring vs. normal tasks

This documentation should guide AI coding agents to maintain consistency with existing patterns and architectural decisions.
