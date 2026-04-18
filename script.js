// ==================== DOM ELEMENTS ====================
const taskInput = document.getElementById('task-input');
const addBtn = document.getElementById('add-btn');
const prioritySelect = document.getElementById('priority-select');
const dueDateInput = document.getElementById('due-date');
const categorySelect = document.getElementById('category-select');
const searchInput = document.getElementById('search-input');
const tasksList = document.getElementById('tasks-list');
const filterBtns = document.querySelectorAll('.filter-btn');
const sortByDateBtn = document.getElementById('sort-by-date');
const sortByPriorityBtn = document.getElementById('sort-by-priority');
const clearCompletedBtn = document.getElementById('clear-completed-btn');
const exportBtn = document.getElementById('export-btn');
const themeBtn = document.getElementById('theme-btn');
const editModal = document.getElementById('edit-modal');
const modalClose = document.getElementById('modal-close');
const modalCancel = document.getElementById('modal-cancel');
const modalSave = document.getElementById('modal-save');
const editTaskInput = document.getElementById('edit-task-input');
const editPriority = document.getElementById('edit-priority');
const editDueDate = document.getElementById('edit-due-date');
const editCategory = document.getElementById('edit-category');
const editDescription = document.getElementById('edit-description');
const toast = document.getElementById('toast');
const taskProgress = document.getElementById('task-progress');
const progressFill = document.getElementById('progress-fill');

// Stats elements
const statTotal = document.getElementById('stat-total');
const statActive = document.getElementById('stat-active');
const statCompleted = document.getElementById('stat-completed');
const statHigh = document.getElementById('stat-high');

// ==================== APP STATE ====================
const appState = {
  tasks: [],
  filter: 'all',
  sortBy: 'default',
  searchQuery: '',
  theme: localStorage.getItem('theme') || 'light',
  editingTaskId: null,
};

// ==================== UTILITIES ====================
function showToast(message, duration = 3000) {
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), duration);
}

function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function isOverdue(dueDate, completed) {
  if (!dueDate || completed) return false;
  return new Date(dueDate) < new Date();
}

function getPriorityIcon(priority) {
  const icons = {
    high: '🔴',
    medium: '🟡',
    low: '🟢',
  };
  return icons[priority] || '';
}

function getCategoryIcon(category) {
  const icons = {
    work: '💼',
    personal: '👤',
    shopping: '🛒',
    health: '💪',
    learning: '📚',
  };
  return icons[category] || '';
}

// ==================== LOCAL STORAGE ====================
function saveTasks() {
  localStorage.setItem('tasks', JSON.stringify(appState.tasks));
}

function loadTasks() {
  const saved = localStorage.getItem('tasks');
  if (saved) {
    try {
      appState.tasks = JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load tasks:', e);
      appState.tasks = [];
    }
  }
}

// ==================== THEME ====================
function initTheme() {
  const savedTheme = localStorage.getItem('theme') || 'light';
  appState.theme = savedTheme;
  applyTheme();
}

function applyTheme() {
  document.documentElement.setAttribute('data-theme', appState.theme);
  localStorage.setItem('theme', appState.theme);
  const icon = themeBtn.querySelector('i');
  icon.className = appState.theme === 'light' ? 'fas fa-sun' : 'fas fa-moon';
}

function toggleTheme() {
  appState.theme = appState.theme === 'light' ? 'dark' : 'light';
  applyTheme();
}

// ==================== TASK OPERATIONS ====================
function createTask(title, priority, dueDate, category) {
  return {
    id: Date.now(),
    title,
    description: '',
    completed: false,
    priority,
    category,
    dueDate: dueDate || null,
    createdAt: Date.now(),
    completedAt: null,
  };
}

function addTask() {
  const title = taskInput.value.trim();
  if (!title) {
    showToast('Please enter a task title');
    return;
  }

  const newTask = createTask(
    title,
    prioritySelect.value,
    dueDateInput.value,
    categorySelect.value
  );

  appState.tasks.unshift(newTask);
  saveTasks();
  updateUI();
  taskInput.value = '';
  dueDateInput.value = '';
  prioritySelect.value = 'medium';
  categorySelect.value = 'personal';
  showToast('✅ Task added successfully!');
  taskInput.focus();
}

