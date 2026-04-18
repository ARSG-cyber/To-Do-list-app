// ==================== TYPES & INTERFACES ====================
interface Task {
  id: number;
  title: string;
  description: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  category: 'work' | 'personal' | 'shopping' | 'health' | 'learning';
  dueDate: string | null;
  createdAt: number;
  completedAt: number | null;
}

interface AppState {
  tasks: Task[];
  filter: 'all' | 'active' | 'completed' | 'high-priority';
  sortBy: 'date' | 'priority' | 'default';
  searchQuery: string;
  theme: 'light' | 'dark';
  editingTaskId: number | null;
}

// ==================== DOM ELEMENTS ====================
const taskInput = document.getElementById('task-input') as HTMLInputElement;
const addBtn = document.getElementById('add-btn') as HTMLButtonElement;
const prioritySelect = document.getElementById('priority-select') as HTMLSelectElement;
const dueDateInput = document.getElementById('due-date') as HTMLInputElement;
const categorySelect = document.getElementById('category-select') as HTMLSelectElement;
const searchInput = document.getElementById('search-input') as HTMLInputElement;
const tasksList = document.getElementById('tasks-list') as HTMLUListElement;
const filterBtns = document.querySelectorAll('.filter-btn') as NodeListOf<HTMLButtonElement>;
const sortByDateBtn = document.getElementById('sort-by-date') as HTMLButtonElement;
const sortByPriorityBtn = document.getElementById('sort-by-priority') as HTMLButtonElement;
const clearCompletedBtn = document.getElementById('clear-completed-btn') as HTMLButtonElement;
const exportBtn = document.getElementById('export-btn') as HTMLButtonElement;
const themeBtn = document.getElementById('theme-btn') as HTMLButtonElement;
const editModal = document.getElementById('edit-modal') as HTMLDivElement;
const modalClose = document.getElementById('modal-close') as HTMLButtonElement;
const modalCancel = document.getElementById('modal-cancel') as HTMLButtonElement;
const modalSave = document.getElementById('modal-save') as HTMLButtonElement;
const editTaskInput = document.getElementById('edit-task-input') as HTMLInputElement;
const editPriority = document.getElementById('edit-priority') as HTMLSelectElement;
const editDueDate = document.getElementById('edit-due-date') as HTMLInputElement;
const editCategory = document.getElementById('edit-category') as HTMLSelectElement;
const editDescription = document.getElementById('edit-description') as HTMLTextAreaElement;
const toast = document.getElementById('toast') as HTMLDivElement;
const taskProgress = document.getElementById('task-progress') as HTMLElement;
const progressFill = document.getElementById('progress-fill') as HTMLElement;

// Stats elements
const statTotal = document.getElementById('stat-total') as HTMLElement;
const statActive = document.getElementById('stat-active') as HTMLElement;
const statCompleted = document.getElementById('stat-completed') as HTMLElement;
const statHigh = document.getElementById('stat-high') as HTMLElement;

// ==================== APP STATE ====================
const appState: AppState = {
  tasks: [],
  filter: 'all',
  sortBy: 'default',
  searchQuery: '',
  theme: localStorage.getItem('theme') as 'light' | 'dark' || 'light',
  editingTaskId: null,
};

// ==================== UTILITIES ====================
function showToast(message: string, duration: number = 3000): void {
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), duration);
}

