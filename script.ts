export type Priority = 'low' | 'medium' | 'high';
export type FilterType = 'all' | 'active' | 'completed' | 'high-priority';

export interface Task {
  id: number;
  title: string;
  completed: boolean;
  priority: Priority;
  category: string;
  dueDate: string | null;
}

interface AppState {
  tasks: Task[];
  filter: FilterType;
  search: string;
  theme: 'light' | 'dark';
  sortByPriority: boolean;
  editingId: number | null;
}

// Elements
const taskInput = document.getElementById('task-input') as HTMLInputElement;
const addBtn = document.getElementById('add-btn') as HTMLButtonElement;
const prioritySelect = document.getElementById('priority-select') as HTMLSelectElement;
const dueDateInput = document.getElementById('due-date') as HTMLInputElement;
const categorySelect = document.getElementById('category-select') as HTMLSelectElement;
const searchInput = document.getElementById('search-input') as HTMLInputElement;
const tasksList = document.getElementById('tasks-list') as HTMLUListElement;
const filterChips = document.querySelectorAll<HTMLButtonElement>('.filter-chip');
const sortPriorityBtn = document.getElementById('sort-by-priority') as HTMLButtonElement;
const clearCompletedBtn = document.getElementById('clear-completed-btn') as HTMLButtonElement;
const exportBtn = document.getElementById('export-btn') as HTMLButtonElement;
const themeBtn = document.getElementById('theme-btn') as HTMLButtonElement;
const taskProgress = document.getElementById('task-progress') as HTMLElement;
const dateDisplay = document.getElementById('date-display') as HTMLElement;
const toast = document.getElementById('toast') as HTMLElement;

// Modal Elements
const editModal = document.getElementById('edit-modal') as HTMLElement;
const modalClose = document.getElementById('modal-close') as HTMLElement;
const modalCancel = document.getElementById('modal-cancel') as HTMLElement;
const modalSave = document.getElementById('modal-save') as HTMLElement;
const editTitle = document.getElementById('edit-task-input') as HTMLInputElement;
const editPriority = document.getElementById('edit-priority') as HTMLSelectElement;
const editDate = document.getElementById('edit-due-date') as HTMLInputElement;
const editCategory = document.getElementById('edit-category') as HTMLSelectElement;

// App State
const state: AppState = {
  tasks: [],
  filter: 'all',
  search: '',
  theme: (localStorage.getItem('theme') as 'light' | 'dark') || 'light',
  sortByPriority: false,
  editingId: null,
};

// Utilities
function showToast(msg: string): void {
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2000);
}

function save(): void {
  localStorage.setItem('tasks', JSON.stringify(state.tasks));
}

function load(): void {
  try {
    state.tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
  } catch {
    state.tasks = [];
  }
}

function toggleTheme(): void {
  state.theme = state.theme === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', state.theme);
  localStorage.setItem('theme', state.theme);
  const icon = themeBtn.querySelector('i');
  if (icon) icon.className = state.theme === 'light' ? 'fa-regular fa-moon' : 'fa-regular fa-sun';
}

// Task Handlers
function addTask(): void {
  const text = taskInput.value.trim();
  if (!text) return;

  const newTask: Task = {
    id: Date.now(),
    title: text,
    completed: false,
    priority: prioritySelect.value as Priority,
    category: categorySelect.value,
    dueDate: dueDateInput.value || null,
  };

  state.tasks.unshift(newTask);
  save();
  render();

  taskInput.value = '';
  dueDateInput.value = '';
  showToast('Task added');
  taskInput.focus();
}

function toggleTask(id: number): void {
  const t = state.tasks.find(x => x.id === id);
  if (t) {
    t.completed = !t.completed;
    save();
    render();
  }
}

function deleteTask(id: number): void {
  state.tasks = state.tasks.filter(x => x.id !== id);
  save();
  render();
  showToast('Task removed');
}

// Modal
function openEdit(id: number): void {
  const t = state.tasks.find(x => x.id === id);
  if (!t) return;
  state.editingId = id;
  editTitle.value = t.title;
  editPriority.value = t.priority;
  editDate.value = t.dueDate || '';
  editCategory.value = t.category;
  editModal.classList.add('active');
}

function closeEdit(): void {
  editModal.classList.remove('active');
  state.editingId = null;
}

