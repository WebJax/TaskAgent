class TaskAgent {
    constructor() {
        this.tasks = [];
        this.projects = [];
        this.clients = [];
        this.recurringCompletions = [];
        this.hiddenDates = []; // Hidden dates for recurring tasks
        this.selectedDate = new Date();
        this.weekStartDate = new Date();
        this.activeTimer = null;
        this.currentView = 'tasks';
        this.searchQuery = '';
        this.isTimerRunning = false;
        this.timerInterval = null;
        this.timerStartTime = null;
        this.activeTaskId = null;
        
        // Form functionality
        this.formMode = 'add'; // 'add', 'edit', 'delete', 'move'
        this.currentTaskId = null;
        
        // Pause functionality
        this.isPaused = false;
        this.pauseInterval = null;
        this.pauseStartTime = null;
        this.pauseDuration = 0; // in minutes
        
        // Timer timeout functionality
        this.timerTimeoutCheck = null;
        this.timerTimeoutWarning = null;
        
        // Pomodoro functionality
        this.pomodoroActive = false;
        this.pomodoroTimer = null;
        this.pomodoroTimeLeft = 25 * 60; // 25 minutes in seconds
        this.pomodoroSession = 1; // Current session (1-4)
        this.pomodoroType = 'work'; // 'work', 'shortBreak', 'longBreak'
        this.pomodoroSettings = {
            work: 25 * 60, // 25 minutes
            shortBreak: 5 * 60, // 5 minutes
            longBreak: 15 * 60 // 15 minutes
        };
        
        // PWA functionality
        this.deferredPrompt = null;
        this.isInstalled = false;
        
        this.init();
    }
    
    async init() {
        this.initializeEventListeners();
        await this.loadClients();
        await this.loadProjects();
        await this.loadHiddenDates();
        await this.loadTasks();
        this.updateDateDisplay();
        this.initializePWA();
        this.initializePomodoro();
        this.initializeLucideIcons();
    }
    
    initializePWA() {
        // Register service worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                })
                .catch(error => {
                });
        }
        
        // Handle PWA installation prompt
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
            this.showInstallButton();
        });
        
        // Handle PWA installation
        window.addEventListener('appinstalled', () => {
            this.isInstalled = true;
            this.hideInstallButton();
            this.showInstallSuccessMessage();
        });
        
        // Check if already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            this.isInstalled = true;
        }
        
        // Handle URL parameters for shortcuts
        this.handleShortcutActions();
        
        // Note: Notification permission will be requested when user starts a timer
        // This ensures it's triggered by a user gesture
    }
    
    initializePomodoro() {
        // Initialize pomodoro display
        this.updatePomodoroDisplay();
        this.updateSessionDots();
        
        // Handle modal clicks (close when clicking outside)
        document.getElementById('pomodoroModal').addEventListener('click', (e) => {
            if (e.target.id === 'pomodoroModal') {
                this.closePomodoro();
            }
        });
        
        // Handle escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && document.getElementById('pomodoroModal').style.display === 'flex') {
                this.closePomodoro();
            }
        });
        
        // Initialize session counter display
        document.getElementById('currentSession').textContent = this.pomodoroSession;
    }
    
    // Integration with task timer
    async startPomodoroWithTask(taskId) {
        // Start regular timer for the task
        await this.startTimer(taskId);
        
        // Open pomodoro modal
        this.openPomodoro();
        
        // Start pomodoro timer
        this.startPomodoro();
    }
    
    // Override completePomodoroSession to handle task integration
    async onPomodoroWorkComplete() {
        // If a task timer is running, this session counts as work time
        if (this.activeTaskId && this.pomodoroType === 'work') {
            // The regular task timer continues running, 
            // so the 25 minutes will be automatically logged
            console.log(`Pomodoro work session completed for task ${this.activeTaskId}`);
        }
    }


    
    showInstallButton() {
        // Add install button to header if not already installed
        if (!this.isInstalled && !document.getElementById('installBtn')) {
            const header = document.querySelector('.header');
            const installBtn = document.createElement('button');
            installBtn.id = 'installBtn';
            installBtn.className = 'install-btn';
            installBtn.innerHTML = '<i data-lucide="download"></i>';
            installBtn.title = 'Installer som app';
            installBtn.onclick = () => this.installPWA();
            
            // Insert before pause button
            const pauseBtn = header.querySelector('.pause-btn');
            header.insertBefore(installBtn, pauseBtn);
            
            this.initializeLucideIcons();
        }
    }
    
    hideInstallButton() {
        const installBtn = document.getElementById('installBtn');
        if (installBtn) {
            installBtn.remove();
        }
    }
    
    async installPWA() {
        if (!this.deferredPrompt) return;
        
        this.deferredPrompt.prompt();
        const { outcome } = await this.deferredPrompt.userChoice;
        
        this.deferredPrompt = null;
        this.hideInstallButton();
    }
    
    showInstallSuccessMessage() {
        // Show brief success message
        const message = document.createElement('div');
        message.className = 'install-success';
        message.textContent = '✅ App installeret! Find den i din Dock';
        message.style.cssText = `
            position: fixed;
            top: 80px;
            left: 50%;
            transform: translateX(-50%);
            background: #48bb78;
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            font-size: 14px;
            z-index: 1001;
            animation: slideDown 0.3s ease;
        `;
        
        document.body.appendChild(message);
        
        setTimeout(() => {
            message.remove();
        }, 4000);
    }
    
    handleShortcutActions() {
        const urlParams = new URLSearchParams(window.location.search);
        const action = urlParams.get('action');
        
        switch (action) {
            case 'new-task':
                setTimeout(() => this.showAddTaskForm(), 500);
                break;
            case 'pause':
                setTimeout(() => this.startPause(), 500);
                break;
        }
        
        // Clean up URL
        if (action) {
            history.replaceState({}, document.title, window.location.pathname);
        }
    }
    
    async requestNotificationPermission() {
        if ('Notification' in window && 'serviceWorker' in navigator) {
            const permission = await Notification.requestPermission();
        }
    }
    
    showNotification(title, options = {}) {
        if ('serviceWorker' in navigator && Notification.permission === 'granted') {
            navigator.serviceWorker.ready.then(registration => {
                registration.showNotification(title, {
                    icon: '/icons/icon-192x192.png',
                    badge: '/icons/icon-72x72.png',
                    ...options
                });
            });
        }
    }
    
    updateDateDisplay() {
        // Initialiser weekStartDate til start af ugen
        const today = new Date();
        this.weekStartDate = new Date(today);
        this.updateDateBar();
    }
    
    initializeEventListeners() {
        // Add task button
        document.getElementById('addBtn').addEventListener('click', () => {
            this.showAddTaskForm();
        });
        
        // Cancel form
        document.getElementById('cancelBtn').addEventListener('click', () => {
            this.hideAddTaskForm();
        });
        
        // Save task
        document.getElementById('saveBtn').addEventListener('click', () => {
            this.saveTask();
        });

        // Delete task
        document.getElementById('deleteBtn').addEventListener('click', () => {
            this.deleteTask();
        });
        
        // Recurring task checkbox
        document.getElementById('isRecurring').addEventListener('change', (e) => {
            this.toggleRecurringOptions(e.target.checked);
        });
        
        // Recurrence type and interval changes
        document.getElementById('recurrenceType').addEventListener('change', () => {
            this.updateRecurrenceDescription();
        });
        
        document.getElementById('recurrenceInterval').addEventListener('input', () => {
            this.updateRecurrenceDescription();
        });
        
        // Copy task checkbox
        document.getElementById('copyTask').addEventListener('change', (e) => {
            this.updateMoveFormTitle(e.target.checked);
        });
        
        // Search input
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.filterTasks();
        });
        
        // Filter tabs
        document.querySelectorAll('.filter-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.setFilter(e.target.dataset.filter);
            });
        });
        
        // Menu items
        document.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', (e) => {
                this.setView(e.currentTarget.dataset.view);
            });
        });
        
        // Date navigation
        document.getElementById('prevWeek').addEventListener('click', () => {
            this.navigateWeek(-1);
        });
        
        document.getElementById('nextWeek').addEventListener('click', () => {
            this.navigateWeek(1);
        });
        
        // Date selection
        document.querySelectorAll('.date-item').forEach(item => {
            item.addEventListener('click', (e) => {
                this.selectDate(e.currentTarget);
            });
        });
        
        // Client selection change
        document.getElementById('clientSelect').addEventListener('change', (e) => {
            this.updateProjectOptions(e.target.value);
        });
        
        // Close form when clicking outside
        document.getElementById('addTaskForm').addEventListener('click', (e) => {
            if (e.target.id === 'addTaskForm') {
                this.hideAddTaskForm();
            }
        });
        
        // Enter key to save task
        document.getElementById('taskTitle').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.saveTask();
            }
        });
        
        // Pause display click to stop pause
        document.getElementById('pauseDisplay').addEventListener('click', () => {
            if (this.isPaused) {
                if (confirm('Vil du stoppe pausen nu?')) {
                    this.stopPause();
                }
            }
        });
        
        // Event delegation for dynamically created buttons
        document.addEventListener('click', (e) => {
            
            // Find the actual button element (could be clicked on icon inside)
            const editBtn = e.target.closest('.edit-btn');
            const deleteBtn = e.target.closest('.delete-btn'); 
            const moveBtn = e.target.closest('.move-btn');
            
            if (editBtn) {
                e.preventDefault();
                e.stopPropagation();
                const taskId = parseInt(editBtn.getAttribute('data-task-id'));
                const clientId = parseInt(editBtn.getAttribute('data-client-id'));
                const projectId = parseInt(editBtn.getAttribute('data-project-id'));
                
                
                if (taskId) {
                    this.showTaskForm('edit', taskId);
                } else if (clientId) {
                    const clientName = e.target.getAttribute('data-client-name');
                    this.editClient(clientId, clientName);
                } else if (projectId) {
                    const projectName = editBtn.getAttribute('data-project-name');
                    const projectClientId = editBtn.getAttribute('data-project-client-id');
                    this.editProject(projectId, projectName, projectClientId);
                }
            } else if (deleteBtn) {
                e.preventDefault();
                e.stopPropagation();
                const taskId = parseInt(deleteBtn.getAttribute('data-task-id'));
                const clientId = parseInt(deleteBtn.getAttribute('data-client-id'));
                const projectId = parseInt(deleteBtn.getAttribute('data-project-id'));
                
                
                if (taskId) {
                    this.showTaskForm('delete', taskId);
                } else if (clientId) {
                    this.deleteClient(clientId);
                } else if (projectId) {
                    this.deleteProject(projectId);
                }
            } else if (moveBtn) {
                e.preventDefault();
                e.stopPropagation();
                const taskId = parseInt(moveBtn.getAttribute('data-task-id'));
                
                if (taskId) {
                    this.showTaskForm('move', taskId);
                }
            }
        });

        // Cleanup when page unloads
        window.addEventListener('beforeunload', () => {
            this.cleanup();
        });

    }

    cleanup() {        
        // Clear timer timeout
        this.clearTimerTimeout();
        
        // Clear other intervals
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        
        if (this.pauseInterval) {
            clearInterval(this.pauseInterval);
        }
    }
    
    async loadData() {
        await Promise.all([
            this.loadTasks(),
            this.loadClients(),
            this.loadProjects()
        ]);
    }
    
    async loadRecurringCompletions() {
        try {
            const timestamp = Date.now();
            const response = await fetch(`/api/recurring-completions?t=${timestamp}`, {
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                }
            });
            if (response.ok) {
                const data = await response.json();
                this.recurringCompletions = data;
                console.log('Loaded recurring completions:', data.length, 'items');
            } else {
                console.error('Failed to load recurring completions:', response.status);
            }
        } catch (error) {
            console.error('Error loading recurring completions:', error);
        }
    }
    
    async loadHiddenDates() {
        try {
            const timestamp = Date.now();
            const response = await fetch(`/api/hidden-dates?t=${timestamp}`, {
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                }
            });
            if (response.ok) {
                this.hiddenDates = await response.json();
            }
        } catch (error) {
        }
    }

    async loadTasks() {
        try {
            const timestamp = Date.now();
            const response = await fetch(`/api/tasks?t=${timestamp}`, {
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                }
            });
            if (response.ok) {
                this.tasks = await response.json();
                await this.loadRecurringCompletions();
                this.renderTasks();
            }
        } catch (error) {
        }
    }
    
    async loadClients() {
        try {
            const timestamp = Date.now();
            const response = await fetch(`/api/clients?t=${timestamp}`, {
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                }
            });
            if (response.ok) {
                this.clients = await response.json();
                this.updateClientOptions();
            }
        } catch (error) {
        }
    }
    
    async loadProjects() {
        try {
            const timestamp = Date.now();
            const response = await fetch(`/api/projects?t=${timestamp}`, {
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                }
            });
            if (response.ok) {
                this.projects = await response.json();
            }
        } catch (error) {
        }
    }
    
    async saveTask() {
        if (this.formMode === 'delete') {
            this.hideAddTaskForm();
            return;
        }
        
        if (this.formMode === 'move') {
            await this.confirmMoveTask();
            return;
        }
        
        const title = document.getElementById('taskTitle').value.trim();
        if (!title) return;
        
        const notes = document.getElementById('taskNotes').value.trim();
        const clientId = document.getElementById('clientSelect').value || null;
        const projectId = document.getElementById('projectSelect').value || null;
        const isRecurring = document.getElementById('isRecurring').checked;
        
        const taskData = {
            title: title,
            notes: notes || null,
            project_id: projectId,
            start_date: this.selectedDate.toISOString().split('T')[0]  // Brug den valgte dato
        };
        
        if (isRecurring) {
            const recurrenceType = document.getElementById('recurrenceType').value;
            const recurrenceInterval = parseInt(document.getElementById('recurrenceInterval').value) || 1;
            
            taskData.is_recurring = true;
            taskData.recurrence_type = recurrenceType;
            taskData.recurrence_interval = recurrenceInterval;
            
            // Beregn næste forekomst
            const nextOccurrence = new Date();
            switch (recurrenceType) {
                case 'daily':
                    nextOccurrence.setDate(nextOccurrence.getDate() + recurrenceInterval);
                    break;
                case 'weekly':
                    nextOccurrence.setDate(nextOccurrence.getDate() + (7 * recurrenceInterval));
                    break;
                case 'monthly':
                    nextOccurrence.setMonth(nextOccurrence.getMonth() + recurrenceInterval);
                    break;
                case 'yearly':
                    nextOccurrence.setFullYear(nextOccurrence.getFullYear() + recurrenceInterval);
                    break;
            }
            taskData.next_occurrence = nextOccurrence.toISOString().split('T')[0];
        }
        
        try {
            const timestamp = Date.now();
            let response, logMessage;
            
            if (this.formMode === 'edit' && this.currentTaskId) {
                logMessage = 'Updated task';
                response = await fetch(`/api/tasks/${this.currentTaskId}?t=${timestamp}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Cache-Control': 'no-cache, no-store, must-revalidate',
                        'Pragma': 'no-cache'
                    },
                    body: JSON.stringify(taskData)
                });
            } else {
                logMessage = 'New task created';
                response = await fetch(`/api/tasks?t=${timestamp}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Cache-Control': 'no-cache, no-store, must-revalidate',
                        'Pragma': 'no-cache'
                    },
                    body: JSON.stringify(taskData)
                });
            }
            
            
            if (response.ok) {
                const task = await response.json();
                
                // Reload all tasks to ensure consistency
                await this.loadTasks();
                
                this.hideAddTaskForm();
                this.resetTaskForm();
                
                // Show success message
            } else {
            }
        } catch (error) {
        }
    }

    async deleteTask() {
        if (!this.currentTaskId) return;
        
        const task = this.tasks.find(t => t.id === this.currentTaskId);
        if (!task) return;
        
        try {
            let url = `/api/tasks/${this.currentTaskId}`;
            const timestamp = Date.now();
            
            // Hvis det er en gentagen opgave, tjek hvilken delete type
            if (task.is_recurring) {
                const deleteType = document.querySelector('input[name="deleteRecurringType"]:checked')?.value || 'this';
                
                if (deleteType === 'this') {
                    // Slet kun denne forekomst - tilføj til "hidden" liste via completion_date
                    const completionDate = this.selectedDate.toISOString().split('T')[0];
                    const response = await fetch(`/api/tasks/${this.currentTaskId}/hide-recurring`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ date: completionDate })
                    });
                    
                    if (response.ok) {
                        await this.loadTasks();
                        this.hideAddTaskForm();
                    } else {
                        alert('Kunne ikke skjule opgaven');
                    }
                    return;
                } else if (deleteType === 'future') {
                    // Sæt end_date til i dag, så fremtidige forekomster ikke vises
                    const today = new Date().toISOString().split('T')[0];
                    url = `/api/tasks/${this.currentTaskId}/end-recurrence?end_date=${today}&t=${timestamp}`;
                } else {
                    // 'all' - slet alt inkl. historik
                    url = `/api/tasks/${this.currentTaskId}?delete_all=true&t=${timestamp}`;
                }
            } else {
                url += `?t=${timestamp}`;
            }
            
            const response = await fetch(url, {
                method: 'DELETE',
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache'
                }
            });
            
            if (response.ok) {
                await this.loadHiddenDates(); // Reload hidden dates
                await this.loadTasks();
                this.hideAddTaskForm();
            } else {
                alert('Kunne ikke slette opgaven');
            }
        } catch (error) {
            alert('Fejl ved sletning af opgave');
        }
    }
    
    async toggleTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;
        
        try {
            // For gentagende opgaver, håndter completion anderledes
            if (task.is_recurring) {
                const completionDate = this.selectedDate.toISOString().split('T')[0];
                console.log(`toggleTask: selectedDate=${completionDate}, taskId=${taskId}`);
                const isCompleted = this.isRecurringTaskCompletedOnDate(taskId, completionDate);
                
                if (isCompleted) {
                    // Fjern completion for denne dato
                    const response = await fetch(`/api/tasks/${taskId}/uncomplete-recurring`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ date: completionDate })
                    });
                    
                    if (response.ok) {
                        // Reload completions fra serveren for at få korrekt data
                        await this.loadRecurringCompletions();
                        console.log(`After uncomplete: selectedDate=${this.selectedDate.toISOString().split('T')[0]}`);
                        this.renderTasks();
                    } else {
                        console.error('Failed to uncomplete recurring task:', await response.text());
                    }
                } else {
                    // Marker som udført for denne dato
                    const response = await fetch(`/api/tasks/${taskId}/complete-recurring`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ date: completionDate })
                    });
                    
                    if (response.ok) {
                        // Reload completions fra serveren for at få korrekt data
                        await this.loadRecurringCompletions();
                        console.log(`After complete: selectedDate=${this.selectedDate.toISOString().split('T')[0]}`);
                        this.renderTasks();
                    } else {
                        console.error('Failed to complete recurring task:', await response.text());
                    }
                }
            } else {
                // Normal opgave - samme logik som før
                if (task.completed) {
                    // Unmark as completed
                    const response = await fetch(`/api/tasks/${taskId}/uncomplete`, {
                        method: 'POST'
                    });
                    
                    if (response.ok) {
                        task.completed = false;
                        task.completed_at = null;
                        this.renderTasks();
                    }
                } else {
                    // Mark as completed
                    const response = await fetch(`/api/tasks/${taskId}/complete`, {
                        method: 'POST'
                    });
                    
                    if (response.ok) {
                        const result = await response.json();
                        task.completed = true;
                        task.completed_at = new Date().toISOString();
                        this.renderTasks();
                    }
                }
            }
        } catch (error) {
        }
    }
    
    async startTimer(taskId) {
        // Request notification permission on first timer start (user gesture)
        if ('Notification' in window && Notification.permission === 'default') {
            await this.requestNotificationPermission();
        }
        
        // Stop any existing timer
        if (this.activeTaskId) {
            await this.stopTimer();
        }
        
        try {
            const task = this.tasks.find(t => t.id === taskId);
            let response;
            
            if (task && task.is_recurring) {
                // For recurring tasks, use the recurring timer endpoint
                const completionDate = this.selectedDate.toISOString().split('T')[0];
                response = await fetch(`/api/tasks/${taskId}/start-recurring`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ completion_date: completionDate })
                });
            } else {
                // For regular tasks, use the regular timer endpoint
                response = await fetch(`/api/tasks/${taskId}/start`, {
                    method: 'POST'
                });
            }
            
            if (response.ok) {
                this.activeTaskId = taskId;
                this.timerStartTime = Date.now();
                
                // Start the timer display
                this.timerInterval = setInterval(() => {
                    this.updateTimerDisplay();
                }, 1000);
                
                // Set up 1-hour timeout check
                this.setupTimerTimeout();
                
                // Timer vises nu direkte under opgaven i stedet
                this.renderTasks();
            }
        } catch (error) {
        }
    }
    
    async stopTimer() {
        if (!this.activeTaskId) return;
        
        try {
            const task = this.tasks.find(t => t.id === this.activeTaskId);
            let response;
            
            if (task && task.is_recurring) {
                // For recurring tasks, use the recurring timer endpoint
                const completionDate = this.selectedDate.toISOString().split('T')[0];
                response = await fetch(`/api/tasks/${this.activeTaskId}/stop-recurring`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ completion_date: completionDate })
                });
            } else {
                // For regular tasks, use the regular timer endpoint
                response = await fetch(`/api/tasks/${this.activeTaskId}/stop`, {
                    method: 'POST'
                });
            }
            
            if (response.ok) {
                const result = await response.json();
                
                // Reload data først for recurring tasks for at få opdateret completion
                if (task && task.is_recurring) {
                    await this.loadRecurringCompletions();
                }
                
                // Opdater den lokale data med ny time_spent
                if (task && task.is_recurring && result.time_spent !== undefined) {
                    // Opdater recurring completion
                    const completionDate = this.selectedDate.toISOString().split('T')[0];
                    const completion = this.recurringCompletions.find(
                        c => c.task_id === this.activeTaskId && c.completion_date === completionDate
                    );
                    if (completion) {
                        completion.time_spent = result.time_spent;
                    }
                } else if (task && result.time_spent !== undefined) {
                    // Opdater normal task
                    task.time_spent = result.time_spent;
                }
                
                // Opdater UI med den nye tid INDEN vi clearer timer state
                const taskElement = document.querySelector(`.task-item[data-task-id="${this.activeTaskId}"]`);
                if (taskElement) {
                    const timerElement = taskElement.querySelector('.task-live-timer, .task-timer');
                    if (timerElement && result.time_spent !== undefined) {
                        timerElement.textContent = this.formatTime(result.time_spent);
                        timerElement.className = 'task-timer'; // Skift fra live-timer til normal timer
                    }
                }
                
                this.activeTaskId = null;
                this.timerStartTime = null;
                
                if (this.timerInterval) {
                    clearInterval(this.timerInterval);
                    this.timerInterval = null;
                }
                
                // Clear timeout warnings
                this.clearTimerTimeout();
                
                // Re-render for at opdatere timer styling (fjern "timing" class)
                this.renderTasks();
            }
        } catch (error) {
        }
    }

    setupTimerTimeout() {
        // Clear any existing timeout
        this.clearTimerTimeout();
        
        // Set timeout for 1 hour (3600000 ms)
        this.timerTimeoutCheck = setTimeout(() => {
            this.showTimerTimeoutWarning();
        }, 3600000); // 1 hour
        
    }
    
    clearTimerTimeout() {
        if (this.timerTimeoutCheck) {
            clearTimeout(this.timerTimeoutCheck);
            this.timerTimeoutCheck = null;
        }
        
        if (this.timerTimeoutWarning) {
            clearTimeout(this.timerTimeoutWarning);
            this.timerTimeoutWarning = null;
        }
    }
    
    showTimerTimeoutWarning() {
        if (!this.activeTaskId) return;
        
        const task = this.tasks.find(t => t.id === this.activeTaskId);
        const taskName = task ? task.title : 'Opgave';
        
        // Show notification if supported
        if ('Notification' in window && Notification.permission === 'granted') {
            const notification = new Notification('Timer kørt i 1 time', {
                body: `${taskName} - Skal timeren fortsætte?`,
                icon: '/icons/icon-192x192.png',
                requireInteraction: true,
                actions: [
                    { action: 'continue', title: 'Fortsæt timer' },
                    { action: 'stop', title: 'Stop timer' }
                ]
            });
            
            notification.onclick = () => {
                window.focus();
                this.handleTimerTimeoutResponse('continue');
                notification.close();
            };
        }
        
        // Show in-app modal as backup
        this.showTimerTimeoutModal(taskName);
        
        // Auto-stop after 1 minute if no response
        this.timerTimeoutWarning = setTimeout(() => {
            this.stopTimer();
            this.showAutoStopNotification();
        }, 60000); // 1 minute
    }
    
    showTimerTimeoutModal(taskName) {
        // Create modal overlay
        const modal = document.createElement('div');
        modal.id = 'timerTimeoutModal';
        modal.innerHTML = `
            <div style="
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0,0,0,0.8);
                z-index: 2000;
                display: flex;
                align-items: center;
                justify-content: center;
            ">
                <div style="
                    background: white;
                    border-radius: 20px;
                    padding: 24px;
                    max-width: 400px;
                    width: 90%;
                    text-align: center;
                    box-shadow: 0 8px 32px rgba(0,0,0,0.3);
                ">
                    <div style="font-size: 24px; margin-bottom: 8px;">⏰</div>
                    <h2 style="margin: 0 0 16px 0; color: #2d3748;">Timer kørt i 1 time</h2>
                    <p style="margin: 0 0 24px 0; color: #718096;">
                        <strong>${taskName}</strong><br>
                        Skal timeren fortsætte med at køre?<br>
                        <small>Stopper automatisk om 1 minut hvis ingen reaktion</small>
                    </p>
                    <div style="display: flex; gap: 12px; justify-content: center;">
                        <button onclick="taskAgent.handleTimerTimeoutResponse('stop')" 
                                style="
                                    background: #f56565; 
                                    color: white; 
                                    border: none; 
                                    padding: 12px 24px; 
                                    border-radius: 12px; 
                                    cursor: pointer;
                                    font-size: 14px;
                                ">
                            Stop timer
                        </button>
                        <button onclick="taskAgent.handleTimerTimeoutResponse('continue')" 
                                style="
                                    background: #667eea; 
                                    color: white; 
                                    border: none; 
                                    padding: 12px 24px; 
                                    border-radius: 12px; 
                                    cursor: pointer;
                                    font-size: 14px;
                                ">
                            Fortsæt timer
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }
    
    handleTimerTimeoutResponse(action) {
        // Remove modal
        const modal = document.getElementById('timerTimeoutModal');
        if (modal) {
            modal.remove();
        }
        
        // Clear timeout warning
        if (this.timerTimeoutWarning) {
            clearTimeout(this.timerTimeoutWarning);
            this.timerTimeoutWarning = null;
        }
        
        if (action === 'continue') {
            this.setupTimerTimeout(); // Set up another 1-hour timeout
        } else {
            this.stopTimer();
        }
    }
    
    showAutoStopNotification() {
        const notification = document.createElement('div');
        notification.innerHTML = `
            <div style="
                position: fixed; 
                top: 70px; 
                right: 20px; 
                background: rgba(245, 101, 101, 0.95); 
                color: white; 
                padding: 12px 16px; 
                border-radius: 12px; 
                font-size: 14px; 
                z-index: 1001;
                box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            ">
                <div>⏰ Timer stoppet automatisk</div>
                <div style="font-size: 12px; opacity: 0.9; margin-top: 4px;">
                    Ingen reaktion efter 1 time
                </div>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Remove notification after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);
    }
    
    updateTimerDisplay() {
        if (!this.timerStartTime) return;
        
        const elapsed = Date.now() - this.timerStartTime;
        
        // Update the live timer in the active task
        if (this.activeTaskId) {
            const task = this.tasks.find(t => t.id === this.activeTaskId);
            if (task) {
                // Get correct base time depending on task type
                let baseTime = 0;
                if (task.is_recurring) {
                    // For recurring tasks, get time from the specific completion
                    const selectedDateStr = this.selectedDate.toISOString().split('T')[0];
                    const completion = this.recurringCompletions.find(
                        c => c.task_id === this.activeTaskId && c.completion_date === selectedDateStr
                    );
                    baseTime = completion ? (completion.time_spent || 0) : 0;
                } else {
                    // For regular tasks, use the task's time_spent
                    baseTime = task.time_spent || 0;
                }
                
                const totalSeconds = baseTime + Math.floor(elapsed / 1000);
                const liveTimeString = this.formatTime(totalSeconds);
                
                // Find the live timer element in the active task
                const liveTimerElement = document.querySelector(`.task-item[data-task-id="${this.activeTaskId}"] .task-live-timer`);
                if (liveTimerElement) {
                    liveTimerElement.textContent = liveTimeString;
                }
            }
        }
    }
    
    startPause() {
        const minutes = prompt('Hvor mange minutter skal pausen vare?', '5');
        if (!minutes || isNaN(minutes) || minutes <= 0) return;
        
        this.pauseDuration = parseInt(minutes);
        this.pauseStartTime = Date.now();
        this.isPaused = true;
        
        // Pause active timer if running
        if (this.activeTaskId) {
            this.pauseActiveTimer();
        }
        
        // Start pause countdown
        this.pauseInterval = setInterval(() => {
            this.updatePauseDisplay();
        }, 1000);
        
        document.getElementById('pauseDisplay').classList.add('active');
        this.updatePauseDisplay();
        this.updatePauseButtonIcon();
    }
    
    pauseToggle() {
        if (this.isPaused) {
            this.stopPause();
        } else {
            this.startPause();
        }
    }
    
    stopPause() {
        if (!this.isPaused) return;
        
        this.isPaused = false;
        this.pauseStartTime = null;
        
        if (this.pauseInterval) {
            clearInterval(this.pauseInterval);
            this.pauseInterval = null;
        }
        
        document.getElementById('pauseDisplay').classList.remove('active');
        
        // Resume active timer if it was running
        if (this.activeTaskId) {
            this.resumeActiveTimer();
        }
        
        this.updatePauseButtonIcon();
        
        // Show notification and alert
        this.showNotification('Pause færdig! 🎉', {
            body: 'Din pause er slut. Tilbage til arbejdet!',
            tag: 'pause-complete',
            requireInteraction: true
        });
        
        // Show completion message
        alert('Pause er færdig! 🎉');
    }
    
    pauseActiveTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }
    
    resumeActiveTimer() {
        if (this.activeTaskId) {
            this.timerInterval = setInterval(() => {
                this.updateTimerDisplay();
            }, 1000);
        }
    }
    
    updatePauseDisplay() {
        if (!this.isPaused || !this.pauseStartTime) return;
        
        const elapsed = Date.now() - this.pauseStartTime;
        const totalPauseTime = this.pauseDuration * 60 * 1000; // Convert to milliseconds
        const remaining = Math.max(0, totalPauseTime - elapsed);
        
        if (remaining === 0) {
            this.stopPause();
            return;
        }
        
        const minutes = Math.floor(remaining / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);
        
        const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        document.getElementById('pauseDisplay').textContent = `Pause: ${timeString}`;
    }
    
    updatePauseButtonIcon() {
        const pauseBtn = document.querySelector('.pause-btn');
        if (pauseBtn) {
            const icon = pauseBtn.querySelector('[data-lucide]');
            if (icon) {
                if (this.isPaused) {
                    icon.setAttribute('data-lucide', 'play');
                    pauseBtn.setAttribute('title', 'Stop pause');
                } else {
                    icon.setAttribute('data-lucide', 'pause');
                    pauseBtn.setAttribute('title', 'Start pause');
                }
                this.initializeLucideIcons();
            }
        }
    }
    
    setView(view) {
        this.currentView = view;
        
        // Update active menu item
        document.querySelectorAll('.menu-item').forEach(item => {
            item.classList.toggle('active', item.dataset.view === view);
        });
        
        // Update search visibility
        this.updateSearchVisibility();
        
        // Update main content based on view
        this.renderContent();
    }
    
    updateSearchVisibility() {
        const searchContainer = document.querySelector('.search-container');
        if (searchContainer) {
            const shouldShow = this.currentView === 'tasks';
            searchContainer.style.display = shouldShow ? 'block' : 'none';
        }
    }
    
    renderContent() {
        switch(this.currentView) {
            case 'tasks':
                this.renderTasks();
                break;
            case 'clients':
                this.renderClients();
                break;
            case 'projects':
                this.renderProjects();
                break;
            case 'reports':
                this.renderReports();
                break;
        }
    }
    
    navigateWeek(direction) {
        // Create new Date object to avoid modifying the original
        const newWeekStart = new Date(this.weekStartDate.getTime());
        newWeekStart.setDate(newWeekStart.getDate() + (direction * 7));
        this.weekStartDate = newWeekStart;
        this.updateDateBar();
        this.renderTasks();
    }
    
    selectDate(dateElement) {
        // Remove active from all dates
        document.querySelectorAll('.date-item').forEach(item => {
            item.classList.remove('active');
        });
        
        // Add active to selected date
        dateElement.classList.add('active');
        
        // Update selected date - always create a new Date object to avoid reference issues
        const dayIndex = Array.from(dateElement.parentNode.children).indexOf(dateElement) - 1; // -1 for prev button
        if (dayIndex >= 0 && dayIndex < 7) {
            // Create completely new Date object with getTime() for safe copy
            this.selectedDate = new Date(this.weekStartDate.getTime());
            this.selectedDate.setDate(this.weekStartDate.getDate() + dayIndex);
            this.renderTasks();
        }
    }
    
    updateClientOptions() {
        const clientSelect = document.getElementById('clientSelect');
        clientSelect.innerHTML = '<option value="">Vælg kunde (valgfri)</option>';
        
        this.clients.forEach(client => {
            const option = document.createElement('option');
            option.value = client.id;
            option.textContent = client.name;
            clientSelect.appendChild(option);
        });
    }
    
    updateProjectOptions(clientId) {
        const projectSelect = document.getElementById('projectSelect');
        projectSelect.innerHTML = '<option value="">Vælg projekt (valgfri)</option>';
        
        const filteredProjects = clientId 
            ? this.projects.filter(p => p.client_id == clientId)
            : this.projects;
            
        filteredProjects.forEach(project => {
            const option = document.createElement('option');
            option.value = project.id;
            option.textContent = project.name;
            projectSelect.appendChild(option);
        });
    }
    
    setFilter(filter) {
        this.currentFilter = filter;
        
        // Update active tab
        document.querySelectorAll('.filter-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.filter === filter);
        });
        
        this.renderTasks();
    }
    
    filterTasks() {
        this.renderTasks();
    }
    
    isRecurringTaskCompletedOnDate(taskId, date) {
        const completion = this.recurringCompletions.find(
            c => c.task_id === taskId && c.completion_date === date
        );
        const isCompleted = completion ? (completion.completed === true || completion.completed === 1) : false;
        
        // Debug logging (kan fjernes senere)
        if (completion) {
            console.log(`Task ${taskId} on ${date}: completed=${completion.completed}, time=${completion.time_spent}s`);
        }
        
        return isCompleted;
    }

    shouldShowRecurringTask(task, targetDate) {
        // Hvis opgaven ikke er gentagende, brug normal dato logik
        if (!task.is_recurring) {
            const taskDate = new Date(task.start_date || task.created_at).toDateString();
            return taskDate === targetDate.toDateString();
        }
        
        const startDate = new Date(task.start_date || task.created_at);
        startDate.setHours(0, 0, 0, 0);
        const checkDate = new Date(targetDate);
        checkDate.setHours(0, 0, 0, 0);
        
        // Opgaven kan kun vises på eller efter start datoen
        if (checkDate < startDate) {
            return false;
        }
        
        // Check if task has ended (end_date set)
        if (task.end_date) {
            const endDate = new Date(task.end_date);
            endDate.setHours(0, 0, 0, 0);
            if (checkDate > endDate) {
                return false;
            }
        }
        
        // Check if this specific date is hidden
        const checkDateStr = checkDate.toISOString().split('T')[0];
        const isHidden = this.hiddenDates.some(h => 
            h.task_id === task.id && h.hidden_date === checkDateStr
        );
        if (isHidden) {
            return false;
        }
        
        // Beregn hvor mange dage/uger/måneder/år der er gået siden start
        const timeDiff = checkDate.getTime() - startDate.getTime();
        
        switch (task.recurrence_type) {
            case 'daily':
                const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
                return daysDiff % task.recurrence_interval === 0;
                
            case 'weekly':
                const weeksDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24 * 7));
                const dayOfWeek = startDate.getDay();
                return checkDate.getDay() === dayOfWeek && weeksDiff % task.recurrence_interval === 0;
                
            case 'monthly':
                const monthsDiff = (checkDate.getFullYear() - startDate.getFullYear()) * 12 + 
                                 (checkDate.getMonth() - startDate.getMonth());
                return checkDate.getDate() === startDate.getDate() && 
                       monthsDiff % task.recurrence_interval === 0;
                       
            case 'yearly':
                const yearsDiff = checkDate.getFullYear() - startDate.getFullYear();
                return checkDate.getMonth() === startDate.getMonth() &&
                       checkDate.getDate() === startDate.getDate() &&
                       yearsDiff % task.recurrence_interval === 0;
        }
        
        return false;
    }

    renderTasks() {
        if (this.currentView !== 'tasks') return;
        
        console.log(`renderTasks: selectedDate=${this.selectedDate.toISOString().split('T')[0]}`);
        
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        let filteredTasks = this.tasks;
        
        // Apply search filter first
        if (searchTerm) {
            filteredTasks = filteredTasks.filter(task => 
                task.title.toLowerCase().includes(searchTerm) ||
                (task.client_name && task.client_name.toLowerCase().includes(searchTerm)) ||
                (task.project_name && task.project_name.toLowerCase().includes(searchTerm))
            );
            
            // If searching, show all matching tasks sorted by date (newest first)
            filteredTasks = filteredTasks.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        } else {
            // If not searching, filter by selected date considering recurring tasks
            const selectedDateStr = this.selectedDate.toDateString();
            filteredTasks = filteredTasks.filter(task => {
                if (task.is_recurring) {
                    return this.shouldShowRecurringTask(task, this.selectedDate);
                } else {
                    const taskDate = new Date(task.start_date || task.created_at).toDateString();
                    return taskDate === selectedDateStr;
                }
            });
        }
        
        // Apply status filter
        const selectedDateStr = this.selectedDate.toISOString().split('T')[0];
        if (this.currentFilter === 'active') {
            filteredTasks = filteredTasks.filter(task => {
                if (task.is_recurring) {
                    return !this.isRecurringTaskCompletedOnDate(task.id, selectedDateStr);
                } else {
                    return !task.completed;
                }
            });
        } else if (this.currentFilter === 'completed') {
            filteredTasks = filteredTasks.filter(task => {
                if (task.is_recurring) {
                    return this.isRecurringTaskCompletedOnDate(task.id, selectedDateStr);
                } else {
                    return task.completed;
                }
            });
        }
        
        const taskList = document.getElementById('taskList');
        taskList.innerHTML = '';
        
        if (filteredTasks.length === 0) {
            const searchTerm = document.getElementById('searchInput').value.toLowerCase();
            const message = searchTerm ? 
                'Ingen opgaver fundet for søgningen' : 
                'Ingen opgaver for denne dag';
            taskList.innerHTML = `<div style="text-align: center; padding: 40px; color: #a0aec0;">${message}</div>`;
            return;
        }
        
        filteredTasks.forEach(task => {
            const li = document.createElement('li');
            li.className = 'task-item';
            li.setAttribute('data-task-id', task.id);
            
            // Calculate correct time spent based on task type
            let timeSpent = 0;
            if (task.is_recurring) {
                // For recurring tasks, get time from the specific completion
                const selectedDateStr = this.selectedDate.toISOString().split('T')[0];
                const completion = this.recurringCompletions.find(
                    c => c.task_id === task.id && c.completion_date === selectedDateStr
                );
                timeSpent = completion ? (completion.time_spent || 0) : 0;
            } else {
                // For regular tasks, use the task's time_spent
                timeSpent = task.time_spent || 0;
            }
            
            const totalTime = this.formatTime(timeSpent);
            const isActive = this.activeTaskId === task.id;
            
            // Bestem completion status for opgaven
            const selectedDateStr = this.selectedDate.toISOString().split('T')[0];
            let isCompleted, completedAt;
            if (task.is_recurring) {
                isCompleted = this.isRecurringTaskCompletedOnDate(task.id, selectedDateStr);
                const completion = this.recurringCompletions.find(
                    c => c.task_id === task.id && c.completion_date === selectedDateStr
                );
                completedAt = completion ? completion.completed_at : null;
            } else {
                isCompleted = task.completed;
                completedAt = task.completed_at;
            }
            
            if (isActive) {
                li.classList.add('timing');
            }
            
            const clientProject = [];
            if (task.client_name) clientProject.push(task.client_name);
            if (task.project_name) clientProject.push(task.project_name);
            const clientProjectStr = clientProject.length > 0 ? clientProject.join(' • ') : '';
            
            // Add date info when searching
            const searchTerm = document.getElementById('searchInput').value.toLowerCase();
            let dateInfo = '';
            if (searchTerm) {
                const taskDate = new Date(task.start_date || task.created_at);
                dateInfo = `<div class="task-date">${taskDate.toLocaleDateString('da-DK', { 
                    day: '2-digit', 
                    month: '2-digit', 
                    year: 'numeric' 
                })}</div>`;
            }
            
            // Add recurring indicator
            let recurringInfo = '';
            if (task.is_recurring) {
                const typeLabels = {
                    daily: task.recurrence_interval === 1 ? 'Dagligt' : `Hver ${task.recurrence_interval}. dag`,
                    weekly: task.recurrence_interval === 1 ? 'Ugentligt' : `Hver ${task.recurrence_interval}. uge`,
                    monthly: task.recurrence_interval === 1 ? 'Månedligt' : `Hver ${task.recurrence_interval}. måned`,
                    yearly: task.recurrence_interval === 1 ? 'Årligt' : `Hvert ${task.recurrence_interval}. år`
                };
                const recurrenceText = typeLabels[task.recurrence_type] || 'Gentagende';
                recurringInfo = `<div class="task-recurring"><i data-lucide="repeat"></i> ${recurrenceText}</div>`;
            }
            
            li.innerHTML = `
                <div class="task-checkbox ${isCompleted ? 'completed' : ''}" 
                     onclick="taskAgent.toggleTask(${task.id})"></div>
                <div class="task-content ${isCompleted ? 'completed' : ''}">
                    <div class="task-title-with-icon">
                        <span>${task.title}</span>
                        ${task.notes ? `<span class="task-notes-icon" title="${task.notes.replace(/"/g, '&quot;')}"><i data-lucide="info"></i></span>` : ''}
                    </div>
                    ${isActive ? `<div class="task-live-timer">${totalTime}</div>` : `<div class="task-timer">${totalTime}</div>`}
                    ${clientProjectStr ? `<div class="task-client-info">${clientProjectStr}</div>` : ''}
                    ${recurringInfo}
                    ${dateInfo}
                </div>
                <div class="task-actions">
                    ${!isCompleted ? (isActive ? 
                        `<button class="task-btn stop" onclick="taskAgent.stopTimer()"><i data-lucide="square"></i></button>` :
                        `<button class="task-btn play" onclick="taskAgent.startTimer(${task.id})"><i data-lucide="play"></i></button>`
                    ) : ''}
                    <button class="move-btn" data-task-id="${task.id}"><i data-lucide="calendar"></i></button>
                    <button class="edit-btn" data-task-id="${task.id}"><i data-lucide="edit-3"></i></button>
                    <button class="delete-btn" data-task-id="${task.id}"><i data-lucide="x"></i></button>
                </div>
            `;
            
            taskList.appendChild(li);
        });
        
        // Initialize Lucide icons after DOM update
        this.initializeLucideIcons();
    }
    
    formatTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        if (hours > 0) {
            // Format: HH:MM:SS
            return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
        } else {
            // Format: MM:SS
            return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
        }
    }
    
    initializeLucideIcons() {
        // Initialize Lucide icons after DOM updates
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }
    
    // Inline Client Form
    showInlineClientForm() {
        document.getElementById('inlineClientForm').style.display = 'block';
        document.getElementById('inlineClientName').focus();
        this.initializeLucideIcons();
    }
    
    hideInlineClientForm() {
        document.getElementById('inlineClientForm').style.display = 'none';
        document.getElementById('inlineClientName').value = '';
    }
    
    async saveInlineClient() {
        const name = document.getElementById('inlineClientName').value.trim();
        if (!name) return;
        
        try {
            const response = await fetch('/api/clients', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name })
            });
            
            if (response.ok) {
                const newClient = await response.json();
                await this.loadClients();
                document.getElementById('clientSelect').value = newClient.id;
                this.hideInlineClientForm();
            }
        } catch (error) {
            console.error('Error creating client:', error);
        }
    }
    
    // Inline Project Form
    showInlineProjectForm() {
        document.getElementById('inlineProjectForm').style.display = 'block';
        document.getElementById('inlineProjectName').focus();
        this.initializeLucideIcons();
    }
    
    hideInlineProjectForm() {
        document.getElementById('inlineProjectForm').style.display = 'none';
        document.getElementById('inlineProjectName').value = '';
    }
    
    async saveInlineProject() {
        const name = document.getElementById('inlineProjectName').value.trim();
        if (!name) return;
        
        const clientId = document.getElementById('clientSelect').value || null;
        
        try {
            const response = await fetch('/api/projects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, client_id: clientId })
            });
            
            if (response.ok) {
                const newProject = await response.json();
                await this.loadProjects();
                document.getElementById('projectSelect').value = newProject.id;
                this.hideInlineProjectForm();
            }
        } catch (error) {
            console.error('Error creating project:', error);
        }
    }
    
    showAddTaskForm() {
        this.showTaskForm('add');
    }

    showTaskForm(mode, taskId = null) {
        this.formMode = mode;
        this.currentTaskId = taskId;
        
        // Reset form visibility
        document.getElementById('taskFields').style.display = 'block';
        document.getElementById('moveFields').style.display = 'none';
        document.getElementById('deleteConfirmation').style.display = 'none';
        document.getElementById('deleteBtn').style.display = 'none';
        document.getElementById('cancelBtn').style.display = 'inline-flex';
        
        const form = document.getElementById('addTaskForm');
        const title = document.getElementById('formTitle');
        const saveBtn = document.getElementById('saveBtnText');
        
        switch (mode) {
            case 'add':
                title.textContent = 'Tilføj ny opgave';
                saveBtn.textContent = 'Tilføj opgave';
                this.resetTaskForm();
                break;
                
            case 'edit':
                title.textContent = 'Rediger opgave';
                saveBtn.textContent = 'Gem ændringer';
                this.loadTaskForEdit(taskId);
                break;
                
            case 'delete':
                title.textContent = 'Slet opgave';
                document.getElementById('taskFields').style.display = 'none';
                document.getElementById('deleteConfirmation').style.display = 'block';
                document.getElementById('deleteBtn').style.display = 'inline-flex';
                document.getElementById('cancelBtn').style.display = 'none';
                saveBtn.textContent = 'Annuller';
                this.loadTaskForDelete(taskId);
                break;
                
            case 'move':
                title.textContent = 'Flyt opgave til ny dato';
                document.getElementById('taskFields').style.display = 'none';
                document.getElementById('moveFields').style.display = 'block';
                saveBtn.textContent = 'Flyt opgave';
                this.loadTaskForMove(taskId);
                break;
        }
        
        form.classList.add('show');
        if (mode === 'add' || mode === 'edit') {
            document.getElementById('taskTitle').focus();
        } else if (mode === 'move') {
            document.getElementById('moveTaskDate').focus();
        }
        this.initializeLucideIcons();
    }
    
    hideAddTaskForm() {
        document.getElementById('addTaskForm').classList.remove('show');
        this.resetTaskForm();
    }
    

    
    async confirmMoveTask() {
        if (!this.currentTaskId) return;
        
        const newDate = document.getElementById('moveTaskDate').value;
        if (!newDate) {
            alert('Vælg venligst en ny dato');
            return;
        }
        
        const copyTask = document.getElementById('copyTask').checked;
        
        if (copyTask) {
            // Copy task instead of moving
            await this.copyTaskToDate(this.currentTaskId, newDate);
        } else {
            // Move task as before
            await this.moveTaskToDate(this.currentTaskId, newDate);
        }
    }

    async moveTaskToDate(taskId, newDate) {
        try {
            const timestamp = Date.now();
            const response = await fetch(`/api/tasks/${taskId}/move?t=${timestamp}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache'
                },
                body: JSON.stringify({ newDate })
            });
            
            if (response.ok) {
                const result = await response.json();
                
                // Reload tasks to reflect changes
                await this.loadTasks();
                
                this.hideAddTaskForm();
                
                // Show success message
                this.showSuccessMessage(`Opgave flyttet til ${new Date(newDate).toLocaleDateString('da-DK')}`);
            } else {
                const error = await response.json();
                alert(`Fejl: ${error.error}`);
            }
        } catch (error) {
            alert('Der opstod en fejl ved flytning af opgaven');
        }
    }

    async copyTaskToDate(taskId, newDate) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;
        
        // Create a copy of the task with the new date
        const taskCopy = {
            title: task.title,
            project_id: task.project_id,
            is_recurring: task.is_recurring,
            recurrence_type: task.recurrence_type,
            recurrence_interval: task.recurrence_interval,
            start_date: newDate
        };
        
        try {
            const timestamp = Date.now();
            const response = await fetch(`/api/tasks?t=${timestamp}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache'
                },
                body: JSON.stringify(taskCopy)
            });
            
            if (response.ok) {
                const result = await response.json();
                
                // Reload tasks to reflect changes
                await this.loadTasks();
                
                this.hideAddTaskForm();
                
                // Show success message
                this.showSuccessMessage(`Opgave kopieret til ${new Date(newDate).toLocaleDateString('da-DK')}`);
            } else {
                const error = await response.json();
                alert(`Fejl: ${error.error}`);
            }
        } catch (error) {
            alert('Der opstod en fejl ved kopiering af opgaven');
        }
    }
    
    showSuccessMessage(message) {
        const messageEl = document.createElement('div');
        messageEl.className = 'success-message';
        messageEl.textContent = message;
        messageEl.style.cssText = `
            position: fixed;
            top: 80px;
            left: 50%;
            transform: translateX(-50%);
            background: #48bb78;
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            font-size: 14px;
            z-index: 1001;
            animation: slideDown 0.3s ease;
        `;
        
        document.body.appendChild(messageEl);
        
        setTimeout(() => {
            messageEl.remove();
        }, 3000);
    }
    
    // CRUD Operations for Tasks

    
    // CRUD Operations for Clients
    async createClient() {
        const name = document.getElementById('newClientName').value.trim();
        if (!name) return;
        
        try {
            const response = await fetch('/api/clients', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name })
            });
            
            if (response.ok) {
                const newClient = await response.json();
                this.clients.push(newClient);
                document.getElementById('newClientName').value = '';
                this.renderClientsList();
                this.updateClientOptions();
            }
        } catch (error) {
        }
    }
    
    async editClient(clientId, currentName) {
        const newName = prompt('Rediger kunde navn:', currentName);
        if (!newName || newName === currentName) return;
        
        try {
            const response = await fetch(`/api/clients/${clientId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newName })
            });
            
            if (response.ok) {
                const client = this.clients.find(c => c.id === clientId);
                if (client) client.name = newName;
                this.renderClientsList();
                this.updateClientOptions();
            }
        } catch (error) {
        }
    }
    
    async deleteClient(clientId) {
        if (!confirm('Er du sikker på, at du vil slette denne kunde?')) return;
        
        try {
            const response = await fetch(`/api/clients/${clientId}`, { method: 'DELETE' });
            if (response.ok) {
                this.clients = this.clients.filter(c => c.id !== clientId);
                this.renderClientsList();
                this.updateClientOptions();
                await this.loadProjects(); // Reload projects as they may be affected
            }
        } catch (error) {
        }
    }
    
    // CRUD Operations for Projects
    async createProject() {
        const name = document.getElementById('newProjectName').value.trim();
        const clientId = document.getElementById('projectClientSelect').value || null;
        if (!name) return;
        
        try {
            const response = await fetch('/api/projects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, client_id: clientId })
            });
            
            if (response.ok) {
                const newProject = await response.json();
                await this.loadProjects(); // Reload to get client_name
                document.getElementById('newProjectName').value = '';
                document.getElementById('projectClientSelect').value = '';
                this.renderProjectsList();
            }
        } catch (error) {
        }
    }
    
    async editProject(projectId, currentName, currentClientId) {
        const newName = prompt('Rediger projekt navn:', currentName);
        if (!newName || newName === currentName) return;
        
        try {
            const response = await fetch(`/api/projects/${projectId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newName, client_id: currentClientId })
            });
            
            if (response.ok) {
                const project = this.projects.find(p => p.id === projectId);
                if (project) project.name = newName;
                this.renderProjectsList();
            }
        } catch (error) {
        }
    }
    
    async deleteProject(projectId) {
        if (!confirm('Er du sikker på, at du vil slette dette projekt?')) return;
        
        try {
            const response = await fetch(`/api/projects/${projectId}`, { method: 'DELETE' });
            if (response.ok) {
                this.projects = this.projects.filter(p => p.id !== projectId);
                this.renderProjectsList();
                await this.loadTasks(); // Reload tasks as they may be affected
            }
        } catch (error) {
        }
    }
    
    updateDateBar() {
        const today = new Date();
        const dateItems = document.querySelectorAll('.date-item');
        
        // Set week start to Monday - always create a new Date object to avoid reference issues
        const tempDate = new Date(this.weekStartDate.getTime()); // Use getTime() for safe copy
        const day = tempDate.getDay();
        const diff = tempDate.getDate() - day + (day === 0 ? -6 : 1);
        tempDate.setDate(diff);
        this.weekStartDate = tempDate;
        
        dateItems.forEach((item, index) => {
            const date = new Date(this.weekStartDate);
            date.setDate(this.weekStartDate.getDate() + index);

            const dayNames = ['SØN', 'MAN', 'TIR', 'ONS', 'TOR', 'FRE', 'LØR'];
            const dayName = dayNames[date.getDay()];
            const dayNum = date.getDate();
            
            item.querySelector('.date-day').textContent = dayName;
            item.querySelector('.date-num').textContent = dayNum;
            
            // Mark selected date as active
            const isSelected = date.toDateString() === this.selectedDate.toDateString();
            item.classList.toggle('active', isSelected);
        });
    }
    
    renderClients() {
        const taskList = document.getElementById('taskList');
        taskList.innerHTML = `
            <div class="management-header">
                <h3 style="margin-bottom: 20px; color: #2d3748;">Kunde Administration</h3>
                <div class="add-form">
                    <input type="text" id="newClientName" placeholder="Kunde navn...">
                    <button onclick="taskAgent.createClient()">Tilføj kunde</button>
                </div>
            </div>
            <div class="scrollable-management-list">
                <ul class="management-list" id="clientsList"></ul>
            </div>
        `;
        this.renderClientsList();
    }
    
    openReportPage(reportType) {
        // Åbn rapporter i nyt vindue/tab
        window.open('/reports', '_blank');
    }
    
    renderProjects() {
        const taskList = document.getElementById('taskList');
        taskList.innerHTML = `
            <div class="management-header">
                <h3 style="margin-bottom: 20px; color: #2d3748;">Projekt Administration</h3>
                <div class="add-project-form">
                    <div class="add-form">
                        <input type="text" id="newProjectName" placeholder="Projekt navn...">
                        <button onclick="taskAgent.createProject()">Tilføj projekt</button>
                    </div>
                    <select id="projectClientSelect" style="width: 100%; padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 6px; margin-bottom: 20px;">
                        <option value="">Ingen kunde</option>
                        ${this.clients.map(client => `<option value="${client.id}">${client.name}</option>`).join('')}
                    </select>
                </div>
            </div>
            <div class="scrollable-management-list">
                <ul class="management-list" id="projectsList"></ul>
            </div>
        `;
        this.renderProjectsList();
    }
    
    renderReports() {
        const taskList = document.getElementById('taskList');
        taskList.innerHTML = `
            <div class="management-header">
                <h3 style="margin-bottom: 20px; color: #2d3748;">Rapporter & Analyser</h3>
                <p style="color: #718096; margin-bottom: 20px;">Klik på en rapport for at se detaljeret visning</p>
            </div>
            <div class="reports-grid">
                <div class="report-card" onclick="taskAgent.openReportPage('time')">
                    <div class="report-icon">⏱️</div>
                    <h4>Tidsrapport</h4>
                    <p>Se detaljeret tidsforbrug</p>
                </div>
                <div class="report-card" onclick="taskAgent.openReportPage('projects')">
                    <div class="report-icon">📁</div>
                    <h4>Projekt Analyse</h4>
                    <p>Projektstatistikker og forbrug</p>
                </div>
                <div class="report-card" onclick="taskAgent.openReportPage('clients')">
                    <div class="report-icon">🏢</div>
                    <h4>Kunde Analyse</h4>
                    <p>Kundestatistikker og forbrug</p>
                </div>
                <div class="report-card" onclick="taskAgent.openReportPage('productivity')">
                    <div class="report-icon">📈</div>
                    <h4>Produktivitet</h4>
                    <p>Daglige tendenser og mønstre</p>
                </div>
            </div>
        `;
    }
    
    renderClientsList() {
        const clientsList = document.getElementById('clientsList');
        if (!clientsList) return;
        
        clientsList.innerHTML = '';
        
        if (this.clients.length === 0) {
            clientsList.innerHTML = '<li style="text-align: center; padding: 40px; color: #a0aec0;">Ingen kunder oprettet endnu</li>';
            return;
        }
        
        this.clients.forEach(client => {
            const li = document.createElement('li');
            li.className = 'management-item';
            li.innerHTML = `
                <div>
                    <strong>${client.name}</strong>
                    <div style="font-size: 12px; color: #718096;">Oprettet: ${new Date(client.created_at).toLocaleDateString('da-DK')}</div>
                </div>
                <div>
                    <button class="edit-btn" data-client-id="${client.id}" data-client-name="${client.name}">✎</button>
                    <button class="delete-btn" data-client-id="${client.id}">×</button>
                </div>
            `;
            clientsList.appendChild(li);
        });
    }
    
    renderProjectsList() {
        const projectsList = document.getElementById('projectsList');
        if (!projectsList) return;
        
        projectsList.innerHTML = '';
        
        if (this.projects.length === 0) {
            projectsList.innerHTML = '<li style="text-align: center; padding: 40px; color: #a0aec0;">Ingen projekter oprettet endnu</li>';
            return;
        }
        
        this.projects.forEach(project => {
            const li = document.createElement('li');
            li.className = 'management-item';
            const buttonHTML = `
                <div>
                    <strong>${project.name}</strong>
                    ${project.client_name ? `<div style="font-size: 12px; color: #718096;">Kunde: ${project.client_name}</div>` : ''}
                    <div style="font-size: 12px; color: #718096;">Oprettet: ${new Date(project.created_at).toLocaleDateString('da-DK')}</div>
                </div>
                <div>
                    <button class="edit-btn" data-project-id="${project.id}" data-project-name="${project.name}" data-project-client-id="${project.client_id || ''}">✎</button>
                    <button class="delete-btn" data-project-id="${project.id}">×</button>
                </div>
            `;
            li.innerHTML = buttonHTML;
            projectsList.appendChild(li);
        });
    }
    
    toggleRecurringOptions(show) {
        const options = document.getElementById('recurringOptions');
        options.style.display = show ? 'block' : 'none';
        if (show) {
            this.updateRecurrenceDescription();
        }
    }
    
    updateRecurrenceDescription() {
        const type = document.getElementById('recurrenceType').value;
        const interval = parseInt(document.getElementById('recurrenceInterval').value) || 1;
        const description = document.getElementById('recurrenceDescription');
        
        let text = 'Gentages ';
        
        if (interval === 1) {
            switch (type) {
                case 'daily': text += 'hver dag'; break;
                case 'weekly': text += 'hver uge'; break;
                case 'monthly': text += 'hver måned'; break;
                case 'yearly': text += 'hvert år'; break;
            }
        } else {
            switch (type) {
                case 'daily': text += `hver ${interval}. dag`; break;
                case 'weekly': text += `hver ${interval}. uge`; break;
                case 'monthly': text += `hver ${interval}. måned`; break;
                case 'yearly': text += `hvert ${interval}. år`; break;
            }
        }
        
        description.textContent = text;
    }
    
    loadTaskForEdit(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;
        
        document.getElementById('taskTitle').value = task.title;
        document.getElementById('taskNotes').value = task.notes || '';
        
        // Find client_id from project if task has a project
        let clientId = '';
        if (task.project_id) {
            const project = this.projects.find(p => p.id === task.project_id);
            if (project && project.client_id) {
                clientId = project.client_id;
            }
        }
        
        // Set client first
        document.getElementById('clientSelect').value = clientId;
        
        // Update project options based on selected client
        this.updateProjectOptions(clientId);
        
        // Then set project
        document.getElementById('projectSelect').value = task.project_id || '';
        
        document.getElementById('isRecurring').checked = !!task.is_recurring;
        
        if (task.is_recurring) {
            document.getElementById('recurrenceType').value = task.recurrence_type || 'daily';
            document.getElementById('recurrenceInterval').value = task.recurrence_interval || 1;
            this.toggleRecurringOptions(true);
        } else {
            this.toggleRecurringOptions(false);
        }
    }
    
    loadTaskForDelete(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;
        
        document.getElementById('deleteTaskTitle').textContent = task.title;
        
        // Vis recurring options hvis opgaven er gentagen
        const recurringOptions = document.getElementById('deleteRecurringOptions');
        if (task.is_recurring) {
            recurringOptions.style.display = 'block';
            // Reset til default (kun denne forekomst)
            document.querySelector('input[name="deleteRecurringType"][value="this"]').checked = true;
        } else {
            recurringOptions.style.display = 'none';
        }
        
        this.initializeLucideIcons();
    }
    
    loadTaskForMove(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;
        
        document.getElementById('moveTaskTitle').textContent = task.title;
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('moveTaskDate').value = today;
        document.getElementById('copyTask').checked = false;
    }

    updateMoveFormTitle(isCopy) {
        const title = document.getElementById('formTitle');
        const saveBtn = document.getElementById('saveBtnText');
        
        if (isCopy) {
            title.textContent = 'Kopier opgave til ny dato';
            saveBtn.textContent = 'Kopier opgave';
        } else {
            title.textContent = 'Flyt opgave til ny dato';
            saveBtn.textContent = 'Flyt opgave';
        }
    }

    resetTaskForm() {
        document.getElementById('taskTitle').value = '';
        document.getElementById('taskNotes').value = '';
        document.getElementById('clientSelect').value = '';
        document.getElementById('projectSelect').value = '';
        document.getElementById('isRecurring').checked = false;
        document.getElementById('recurrenceType').value = 'daily';
        document.getElementById('recurrenceInterval').value = '1';
        this.toggleRecurringOptions(false);
        
        // Reset form mode
        this.formMode = 'add';
        this.currentTaskId = null;
    }
    
    // ===== POMODORO FUNCTIONALITY =====
    
    openPomodoro() {
        document.getElementById('pomodoroModal').style.display = 'flex';
        this.updatePomodoroDisplay();
    }
    
    closePomodoro() {
        document.getElementById('pomodoroModal').style.display = 'none';
        if (this.pomodoroActive) {
            this.pausePomodoro();
        }
    }
    
    togglePomodoro() {
        if (this.pomodoroActive) {
            this.pausePomodoro();
        } else {
            this.startPomodoro();
        }
    }
    
    startPomodoro() {
        this.pomodoroActive = true;
        
        // Update button appearance
        const playPauseBtn = document.getElementById('playPauseBtn');
        playPauseBtn.innerHTML = '<i data-lucide="pause"></i><span>Pause</span>';
        
        // Update pomodoro button in header
        const pomodoroBtn = document.querySelector('.pomodoro-btn');
        pomodoroBtn.classList.add('active');
        
        // Start countdown
        this.pomodoroTimer = setInterval(() => {
            this.pomodoroTimeLeft--;
            this.updatePomodoroDisplay();
            
            // Check if session is complete
            if (this.pomodoroTimeLeft <= 0) {
                this.completePomodoroSession();
            }
        }, 1000);
        
        // Re-initialize Lucide icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }
    
    pausePomodoro() {
        this.pomodoroActive = false;
        
        if (this.pomodoroTimer) {
            clearInterval(this.pomodoroTimer);
            this.pomodoroTimer = null;
        }
        
        // Update button appearance
        const playPauseBtn = document.getElementById('playPauseBtn');
        playPauseBtn.innerHTML = '<i data-lucide="play"></i><span>Start</span>';
        
        // Update pomodoro button in header
        const pomodoroBtn = document.querySelector('.pomodoro-btn');
        pomodoroBtn.classList.remove('active');
        
        // Re-initialize Lucide icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }
    
    skipPomodoro() {
        this.completePomodoroSession();
    }
    
    resetPomodoro() {
        // Pause timer if running
        this.pausePomodoro();
        
        // Reset to work session
        this.pomodoroSession = 1;
        this.pomodoroType = 'work';
        this.pomodoroTimeLeft = this.pomodoroSettings.work;
        
        // Update display
        this.updatePomodoroDisplay();
        this.updateSessionDots();
    }
    
    completePomodoroSession() {
        // Pause current session
        this.pausePomodoro();
        
        // Handle task integration
        this.onPomodoroWorkComplete();
        
        // Show notification
        this.showPomodoroNotification();
        
        // Determine next session type
        if (this.pomodoroType === 'work') {
            if (this.pomodoroSession === 4) {
                // Long break after 4th session
                this.pomodoroType = 'longBreak';
                this.pomodoroTimeLeft = this.pomodoroSettings.longBreak;
            } else {
                // Short break
                this.pomodoroType = 'shortBreak';
                this.pomodoroTimeLeft = this.pomodoroSettings.shortBreak;
            }
        } else {
            // Break is over, start next work session
            this.pomodoroType = 'work';
            this.pomodoroTimeLeft = this.pomodoroSettings.work;
            
            if (this.pomodoroSession === 4) {
                // Reset after long break
                this.pomodoroSession = 1;
            } else {
                // Increment session
                this.pomodoroSession++;
            }
        }
        
        // Update display
        this.updatePomodoroDisplay();
        this.updateSessionDots();
        
        // Auto-start next session (optional - can be removed if manual start is preferred)
        setTimeout(() => {
            if (document.getElementById('pomodoroModal').style.display === 'flex') {
                this.startPomodoro();
            }
        }, 2000);
    }
    
    updatePomodoroDisplay() {
        // Update timer display with clear minutes and seconds
        const minutes = Math.floor(this.pomodoroTimeLeft / 60);
        const seconds = this.pomodoroTimeLeft % 60;
        
        // Format with explicit minutes and seconds labels for maximum clarity
        const timeText = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        const timeTextElement = document.querySelector('#pomodoroModal .time-text');
        if (timeTextElement) {
            timeTextElement.textContent = timeText;
        }
        
        // Update session type display
        const sessionTypeText = this.pomodoroType === 'work' ? 'Arbejd' : 
                               this.pomodoroType === 'shortBreak' ? 'Kort pause' : 'Lang pause';
        const sessionTypeElement = document.querySelector('#pomodoroModal .session-type');
        if (sessionTypeElement) {
            sessionTypeElement.textContent = sessionTypeText;
        }
        
        // Update session counter
        if (this.pomodoroType === 'work') {
            document.getElementById('currentSession').textContent = this.pomodoroSession;
        }
        
        // Update circular progress
        const totalTime = this.pomodoroSettings[this.pomodoroType];
        const progress = (totalTime - this.pomodoroTimeLeft) / totalTime;
        const circumference = 2 * Math.PI * 90; // radius = 90
        const offset = circumference * (1 - progress);
        
        const progressCircle = document.querySelector('#pomodoroModal .timer-progress');
        if (progressCircle) {
            progressCircle.style.strokeDashoffset = offset;
            
            // Change color based on session type
            if (this.pomodoroType === 'work') {
                progressCircle.style.stroke = '#dc3545'; // Red for work
            } else {
                progressCircle.style.stroke = '#28a745'; // Green for breaks
            }
        }
    }
    
    updateSessionDots() {
        const dots = document.querySelectorAll('.dot');
        
        dots.forEach((dot, index) => {
            dot.classList.remove('active', 'completed');
            
            if (index + 1 < this.pomodoroSession) {
                dot.classList.add('completed');
            } else if (index + 1 === this.pomodoroSession && this.pomodoroType === 'work') {
                dot.classList.add('active');
            }
        });
    }
    
    showPomodoroNotification() {
        const sessionComplete = this.pomodoroType === 'work' ? 
                               `Arbejdssession ${this.pomodoroSession} fuldført!` :
                               'Pause fuldført!';
        
        const nextSession = this.pomodoroType === 'work' ?
                           (this.pomodoroSession === 4 ? 'Lang pause starter' : 'Kort pause starter') :
                           (this.pomodoroSession === 4 ? 'Ny cyklus starter' : `Session ${this.pomodoroSession + 1} starter`);
        
        // Browser notification (if permission granted)
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('TaskAgent Pomodoro', {
                body: `${sessionComplete} ${nextSession}`,
                icon: '/icons/icon-192x192.png'
            });
        }
        
        // Visual notification in app
        const notification = document.createElement('div');
        notification.className = 'pomodoro-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <h3>${sessionComplete}</h3>
                <p>${nextSession}</p>
            </div>
        `;
        
        // Add notification styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: white;
            border-radius: 12px;
            padding: 20px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            z-index: 1001;
            max-width: 300px;
            border-left: 4px solid #dc3545;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        // Remove notification after 4 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 4000);
        
        // Add CSS animations if not already present
        if (!document.querySelector('#pomodoro-animations')) {
            const style = document.createElement('style');
            style.id = 'pomodoro-animations';
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.taskAgent = new TaskAgent();
});