function formatDate(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function isOverdue(dueDate: string | null, completed: boolean): boolean {
  if (!dueDate || completed) return false;
  return new Date(dueDate) < new Date();
}

function getPriorityIcon(priority: string): string {
  const icons: { [key: string]: string } = {
    high: '🔴',
    medium: '🟡',
    low: '🟢',
  };
  return icons[priority] || '';
}

function getCategoryIcon(category: string): string {
  const icons: { [key: string]: string } = {
    work: '💼',
    personal: '👤',
    shopping: '🛒',
    health: '💪',
    learning: '📚',
  };
  return icons[category] || '';
}

// ==================== LOCAL STORAGE ====================
function saveTasks(): void {
  localStorage.setItem('tasks', JSON.stringify(appState.tasks));
}

function loadTasks(): void {
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
function initTheme(): void {
  const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' || 'light';
  appState.theme = savedTheme;
  applyTheme();
}

function applyTheme(): void {
  document.documentElement.setAttribute('data-theme', appState.theme);
  localStorage.setItem('theme', appState.theme);
  const icon = themeBtn.querySelector('i') as HTMLElement;
  icon.className = appState.theme === 'light' ? 'fas fa-sun' : 'fas fa-moon';
}

function toggleTheme(): void {
  appState.theme = appState.theme === 'light' ? 'dark' : 'light';
  applyTheme();
}

// ==================== TASK OPERATIONS ====================
function createTask(title: string, priority: string, dueDate: string, category: string): Task {
  return {
    id: Date.now(),
    title,
    description: '',
    completed: false,
    priority: priority as 'low' | 'medium' | 'high',
    category: category as 'work' | 'personal' | 'shopping' | 'health' | 'learning',
    dueDate: dueDate || null,
    createdAt: Date.now(),
    completedAt: null,
  };
}

function addTask(): void {
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

function deleteTask(id: number): void {
  appState.tasks = appState.tasks.filter(t => t.id !== id);
  saveTasks();
  updateUI();
  showToast('🗑️ Task deleted');
}

function toggleTask(id: number): void {
  const task = appState.tasks.find(t => t.id === id);
  if (task) {
    task.completed = !task.completed;
    task.completedAt = task.completed ? Date.now() : null;
    saveTasks();
    updateUI();
    showToast(task.completed ? '✅ Task completed!' : '↩️ Task marked incomplete');
  }
}

function updateTask(id: number, updates: Partial<Task>): void {
  const task = appState.tasks.find(t => t.id === id);
  if (task) {
    Object.assign(task, updates);
    saveTasks();
    updateUI();
  }
}

// ==================== FILTERING & SORTING ====================
function getFilteredTasks(): Task[] {
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
function openEditModal(taskId: number): void {
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

function closeEditModal(): void {
  editModal.classList.remove('active');
  appState.editingTaskId = null;
}

function saveEditedTask(): void {
  if (appState.editingTaskId === null) return;

  const title = editTaskInput.value.trim();
  if (!title) {
    showToast('Please enter a task title');
    return;
  }

  updateTask(appState.editingTaskId, {
    title,
    description: editDescription.value,
    priority: editPriority.value as 'low' | 'medium' | 'high',
    category: editCategory.value as any,
    dueDate: editDueDate.value || null,
  });

  closeEditModal();
  showToast('✏️ Task updated successfully!');
}

// ==================== STATS ====================
function updateStats(): void {
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
function renderTasks(): void {
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

function attachTaskEventListeners(): void {
  // Checkboxes
  document.querySelectorAll('.task-checkbox').forEach(checkbox => {
    checkbox.addEventListener('change', (e: Event) => {
      const target = e.target as HTMLInputElement;
      const id = parseInt(target.dataset.id || '0');
      toggleTask(id);
    });
  });

  // Delete buttons
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', (e: Event) => {
      const id = parseInt((e.currentTarget as HTMLElement).dataset.id || '0');
      if (confirm('Are you sure you want to delete this task?')) {
        deleteTask(id);
      }
    });
  });

  // Edit buttons
  document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', (e: Event) => {
      const id = parseInt((e.currentTarget as HTMLElement).dataset.id || '0');
      openEditModal(id);
    });
  });
}

function updateUI(): void {
  renderTasks();
  updateStats();
}

// ==================== EVENT LISTENERS ====================
function setupEventListeners(): void {
  // Add task
  addBtn.addEventListener('click', addTask);
  taskInput.addEventListener('keypress', e => {
    if (e.key === 'Enter') addTask();
  });

  // Search
  searchInput.addEventListener('input', e => {
    appState.searchQuery = (e.target as HTMLInputElement).value;
    updateUI();
  });

  // Filter buttons
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      appState.filter = btn.dataset.filter as any;
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
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ==================== INITIALIZATION ====================
function init(): void {
  loadTasks();
  initTheme();
  setupEventListeners();
  updateUI();
  console.log('🚀 TaskMaster Pro initialized successfully!');
}

// Start the app
document.addEventListener('DOMContentLoaded', init);

  );
  saveTodos();
  renderTodos();
}

// Delete
function deleteTodo(id: number) {
  todos = todos.filter(t => t.id !== id);
  saveTodos();
  renderTodos();
}

// Clear completed
function clearCompleted() {
  todos = todos.filter(t => !t.completed);
  saveTodos();
  renderTodos();
}

// Toggle all
function toggleAll() {
  const allCompleted = todos.every(t => t.completed);
  todos = todos.map(t => ({ ...t, completed: !allCompleted }));
  saveTodos();
  renderTodos();
}

// Count
function updateCount() {
  const left = todos.filter(t => !t.completed).length;
  taskCount.textContent = `${left} tasks left`;
}

// Events
addBtn.onclick = addTodo;
input.addEventListener("keypress", e => {
  if (e.key === "Enter") addTodo();
});

searchInput.oninput = () => {
  searchText = searchInput.value;
  renderTodos();
};

clearBtn.onclick = clearCompleted;
toggleAllBtn.onclick = toggleAll;

filterBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    filterBtns.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    filter = btn.getAttribute("data-filter")!;
    renderTodos();
  });
});

// Init
loadTodos();
renderTodos();