function saveEdit(): void {
  if (state.editingId === null) return;
  const val = editTitle.value.trim();
  if (!val) return;

  const t = state.tasks.find(x => x.id === state.editingId);
  if (t) {
    t.title = val;
    t.priority = editPriority.value as Priority;
    t.dueDate = editDate.value || null;
    t.category = editCategory.value;
    save();
    render();
    closeEdit();
    showToast('Task updated');
  }
}

// Render
function render(): void {
  tasksList.innerHTML = '';
  let filtered = [...state.tasks];

  if (state.search) {
    const q = state.search.toLowerCase();
    filtered = filtered.filter(t => t.title.toLowerCase().includes(q));
  }

  if (state.filter === 'active') filtered = filtered.filter(t => !t.completed);
  if (state.filter === 'completed') filtered = filtered.filter(t => t.completed);
  if (state.filter === 'high-priority') filtered = filtered.filter(t => t.priority === 'high');

  if (state.sortByPriority) {
    const pRank: Record<Priority, number> = { high: 1, medium: 2, low: 3 };
    filtered.sort((a, b) => pRank[a.priority] - pRank[b.priority]);
  }

  // Update progress
  const doneCount = state.tasks.filter(t => t.completed).length;
  taskProgress.textContent = `${doneCount} of ${state.tasks.length} done`;

  if (!filtered.length) {
    tasksList.innerHTML = `
      <li class="empty-state">
        <i class="fa-solid fa-feather-pointed"></i>
        <p>${state.search ? 'No matching tasks.' : 'All caught up!'}</p>
      </li>
    `;
    return;
  }

  filtered.forEach(task => {
    const li = document.createElement('li');
    li.className = `task-card ${task.completed ? 'completed' : ''}`;
    li.innerHTML = `
      <div class="custom-check ${task.completed ? 'checked' : ''}" data-id="${task.id}"></div>
      <div class="task-main">
        <div class="task-text">${escapeHtml(task.title)}</div>
        <div class="task-meta-row">
          <span class="tag-badge ${task.priority}">${task.priority}</span>
          <span class="tag-category">${task.category}</span>
          ${task.dueDate ? `<span class="tag-category"><i class="fa-regular fa-clock"></i> ${task.dueDate}</span>` : ''}
        </div>
      </div>
      <div class="task-ops">
        <button class="op-btn edit" data-id="${task.id}" title="Edit"><i class="fa-regular fa-pen-to-square"></i></button>
        <button class="op-btn delete" data-id="${task.id}" title="Delete"><i class="fa-regular fa-trash-can"></i></button>
      </div>
    `;
    tasksList.appendChild(li);
  });

  // Attach dynamic clicks
  tasksList.querySelectorAll('.custom-check').forEach(el => {
    el.addEventListener('click', () => toggleTask(Number((el as HTMLElement).dataset.id)));
  });
  tasksList.querySelectorAll('.op-btn.edit').forEach(el => {
    el.addEventListener('click', () => openEdit(Number((el as HTMLElement).dataset.id)));
  });
  tasksList.querySelectorAll('.op-btn.delete').forEach(el => {
    el.addEventListener('click', () => deleteTask(Number((el as HTMLElement).dataset.id)));
  });
}

function escapeHtml(str: string): string {
  const p = document.createElement('p');
  p.textContent = str;
  return p.innerHTML;
}

// Init
function init(): void {
  load();
  document.documentElement.setAttribute('data-theme', state.theme);
  dateDisplay.textContent = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  addBtn.addEventListener('click', addTask);
  taskInput.addEventListener('keydown', e => e.key === 'Enter' && addTask());
  themeBtn.addEventListener('click', toggleTheme);

  searchInput.addEventListener('input', e => {
    state.search = (e.target as HTMLInputElement).value;
    render();
  });

  filterChips.forEach(btn => {
    btn.addEventListener('click', () => {
      filterChips.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.filter = btn.dataset.filter as FilterType;
      render();
    });
  });

  sortPriorityBtn.addEventListener('click', () => {
    state.sortByPriority = !state.sortByPriority;
    sortPriorityBtn.style.color = state.sortByPriority ? 'var(--accent)' : '';
    render();
  });

  clearCompletedBtn.addEventListener('click', () => {
    state.tasks = state.tasks.filter(t => !t.completed);
    save();
    render();
    showToast('Cleaned up completed tasks');
  });

  exportBtn.addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(state.tasks, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tasks-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });

  modalClose.addEventListener('click', closeEdit);
  modalCancel.addEventListener('click', closeEdit);
  modalSave.addEventListener('click', saveEdit);

  render();
}

document.addEventListener('DOMContentLoaded', init);