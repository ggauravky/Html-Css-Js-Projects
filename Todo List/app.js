class TodoApp {
    constructor() {
        this.tasks = JSON.parse(localStorage.getItem('todoTasks')) || [];
        this.currentFilter = 'all';
        this.currentSort = 'created';
        this.searchQuery = '';
        this.editingTaskId = null;
        this.timerInterval = null;
        this.timerMinutes = 25;
        this.timerSeconds = 0;
        this.isTimerRunning = false;
        this.stats = JSON.parse(localStorage.getItem('todoStats')) || {
            totalCreated: 0,
            totalCompleted: 0,
            streakDays: 0,
            lastCompletionDate: null
        };

        this.initializeApp();
    }

    initializeApp() {
        this.setupEventListeners();
        this.updateDateDisplay();
        this.renderTasks();
        this.updateStats();
        this.loadTheme();
        this.setupNaturalLanguageInput();
    }

    setupEventListeners() {
        // Task input and management
        document.getElementById('add-task-btn').addEventListener('click', () => this.addTask());
        document.getElementById('task-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTask();
        });

        // Search and filter
        document.getElementById('search-input').addEventListener('input', (e) => {
            this.searchQuery = e.target.value.toLowerCase();
            this.renderTasks();
        });

        document.getElementById('clear-search').addEventListener('click', () => {
            document.getElementById('search-input').value = '';
            this.searchQuery = '';
            this.renderTasks();
        });

        document.getElementById('sort-select').addEventListener('change', (e) => {
            this.currentSort = e.target.value;
            this.renderTasks();
        });

        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentFilter = btn.dataset.filter;
                this.renderTasks();
            });
        });

        // Theme toggle
        document.getElementById('theme-toggle').addEventListener('click', () => this.toggleTheme());

        // Modal controls
        this.setupModalControls();

        // Focus timer
        this.setupFocusTimer();

        // Keyboard shortcuts
        this.setupKeyboardShortcuts();

        // Drag and drop
        this.setupDragAndDrop();
    }

    setupModalControls() {
        // Generic modal close
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.target.closest('.modal').classList.remove('active');
            });
        });

        // Click outside modal to close
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('active');
                }
            });
        });

        // Stats modal
        document.getElementById('stats-btn').addEventListener('click', () => {
            document.getElementById('stats-modal').classList.add('active');
            this.updateDetailedStats();
        });

        // Focus timer modal
        document.getElementById('focus-timer-btn').addEventListener('click', () => {
            document.getElementById('focus-timer-modal').classList.add('active');
        });

        // Task edit modal
        document.getElementById('save-edit').addEventListener('click', () => this.saveTaskEdit());
        document.getElementById('cancel-edit').addEventListener('click', () => {
            document.getElementById('task-edit-modal').classList.remove('active');
        });
    }

    setupFocusTimer() {
        document.getElementById('start-timer').addEventListener('click', () => this.startTimer());
        document.getElementById('pause-timer').addEventListener('click', () => this.pauseTimer());
        document.getElementById('reset-timer').addEventListener('click', () => this.resetTimer());

        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const minutes = parseInt(e.target.dataset.minutes);
                this.setTimer(minutes, 0);
            });
        });
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + Enter to add task
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                this.addTask();
            }

            // Ctrl/Cmd + F to focus search
            if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
                e.preventDefault();
                document.getElementById('search-input').focus();
            }

            // Escape to close modals
            if (e.key === 'Escape') {
                document.querySelectorAll('.modal.active').forEach(modal => {
                    modal.classList.remove('active');
                });
            }
        });
    }

    setupDragAndDrop() {
        // Will be implemented when rendering tasks
    }

    setupNaturalLanguageInput() {
        const taskInput = document.getElementById('task-input');
        const prioritySelect = document.getElementById('priority-select');
        const categorySelect = document.getElementById('category-select');
        const dueDateInput = document.getElementById('due-date-input');

        taskInput.addEventListener('input', (e) => {
            const text = e.target.value.toLowerCase();
            
            // Detect priority keywords
            if (text.includes('urgent') || text.includes('important') || text.includes('high priority')) {
                prioritySelect.value = 'high';
            } else if (text.includes('medium priority')) {
                prioritySelect.value = 'medium';
            } else if (text.includes('low priority')) {
                prioritySelect.value = 'low';
            }

            // Detect category keywords
            if (text.includes('work') || text.includes('office') || text.includes('meeting')) {
                categorySelect.value = 'work';
            } else if (text.includes('personal') || text.includes('home') || text.includes('family')) {
                categorySelect.value = 'personal';
            } else if (text.includes('urgent')) {
                categorySelect.value = 'urgent';
            }

            // Detect date keywords
            const today = new Date();
            if (text.includes('today')) {
                dueDateInput.value = today.toISOString().split('T')[0];
            } else if (text.includes('tomorrow')) {
                const tomorrow = new Date(today);
                tomorrow.setDate(tomorrow.getDate() + 1);
                dueDateInput.value = tomorrow.toISOString().split('T')[0];
            } else if (text.includes('next week')) {
                const nextWeek = new Date(today);
                nextWeek.setDate(nextWeek.getDate() + 7);
                dueDateInput.value = nextWeek.toISOString().split('T')[0];
            }
        });
    }

    addTask() {
        const taskInput = document.getElementById('task-input');
        const title = taskInput.value.trim();
        
        if (!title) return;

        // Clean title from natural language keywords
        const cleanTitle = title
            .replace(/\b(high|medium|low)\s+priority\b/gi, '')
            .replace(/\b(urgent|important)\b/gi, '')
            .replace(/\b(today|tomorrow|next week)\b/gi, '')
            .replace(/\b(work|personal|urgent)\b/gi, '')
            .trim();

        const task = {
            id: Date.now(),
            title: cleanTitle || title,
            description: '',
            completed: false,
            priority: document.getElementById('priority-select').value,
            category: document.getElementById('category-select').value,
            dueDate: document.getElementById('due-date-input').value || null,
            createdAt: new Date().toISOString(),
            completedAt: null
        };

        this.tasks.unshift(task);
        this.stats.totalCreated++;
        this.saveToLocalStorage();
        this.renderTasks();
        this.updateStats();
        
        // Clear form
        taskInput.value = '';
        document.getElementById('due-date-input').value = '';
        
        // Add animation
        const taskElement = document.querySelector('.task-item');
        if (taskElement) {
            taskElement.classList.add('fade-in');
        }

        // Show success feedback
        this.showNotification('Task added successfully!', 'success');
    }

    toggleTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (!task) return;

        task.completed = !task.completed;
        task.completedAt = task.completed ? new Date().toISOString() : null;

        if (task.completed) {
            this.stats.totalCompleted++;
            this.updateStreak();
            this.showNotification('Task completed! 🎉', 'success');
        } else {
            this.stats.totalCompleted--;
        }

        this.saveToLocalStorage();
        this.renderTasks();
        this.updateStats();
    }

    editTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (!task) return;

        this.editingTaskId = id;
        document.getElementById('edit-task-title').value = task.title;
        document.getElementById('edit-task-description').value = task.description;
        document.getElementById('edit-priority').value = task.priority;
        document.getElementById('edit-category').value = task.category;
        document.getElementById('edit-due-date').value = task.dueDate || '';
        
        document.getElementById('task-edit-modal').classList.add('active');
    }

    saveTaskEdit() {
        const task = this.tasks.find(t => t.id === this.editingTaskId);
        if (!task) return;

        task.title = document.getElementById('edit-task-title').value.trim();
        task.description = document.getElementById('edit-task-description').value.trim();
        task.priority = document.getElementById('edit-priority').value;
        task.category = document.getElementById('edit-category').value;
        task.dueDate = document.getElementById('edit-due-date').value || null;

        this.saveToLocalStorage();
        this.renderTasks();
        document.getElementById('task-edit-modal').classList.remove('active');
        this.showNotification('Task updated successfully!', 'success');
    }

    deleteTask(id) {
        if (!confirm('Are you sure you want to delete this task?')) return;

        this.tasks = this.tasks.filter(t => t.id !== id);
        this.saveToLocalStorage();
        this.renderTasks();
        this.updateStats();
        this.showNotification('Task deleted', 'info');
    }

    renderTasks() {
        const taskList = document.getElementById('task-list');
        const emptyState = document.getElementById('empty-state');
        
        let filteredTasks = this.getFilteredTasks();
        filteredTasks = this.sortTasks(filteredTasks);

        taskList.innerHTML = '';

        if (filteredTasks.length === 0) {
            emptyState.classList.add('visible');
            return;
        }

        emptyState.classList.remove('visible');

        filteredTasks.forEach(task => {
            const taskElement = this.createTaskElement(task);
            taskList.appendChild(taskElement);
        });

        // Setup drag and drop for current tasks
        this.setupTaskDragAndDrop();
    }

    createTaskElement(task) {
        const taskDiv = document.createElement('div');
        taskDiv.className = `task-item ${task.completed ? 'completed' : ''}`;
        taskDiv.draggable = true;
        taskDiv.dataset.taskId = task.id;

        const priorityColor = {
            high: 'var(--priority-high)',
            medium: 'var(--priority-medium)',
            low: 'var(--priority-low)'
        }[task.priority];

        const categoryColors = {
            work: '#3b82f6',
            personal: '#10b981',
            urgent: '#f59e0b'
        };

        const dueDate = task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '';
        const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && !task.completed;

        taskDiv.innerHTML = `
            <div class="task-header">
                <div class="task-checkbox ${task.completed ? 'completed' : ''}" onclick="todoApp.toggleTask(${task.id})">
                    ${task.completed ? '<i class="fas fa-check"></i>' : ''}
                </div>
                <div class="task-priority" style="background: ${priorityColor};"></div>
                <div class="task-title ${task.completed ? 'completed' : ''}">${task.title}</div>
                <div class="task-actions">
                    <button class="task-btn edit" onclick="todoApp.editTask(${task.id})" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="task-btn delete" onclick="todoApp.deleteTask(${task.id})" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="task-meta">
                <span class="task-category">
                    <span class="category-color" style="background: ${categoryColors[task.category]};"></span>
                    ${task.category}
                </span>
                ${dueDate ? `<span class="task-due-date ${isOverdue ? 'overdue' : ''}">
                    <i class="fas fa-calendar"></i> ${dueDate}
                </span>` : ''}
                <span class="task-created">
                    <i class="fas fa-clock"></i> ${new Date(task.createdAt).toLocaleDateString()}
                </span>
            </div>
            ${task.description ? `<div class="task-description">${task.description}</div>` : ''}
        `;

        return taskDiv;
    }

    setupTaskDragAndDrop() {
        const taskItems = document.querySelectorAll('.task-item');
        
        taskItems.forEach(item => {
            item.addEventListener('dragstart', (e) => {
                item.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/html', item.outerHTML);
                e.dataTransfer.setData('text/plain', item.dataset.taskId);
            });

            item.addEventListener('dragend', () => {
                item.classList.remove('dragging');
            });

            item.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
            });

            item.addEventListener('drop', (e) => {
                e.preventDefault();
                const draggedId = parseInt(e.dataTransfer.getData('text/plain'));
                const targetId = parseInt(item.dataset.taskId);
                
                if (draggedId !== targetId) {
                    this.reorderTasks(draggedId, targetId);
                }
            });
        });
    }

    reorderTasks(draggedId, targetId) {
        const draggedIndex = this.tasks.findIndex(t => t.id === draggedId);
        const targetIndex = this.tasks.findIndex(t => t.id === targetId);
        
        if (draggedIndex > -1 && targetIndex > -1) {
            const [draggedTask] = this.tasks.splice(draggedIndex, 1);
            this.tasks.splice(targetIndex, 0, draggedTask);
            
            this.saveToLocalStorage();
            this.renderTasks();
        }
    }

    getFilteredTasks() {
        let filtered = this.tasks;

        // Apply text search
        if (this.searchQuery) {
            filtered = filtered.filter(task => 
                task.title.toLowerCase().includes(this.searchQuery) ||
                task.description.toLowerCase().includes(this.searchQuery)
            );
        }

        // Apply filters
        switch (this.currentFilter) {
            case 'pending':
                filtered = filtered.filter(task => !task.completed);
                break;
            case 'completed':
                filtered = filtered.filter(task => task.completed);
                break;
            case 'high':
                filtered = filtered.filter(task => task.priority === 'high');
                break;
            case 'today':
                const today = new Date().toISOString().split('T')[0];
                filtered = filtered.filter(task => task.dueDate === today);
                break;
        }

        return filtered;
    }

    sortTasks(tasks) {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        
        switch (this.currentSort) {
            case 'priority':
                return tasks.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);
            case 'due-date':
                return tasks.sort((a, b) => {
                    if (!a.dueDate && !b.dueDate) return 0;
                    if (!a.dueDate) return 1;
                    if (!b.dueDate) return -1;
                    return new Date(a.dueDate) - new Date(b.dueDate);
                });
            case 'alphabetical':
                return tasks.sort((a, b) => a.title.localeCompare(b.title));
            case 'created':
            default:
                return tasks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }
    }

    updateStats() {
        const totalTasks = this.tasks.length;
        const completedTasks = this.tasks.filter(t => t.completed).length;
        const pendingTasks = totalTasks - completedTasks;

        document.getElementById('total-tasks').textContent = totalTasks;
        document.getElementById('completed-tasks').textContent = completedTasks;
        document.getElementById('pending-tasks').textContent = pendingTasks;
    }

    updateDetailedStats() {
        const completionRate = this.stats.totalCreated > 0 
            ? Math.round((this.stats.totalCompleted / this.stats.totalCreated) * 100)
            : 0;

        document.getElementById('total-created').textContent = this.stats.totalCreated;
        document.getElementById('total-completed-ever').textContent = this.stats.totalCompleted;
        document.getElementById('completion-rate').textContent = `${completionRate}%`;
        document.getElementById('streak-display').textContent = `${this.stats.streakDays} days`;

        // Update progress bar
        const progressBar = document.getElementById('daily-progress-bar');
        const todayCompleted = this.tasks.filter(t => 
            t.completed && t.completedAt && 
            new Date(t.completedAt).toDateString() === new Date().toDateString()
        ).length;
        
        const dailyGoal = 5; // You can make this configurable
        const progressPercentage = Math.min((todayCompleted / dailyGoal) * 100, 100);
        progressBar.style.width = `${progressPercentage}%`;
    }

    updateStreak() {
        const today = new Date().toDateString();
        const lastCompletion = this.stats.lastCompletionDate;

        if (!lastCompletion || lastCompletion !== today) {
            if (lastCompletion) {
                const lastDate = new Date(lastCompletion);
                const todayDate = new Date(today);
                const diffTime = todayDate - lastDate;
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays === 1) {
                    this.stats.streakDays++;
                } else if (diffDays > 1) {
                    this.stats.streakDays = 1;
                }
            } else {
                this.stats.streakDays = 1;
            }

            this.stats.lastCompletionDate = today;
        }
    }

    // Focus Timer Methods
    startTimer() {
        if (this.isTimerRunning) return;

        this.isTimerRunning = true;
        document.getElementById('start-timer').disabled = true;
        document.getElementById('pause-timer').disabled = false;

        this.timerInterval = setInterval(() => {
            if (this.timerSeconds === 0) {
                if (this.timerMinutes === 0) {
                    this.timerComplete();
                    return;
                }
                this.timerMinutes--;
                this.timerSeconds = 59;
            } else {
                this.timerSeconds--;
            }
            this.updateTimerDisplay();
        }, 1000);
    }

    pauseTimer() {
        this.isTimerRunning = false;
        clearInterval(this.timerInterval);
        document.getElementById('start-timer').disabled = false;
        document.getElementById('pause-timer').disabled = true;
    }

    resetTimer() {
        this.pauseTimer();
        this.setTimer(25, 0);
    }

    setTimer(minutes, seconds) {
        this.timerMinutes = minutes;
        this.timerSeconds = seconds;
        this.updateTimerDisplay();
    }

    updateTimerDisplay() {
        const display = document.getElementById('timer-display');
        const mins = this.timerMinutes.toString().padStart(2, '0');
        const secs = this.timerSeconds.toString().padStart(2, '0');
        display.textContent = `${mins}:${secs}`;
    }

    timerComplete() {
        this.pauseTimer();
        this.showNotification('Focus session complete! Time for a break 🎉', 'success');
        
        // Play notification sound (if available)
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Focus Timer Complete!', {
                body: 'Great job! Time for a well-deserved break.',
                icon: '/favicon.ico'
            });
        }
    }

    // Theme Management
    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('todoTheme', newTheme);
        
        const themeIcon = document.querySelector('#theme-toggle i');
        themeIcon.className = newTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }

    loadTheme() {
        const savedTheme = localStorage.getItem('todoTheme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        
        const themeIcon = document.querySelector('#theme-toggle i');
        themeIcon.className = savedTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }

    updateDateDisplay() {
        const now = new Date();
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        document.getElementById('current-date').textContent = now.toLocaleDateString('en-US', options);
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        // Style the notification
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '12px 24px',
            borderRadius: '8px',
            color: 'white',
            fontWeight: '500',
            zIndex: '10000',
            transform: 'translateX(400px)',
            transition: 'transform 0.3s ease',
            maxWidth: '300px'
        });

        // Set background color based on type
        const colors = {
            success: '#10b981',
            error: '#ef4444',
            warning: '#f59e0b',
            info: '#3b82f6'
        };
        notification.style.background = colors[type] || colors.info;

        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        // Remove after delay
        setTimeout(() => {
            notification.style.transform = 'translateX(400px)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    saveToLocalStorage() {
        localStorage.setItem('todoTasks', JSON.stringify(this.tasks));
        localStorage.setItem('todoStats', JSON.stringify(this.stats));
    }

    // Export/Import functionality
    exportTasks() {
        const dataStr = JSON.stringify({
            tasks: this.tasks,
            stats: this.stats,
            exportDate: new Date().toISOString()
        }, null, 2);
        
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `todolist-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    importTasks(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                this.tasks = data.tasks || [];
                this.stats = data.stats || this.stats;
                this.saveToLocalStorage();
                this.renderTasks();
                this.updateStats();
                this.showNotification('Tasks imported successfully!', 'success');
            } catch (error) {
                this.showNotification('Error importing tasks. Please check the file format.', 'error');
            }
        };
        reader.readAsText(file);
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.todoApp = new TodoApp();

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
});

// Service Worker for offline functionality (optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => console.log('SW registered'))
            .catch(error => console.log('SW registration failed'));
    });
}