function deleteTask(id) {
  appState.tasks = appState.tasks.filter(t => t.id !== id);
  saveTasks();
  updateUI();
  showToast('🗑️ Task deleted');
}

function toggleTask(id) {
  const task = appState.tasks.find(t => t.id === id);
  if (task) {
    task.completed = !task.completed;
    task.completedAt = task.completed ? Date.now() : null;
    saveTasks();
    updateUI();
    showToast(task.completed ? '✅ Task completed!' : '↩️ Task marked incomplete');
  }
}

function updateTask(id, updates) {
  const task = appState.tasks.find(t => t.id === id);
  if (task) {
    Object.assign(task, updates);
    saveTasks();
    updateUI();
  }
}

// ==================== FILTERING & SORTING ====================
function getFilteredTasks() {
  let filtered = appState.tasks;

  // Apply search
  if (appState.searchQuery) {
    filtered = filtered.filter(
      t =>
        t.title.toLowerCase().includes(appState.searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(appState.searchQuery.toLowerCase())
    );
  }

  // Apply filter
  switch (appState.filter) {
    case 'active':
      filtered = filtered.filter(t => !t.completed);
      break;
    case 'completed':
      filtered = filtered.filter(t => t.completed);
      break;
    case 'high-priority':
      filtered = filtered.filter(t => t.priority === 'high');
      break;
  }

  // Apply sorting
  switch (appState.sortBy) {
    case 'priority':
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      filtered.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
      break;
    case 'date':
      filtered.sort((a, b) => {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });
      break;
    case 'default':
      // Keep creation order
      break;
  }

  return filtered;
}

// ==================== MODAL OPERATIONS ====================
function openEditModal(taskId) {
  const task = appState.tasks.find(t => t.id === taskId);
  if (!task) return;

  appState.editingTaskId = taskId;
  editTaskInput.value = task.title;
  editDescription.value = task.description;
  editPriority.value = task.priority;
  editDueDate.value = task.dueDate || '';
  editCategory.value = task.category;

  editModal.classList.add('active');
}

function closeEditModal() {
  editModal.classList.remove('active');
  appState.editingTaskId = null;
}

function saveEditedTask() {
  if (appState.editingTaskId === null) return;

  const title = editTaskInput.value.trim();
  if (!title) {
    showToast('Please enter a task title');
    return;
  }

  updateTask(appState.editingTaskId, {
    title,
    description: editDescription.value,
    priority: editPriority.value,
    category: editCategory.value,
    dueDate: editDueDate.value || null,
  });

  closeEditModal();
  showToast('✏️ Task updated successfully!');
}

// ==================== STATS ====================
function updateStats() {
  const total = appState.tasks.length;
  const active = appState.tasks.filter(t => !t.completed).length;
  const completed = appState.tasks.filter(t => t.completed).length;
  const highPriority = appState.tasks.filter(t => t.priority === 'high').length;

  statTotal.textContent = total.toString();
  statActive.textContent = active.toString();
  statCompleted.textContent = completed.toString();
  statHigh.textContent = highPriority.toString();

  // Update progress
  taskProgress.textContent = `${completed}/${total} completed`;
  const percentage = total === 0 ? 0 : (completed / total) * 100;
  progressFill.style.width = `${percentage}%`;
}

// ==================== RENDERING ====================
function renderTasks() {
  tasksList.innerHTML = '';
  const filtered = getFilteredTasks();

  if (filtered.length === 0) {
    tasksList.innerHTML = `
      <li class="empty-state">
        <i class="fas fa-inbox"></i>
        <p>${appState.searchQuery ? 'No tasks found. Try a different search.' : 'No tasks yet. Add one to get started! 🚀'}</p>
      </li>
    `;
    return;
  }

  filtered.forEach(task => {
    const li = document.createElement('li');
    li.className = `task-item ${task.completed ? 'completed' : ''}`;

    const overdue = isOverdue(task.dueDate, task.completed);

    li.innerHTML = `
      <input 
        type="checkbox" 
        class="task-checkbox" 
        ${task.completed ? 'checked' : ''}
        data-id="${task.id}"
      >
      <div class="task-content">
        <div class="task-header">
          <div class="task-title">${escapeHtml(task.title)}</div>
          <div class="task-actions">
            <button class="btn-action edit-btn" data-id="${task.id}" title="Edit">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn-action delete-btn delete" data-id="${task.id}" title="Delete">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
        ${task.description ? `<div class="task-description">${escapeHtml(task.description)}</div>` : ''}
        <div class="task-meta">
          <span class="task-priority ${task.priority}">
            <i class="fas fa-signal"></i> ${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
          </span>
          <span class="task-category">
            <i class="fas fa-tag"></i> ${task.category.charAt(0).toUpperCase() + task.category.slice(1)}
          </span>
          ${
            task.dueDate
              ? `<span class="task-due-date ${overdue ? 'overdue' : ''}">
              <i class="fas fa-calendar"></i> ${formatDate(task.dueDate)} ${overdue ? '(Overdue)' : ''}
            </span>`
              : ''
          }
        </div>
      </div>
    `;

    tasksList.appendChild(li);
  });

  attachTaskEventListeners();
}

function attachTaskEventListeners() {
  // Checkboxes
  document.querySelectorAll('.task-checkbox').forEach(checkbox => {
    checkbox.addEventListener('change', e => {
      const id = parseInt(e.target.dataset.id || '0');
      toggleTask(id);
    });
  });

  // Delete buttons
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      const id = parseInt(e.currentTarget.dataset.id || '0');
      if (confirm('Are you sure you want to delete this task?')) {
        deleteTask(id);
      }
    });
  });

  // Edit buttons
  document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      const id = parseInt(e.currentTarget.dataset.id || '0');
      openEditModal(id);
    });
  });
}

