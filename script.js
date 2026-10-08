// Elements
const taskInput = document.getElementById('task-input');
const addBtn = document.getElementById('add-btn');
const prioritySelect = document.getElementById('priority-select');
const dueDateInput = document.getElementById('due-date');
const categorySelect = document.getElementById('category-select');
const searchInput = document.getElementById('search-input');
const tasksList = document.getElementById('tasks-list');
const filterChips = document.querySelectorAll('.filter-chip');
const sortPriorityBtn = document.getElementById('sort-by-priority');
const clearCompletedBtn = document.getElementById('clear-completed-btn');
const exportBtn = document.getElementById('export-btn');
const themeBtn = document.getElementById('theme-btn');
const taskProgress = document.getElementById('task-progress');
const dateDisplay = document.getElementById('date-display');
const toast = document.getElementById('toast');

// Modal Elements
const editModal = document.getElementById('edit-modal');
const modalClose = document.getElementById('modal-close');
const modalCancel = document.getElementById('modal-cancel');
const modalSave = document.getElementById('modal-save');
const editTitle = document.getElementById('edit-task-input');
const editPriority = document.getElementById('edit-priority');
const editDate = document.getElementById('edit-due-date');
const editCategory = document.getElementById('edit-category');

// App State
const state = {
  tasks: [],
  filter: 'all',
  search: '',
  theme: localStorage.getItem('theme') || 'light',
  sortByPriority: false,
  editingId: null,
};

// Utilities
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2000);
}

function save() {
  localStorage.setItem('tasks', JSON.stringify(state.tasks));
}

function load() {
  try {
    state.tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
  } catch {
    state.tasks = [];
  }
}

function toggleTheme() {
  state.theme = state.theme === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', state.theme);
  localStorage.setItem('theme', state.theme);
  const icon = themeBtn.querySelector('i');
  if (icon) icon.className = state.theme === 'light' ? 'fa-regular fa-moon' : 'fa-regular fa-sun';
}

// Task Handlers
function addTask() {
  const text = taskInput.value.trim();
  if (!text) return;

  const newTask = {
    id: Date.now(),
    title: text,
    completed: false,
    priority: prioritySelect.value,
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

function toggleTask(id) {
  const t = state.tasks.find(x => x.id === id);
  if (t) {
    t.completed = !t.completed;
    save();
    render();
  }
}

function deleteTask(id) {
  state.tasks = state.tasks.filter(x => x.id !== id);
  save();
  render();
  showToast('Task removed');
}

// Modal
function openEdit(id) {
  const t = state.tasks.find(x => x.id === id);
  if (!t) return;
  state.editingId = id;
  editTitle.value = t.title;
  editPriority.value = t.priority;
  editDate.value = t.dueDate || '';
  editCategory.value = t.category;
  editModal.classList.add('active');
}

function closeEdit() {
  editModal.classList.remove('active');
  state.editingId = null;
}

function saveEdit() {
  if (state.editingId === null) return;
  const val = editTitle.value.trim();
  if (!val) return;

  const t = state.tasks.find(x => x.id === state.editingId);
  if (t) {
    t.title = val;
    t.priority = editPriority.value;
    t.dueDate = editDate.value || null;
    t.category = editCategory.value;
    save();
    render();
    closeEdit();
    showToast('Task updated');
  }
}

// Render
function render() {
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
    const pRank = { high: 1, medium: 2, low: 3 };
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
    el.addEventListener('click', () => toggleTask(Number(el.dataset.id)));
  });
  tasksList.querySelectorAll('.op-btn.edit').forEach(el => {
    el.addEventListener('click', () => openEdit(Number(el.dataset.id)));
  });
  tasksList.querySelectorAll('.op-btn.delete').forEach(el => {
    el.addEventListener('click', () => deleteTask(Number(el.dataset.id)));
  });
}

function escapeHtml(str) {
  const p = document.createElement('p');
  p.textContent = str;
  return p.innerHTML;
}

// Init
function init() {
  load();
  document.documentElement.setAttribute('data-theme', state.theme);
  dateDisplay.textContent = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  addBtn.addEventListener('click', addTask);
  taskInput.addEventListener('keydown', e => e.key === 'Enter' && addTask());
  themeBtn.addEventListener('click', toggleTheme);

  searchInput.addEventListener('input', e => {
    state.search = e.target.value;
    render();
  });

  filterChips.forEach(btn => {
    btn.addEventListener('click', () => {
      filterChips.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.filter = btn.dataset.filter;
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