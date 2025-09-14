class TaskAgent {
    constructor() {
        this.tasks = [];
        this.projects = [];
        this.clients = [];
        this.recurringCompletions = [];
        this.selectedDate = new Date();
        this.weekStartDate = new Date();
        this.activeTimer = null;
        this.currentView = 'tasks';
        this.searchQuery = '';
        this.isTimerRunning = false;
        this.timerInterval = null;
        this.timerStartTime = null;
        this.activeTaskId = null;
        
        // Move task functionality
        this.selectedTaskForMove = null;
        
        // Pause functionality
        this.isPaused = false;
        this.pauseInterval = null;
        this.pauseStartTime = null;
        this.pauseDuration = 0; // in minutes
        
        // PWA functionality
        this.deferredPrompt = null;
        this.isInstalled = false;
        
        this.init();
    }
    
    async init() {
        this.initializeEventListeners();
        await this.loadClients();
        await this.loadProjects();
        await this.loadTasks();
        this.updateDateDisplay();
        this.initializePWA();
        this.initializeLucideIcons();
    }
    
    initializePWA() {
        // Register service worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                    console.log('PWA: Service Worker registered:', registration);
                })
                .catch(error => {
                    console.error('PWA: Service Worker registration failed:', error);
                });
        }
        
        // Handle PWA installation prompt
        window.addEventListener('beforeinstallprompt', (e) => {
            console.log('PWA: Installation prompt available');
            e.preventDefault();
            this.deferredPrompt = e;
            this.showInstallButton();
        });
        
        // Handle PWA installation
        window.addEventListener('appinstalled', () => {
            console.log('PWA: App installed successfully');
            this.isInstalled = true;
            this.hideInstallButton();
            this.showInstallSuccessMessage();
        });
        
        // Check if already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            this.isInstalled = true;
            console.log('PWA: Running in standalone mode');
        }
        
        // Handle URL parameters for shortcuts
        this.handleShortcutActions();
        
        // Request notification permission
        this.requestNotificationPermission();
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
        
        console.log('PWA: Installation choice:', outcome);
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
            console.log('PWA: Notification permission:', permission);
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
            console.log('Click detected:', e.target.className, e.target.tagName, e.target.dataset);
            
            // Find the actual button element (could be clicked on icon inside)
            const editBtn = e.target.closest('.edit-btn');
            const deleteBtn = e.target.closest('.delete-btn'); 
            const moveBtn = e.target.closest('.move-btn');
            
            if (editBtn) {
                console.log('Edit button clicked');
                e.preventDefault();
                e.stopPropagation();
                const taskId = parseInt(editBtn.getAttribute('data-task-id'));
                const clientId = parseInt(editBtn.getAttribute('data-client-id'));
                const projectId = parseInt(editBtn.getAttribute('data-project-id'));
                
                console.log('IDs found:', { taskId, clientId, projectId });
                
                if (taskId) {
                    console.log('Editing task:', taskId);
                    this.editTask(taskId);
                } else if (clientId) {
                    const clientName = e.target.getAttribute('data-client-name');
                    console.log('Editing client:', clientId, clientName);
                    this.editClient(clientId, clientName);
                } else if (projectId) {
                    const projectName = editBtn.getAttribute('data-project-name');
                    const projectClientId = editBtn.getAttribute('data-project-client-id');
                    console.log('Editing project:', projectId, projectName);
                    this.editProject(projectId, projectName, projectClientId);
                }
            } else if (deleteBtn) {
                console.log('Delete button clicked');
                e.preventDefault();
                e.stopPropagation();
                const taskId = parseInt(deleteBtn.getAttribute('data-task-id'));
                const clientId = parseInt(deleteBtn.getAttribute('data-client-id'));
                const projectId = parseInt(deleteBtn.getAttribute('data-project-id'));
                
                console.log('IDs found for delete:', { taskId, clientId, projectId });
                
                if (taskId) {
                    console.log('Deleting task:', taskId);
                    this.deleteTask(taskId);
                } else if (clientId) {
                    console.log('Deleting client:', clientId);
                    this.deleteClient(clientId);
                } else if (projectId) {
                    console.log('Deleting project:', projectId);
                    this.deleteProject(projectId);
                }
            } else if (moveBtn) {
                console.log('Move button clicked');
                e.preventDefault();
                e.stopPropagation();
                const taskId = parseInt(moveBtn.getAttribute('data-task-id'));
                
                if (taskId) {
                    console.log('Moving task:', taskId);
                    this.showMoveTaskModal(taskId);
                }
            }
        });
        
        // Move task modal event listeners
        document.getElementById('cancelMoveBtn').addEventListener('click', () => {
            this.hideMoveTaskModal();
        });
        
        document.getElementById('confirmMoveBtn').addEventListener('click', () => {
            this.confirmMoveTask();
        });
        
        // Close move modal when clicking outside
        document.getElementById('moveTaskModal').addEventListener('click', (e) => {
            if (e.target.id === 'moveTaskModal') {
                this.hideMoveTaskModal();
            }
        });
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
            const response = await fetch(`/recurring-completions?t=${timestamp}`, {
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                }
            });
            if (response.ok) {
                this.recurringCompletions = await response.json();
            }
        } catch (error) {
            console.error('Error loading recurring completions:', error);
        }
    }

    async loadTasks() {
        try {
            const timestamp = Date.now();
            console.log('Loading tasks with timestamp:', timestamp);
            const response = await fetch(`/tasks?t=${timestamp}`, {
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                }
            });
            if (response.ok) {
                this.tasks = await response.json();
                console.log('Loaded tasks from server:', this.tasks.length);
                await this.loadRecurringCompletions();
                this.renderTasks();
            }
        } catch (error) {
            console.error('Error loading tasks:', error);
        }
    }
    
    async loadClients() {
        try {
            const timestamp = Date.now();
            const response = await fetch(`/clients?t=${timestamp}`, {
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
            console.error('Error loading clients:', error);
        }
    }
    
    async loadProjects() {
        try {
            const timestamp = Date.now();
            const response = await fetch(`/projects?t=${timestamp}`, {
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
            console.error('Error loading projects:', error);
        }
    }
    
    async saveTask() {
        const title = document.getElementById('taskTitle').value.trim();
        if (!title) return;
        
        const clientId = document.getElementById('clientSelect').value || null;
        const projectId = document.getElementById('projectSelect').value || null;
        const isRecurring = document.getElementById('isRecurring').checked;
        
        const taskData = {
            title: title,
            project_id: projectId
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
            console.log('Creating new task:', taskData);
            
            const timestamp = Date.now();
            const response = await fetch(`/tasks?t=${timestamp}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache'
                },
                body: JSON.stringify(taskData)
            });
            
            console.log('Create task response status:', response.status);
            
            if (response.ok) {
                const newTask = await response.json();
                console.log('New task created:', newTask);
                
                // Reload all tasks to ensure consistency
                console.log('Reloading tasks after creation...');
                await this.loadTasks();
                console.log('Tasks reloaded, current count:', this.tasks.length);
                
                this.hideAddTaskForm();
                this.resetTaskForm();
                
                // Show success message
                console.log('Task list updated after creation');
            } else {
                console.error('Failed to create task:', response.status, response.statusText);
            }
        } catch (error) {
            console.error('Error saving task:', error);
        }
    }
    
    async toggleTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;
        
        try {
            // For gentagende opgaver, håndter completion anderledes
            if (task.is_recurring) {
                const completionDate = this.selectedDate.toISOString().split('T')[0];
                const isCompleted = this.isRecurringTaskCompletedOnDate(taskId, completionDate);
                
                if (isCompleted) {
                    // Fjern completion for denne dato
                    const response = await fetch(`/tasks/${taskId}/uncomplete-recurring`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ date: completionDate })
                    });
                    
                    if (response.ok) {
                        // Fjern fra lokale completions
                        this.recurringCompletions = this.recurringCompletions.filter(
                            c => !(c.task_id === taskId && c.completion_date === completionDate)
                        );
                        this.renderTasks();
                    }
                } else {
                    // Marker som udført for denne dato
                    const response = await fetch(`/tasks/${taskId}/complete-recurring`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ date: completionDate })
                    });
                    
                    if (response.ok) {
                        // Tilføj til lokale completions
                        this.recurringCompletions.push({
                            task_id: taskId,
                            completion_date: completionDate,
                            completed_at: new Date().toISOString()
                        });
                        this.renderTasks();
                    }
                }
            } else {
                // Normal opgave - samme logik som før
                if (task.completed) {
                    // Unmark as completed
                    const response = await fetch(`/tasks/${taskId}/uncomplete`, {
                        method: 'POST'
                    });
                    
                    if (response.ok) {
                        task.completed = false;
                        task.completed_at = null;
                        this.renderTasks();
                    }
                } else {
                    // Mark as completed
                    const response = await fetch(`/tasks/${taskId}/complete`, {
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
            console.error('Error toggling task:', error);
        }
    }
    
    async startTimer(taskId) {
        // Stop any existing timer
        if (this.activeTaskId) {
            await this.stopTimer();
        }
        
        try {
            const response = await fetch(`/tasks/${taskId}/start`, {
                method: 'POST'
            });
            
            if (response.ok) {
                this.activeTaskId = taskId;
                this.timerStartTime = Date.now();
                
                // Start the timer display
                this.timerInterval = setInterval(() => {
                    this.updateTimerDisplay();
                }, 1000);
                
                document.getElementById('timerDisplay').classList.add('active');
                this.renderTasks();
            }
        } catch (error) {
            console.error('Error starting timer:', error);
        }
    }
    
    async stopTimer() {
        if (!this.activeTaskId) return;
        
        try {
            const response = await fetch(`/tasks/${this.activeTaskId}/stop`, {
                method: 'POST'
            });
            
            if (response.ok) {
                this.activeTaskId = null;
                this.timerStartTime = null;
                
                if (this.timerInterval) {
                    clearInterval(this.timerInterval);
                    this.timerInterval = null;
                }
                
                document.getElementById('timerDisplay').classList.remove('active');
                await this.loadTasks(); // Reload to get updated times
            }
        } catch (error) {
            console.error('Error stopping timer:', error);
        }
    }
    
    updateTimerDisplay() {
        if (!this.timerStartTime) return;
        
        const elapsed = Date.now() - this.timerStartTime;
        const hours = Math.floor(elapsed / 3600000);
        const minutes = Math.floor((elapsed % 3600000) / 60000);
        const seconds = Math.floor((elapsed % 60000) / 1000);
        
        const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        document.getElementById('timerDisplay').textContent = timeString;
        
        // Update the task timer in real-time
        if (this.activeTaskId) {
            const taskElement = document.querySelector(`[data-task-id="${this.activeTaskId}"] .task-timer`);
            if (taskElement) {
                const task = this.tasks.find(t => t.id === this.activeTaskId);
                const baseTime = task ? task.time_spent || 0 : 0;
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
        this.weekStartDate.setDate(this.weekStartDate.getDate() + (direction * 7));
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
        
        // Update selected date
        const dayIndex = Array.from(dateElement.parentNode.children).indexOf(dateElement) - 1; // -1 for prev button
        if (dayIndex >= 0 && dayIndex < 7) {
            this.selectedDate = new Date(this.weekStartDate);
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
        return this.recurringCompletions.some(
            c => c.task_id === taskId && c.completion_date === date
        );
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
            
            const totalTime = this.formatTime(task.time_spent || 0);
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
                    <div>${task.title}</div>
                    <div class="task-timer">${totalTime}</div>
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
        if (seconds < 60) {
            return `${seconds}s`;
        } else if (seconds < 3600) {
            const minutes = Math.floor(seconds / 60);
            return `${minutes}m`;
        } else {
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            return `${hours}h ${minutes}m`;
        }
    }
    
    initializeLucideIcons() {
        // Initialize Lucide icons after DOM updates
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }
    
    showAddTaskForm() {
        document.getElementById('addTaskForm').classList.add('show');
        document.getElementById('taskTitle').focus();
        this.initializeLucideIcons();
    }
    
    hideAddTaskForm() {
        document.getElementById('addTaskForm').classList.remove('show');
        this.resetTaskForm();
    }
    
    showMoveTaskModal(taskId) {
        this.selectedTaskForMove = taskId;
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;
        
        // Set task title in preview
        document.getElementById('moveTaskTitle').textContent = task.title;
        
        // Set current date as default
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('moveTaskDate').value = today;
        
        // Show modal
        document.getElementById('moveTaskModal').classList.add('show');
        document.getElementById('moveTaskDate').focus();
        this.initializeLucideIcons();
    }
    
    hideMoveTaskModal() {
        document.getElementById('moveTaskModal').classList.remove('show');
        this.selectedTaskForMove = null;
    }
    
    async confirmMoveTask() {
        if (!this.selectedTaskForMove) return;
        
        const newDate = document.getElementById('moveTaskDate').value;
        if (!newDate) {
            alert('Vælg venligst en ny dato');
            return;
        }
        
        try {
            const timestamp = Date.now();
            const response = await fetch(`/tasks/${this.selectedTaskForMove}/move?t=${timestamp}`, {
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
                console.log('Task moved successfully:', result);
                
                // Reload tasks to reflect changes
                await this.loadTasks();
                
                this.hideMoveTaskModal();
                
                // Show success message
                this.showSuccessMessage(`Opgave flyttet til ${new Date(newDate).toLocaleDateString('da-DK')}`);
            } else {
                const error = await response.json();
                alert(`Fejl: ${error.error}`);
            }
        } catch (error) {
            console.error('Error moving task:', error);
            alert('Der opstod en fejl ved flytning af opgaven');
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
    async editTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;
        
        const newTitle = prompt('Rediger opgave titel:', task.title);
        if (!newTitle || newTitle === task.title) return;
        
        try {
            const response = await fetch(`/tasks/${taskId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: newTitle, completed: task.completed })
            });
            
            if (response.ok) {
                task.title = newTitle;
                this.renderTasks();
            }
        } catch (error) {
            console.error('Error updating task:', error);
        }
    }
    
    async deleteTask(taskId) {
        if (!confirm('Er du sikker på, at du vil slette denne opgave?')) return;
        
        try {
            const response = await fetch(`/tasks/${taskId}`, { method: 'DELETE' });
            if (response.ok) {
                this.tasks = this.tasks.filter(t => t.id !== taskId);
                this.renderTasks();
            }
        } catch (error) {
            console.error('Error deleting task:', error);
        }
    }
    
    // CRUD Operations for Clients
    async createClient() {
        const name = document.getElementById('newClientName').value.trim();
        if (!name) return;
        
        try {
            const response = await fetch('/clients', {
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
            console.error('Error creating client:', error);
        }
    }
    
    async editClient(clientId, currentName) {
        const newName = prompt('Rediger kunde navn:', currentName);
        if (!newName || newName === currentName) return;
        
        try {
            const response = await fetch(`/clients/${clientId}`, {
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
            console.error('Error updating client:', error);
        }
    }
    
    async deleteClient(clientId) {
        if (!confirm('Er du sikker på, at du vil slette denne kunde?')) return;
        
        try {
            const response = await fetch(`/clients/${clientId}`, { method: 'DELETE' });
            if (response.ok) {
                this.clients = this.clients.filter(c => c.id !== clientId);
                this.renderClientsList();
                this.updateClientOptions();
                await this.loadProjects(); // Reload projects as they may be affected
            }
        } catch (error) {
            console.error('Error deleting client:', error);
        }
    }
    
    // CRUD Operations for Projects
    async createProject() {
        const name = document.getElementById('newProjectName').value.trim();
        const clientId = document.getElementById('projectClientSelect').value || null;
        if (!name) return;
        
        try {
            const response = await fetch('/projects', {
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
            console.error('Error creating project:', error);
        }
    }
    
    async editProject(projectId, currentName, currentClientId) {
        const newName = prompt('Rediger projekt navn:', currentName);
        if (!newName || newName === currentName) return;
        
        try {
            const response = await fetch(`/projects/${projectId}`, {
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
            console.error('Error updating project:', error);
        }
    }
    
    async deleteProject(projectId) {
        if (!confirm('Er du sikker på, at du vil slette dette projekt?')) return;
        
        try {
            const response = await fetch(`/projects/${projectId}`, { method: 'DELETE' });
            if (response.ok) {
                this.projects = this.projects.filter(p => p.id !== projectId);
                this.renderProjectsList();
                await this.loadTasks(); // Reload tasks as they may be affected
            }
        } catch (error) {
            console.error('Error deleting project:', error);
        }
    }
    
    updateDateBar() {
        const today = new Date();
        const dateItems = document.querySelectorAll('.date-item');
        
        // Set week start to Monday
        const monday = new Date(this.weekStartDate);
        const day = monday.getDay();
        const diff = monday.getDate() - day + (day === 0 ? -6 : 1);
        monday.setDate(diff);
        this.weekStartDate = monday;
        
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
            console.log('Created project item:', project.id, buttonHTML);
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
    
    resetTaskForm() {
        document.getElementById('taskTitle').value = '';
        document.getElementById('clientSelect').value = '';
        document.getElementById('projectSelect').value = '';
        document.getElementById('isRecurring').checked = false;
        document.getElementById('recurrenceType').value = 'daily';
        document.getElementById('recurrenceInterval').value = '1';
        this.toggleRecurringOptions(false);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.taskAgent = new TaskAgent();
});