function updateUI() {
  renderTasks();
  updateStats();
}

// ==================== EVENT LISTENERS ====================
function setupEventListeners() {
  // Add task
  addBtn.addEventListener('click', addTask);
  taskInput.addEventListener('keypress', e => {
    if (e.key === 'Enter') addTask();
  });

  // Search
  searchInput.addEventListener('input', e => {
    appState.searchQuery = e.target.value;
    updateUI();
  });

  // Filter buttons
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      appState.filter = btn.dataset.filter;
      updateUI();
    });
  });

  // Sort buttons
  sortByDateBtn.addEventListener('click', () => {
    appState.sortBy = appState.sortBy === 'date' ? 'default' : 'date';
    sortByDateBtn.style.opacity = appState.sortBy === 'date' ? '1' : '0.5';
    updateUI();
  });

  sortByPriorityBtn.addEventListener('click', () => {
    appState.sortBy = appState.sortBy === 'priority' ? 'default' : 'priority';
    sortByPriorityBtn.style.opacity = appState.sortBy === 'priority' ? '1' : '0.5';
    updateUI();
  });

  // Clear completed
  clearCompletedBtn.addEventListener('click', () => {
    const count = appState.tasks.filter(t => t.completed).length;
    if (count === 0) {
      showToast('No completed tasks to clear');
      return;
    }
    if (confirm(`Delete ${count} completed task(s)?`)) {
      appState.tasks = appState.tasks.filter(t => !t.completed);
      saveTasks();
      updateUI();
      showToast('✅ Cleaned up completed tasks');
    }
  });

  // Export
  exportBtn.addEventListener('click', () => {
    const dataStr = JSON.stringify(appState.tasks, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tasks-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('📥 Tasks exported successfully!');
  });

  // Theme
  themeBtn.addEventListener('click', toggleTheme);

  // Modal
  modalClose.addEventListener('click', closeEditModal);
  modalCancel.addEventListener('click', closeEditModal);
  modalSave.addEventListener('click', saveEditedTask);

  editModal.addEventListener('click', e => {
    if (e.target === editModal) closeEditModal();
  });
}

// ==================== UTILITY FUNCTIONS ====================
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ==================== INITIALIZATION ====================
function init() {
  loadTasks();
  initTheme();
  setupEventListeners();
  updateUI();
  console.log('🚀 TaskMaster Pro initialized successfully!');
}

// Start the app
document.addEventListener('DOMContentLoaded', init);
