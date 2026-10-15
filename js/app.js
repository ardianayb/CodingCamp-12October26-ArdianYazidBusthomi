/**
 * Life Dashboard — app.js
 * Vanilla JS, no frameworks, no external dependencies.
 * All data persisted in localStorage.
 */

'use strict';

/* =============================================================
   1. CONSTANTS & STORAGE HELPERS
   ============================================================= */

const STORAGE_KEYS = {
  TASKS:  'ld_tasks',
  LINKS:  'ld_links',
  THEME:  'ld_theme',
  NAME:   'ld_name',
  FILTER: 'ld_filter',
  TIMER:  'ld_timer_preset',
};

const DEFAULT_LINKS = [
  { id: 'dl1', name: 'Google',    url: 'https://www.google.com',    isDefault: true },
  { id: 'dl2', name: 'YouTube',   url: 'https://www.youtube.com',   isDefault: true },
  { id: 'dl3', name: 'GitHub',    url: 'https://www.github.com',    isDefault: true },
  { id: 'dl4', name: 'Wikipedia', url: 'https://www.wikipedia.org', isDefault: true },
];

/** Safely read from localStorage; return fallback on any error. */
function storageGet(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

/** Safely write to localStorage; show a console warning on quota errors. */
function storageSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (err) {
    if (err.name === 'QuotaExceededError' || err.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
      console.warn('Life Dashboard: localStorage quota exceeded. Some data may not be saved.');
    }
    return false;
  }
}

/* =============================================================
   2. THEME
   ============================================================= */

const themeToggleBtn = document.getElementById('theme-toggle');

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  themeToggleBtn.textContent = theme === 'dark' ? '☀️' : '🌙';
  themeToggleBtn.setAttribute('title', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
  themeToggleBtn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
}

function initTheme() {
  const saved = storageGet(STORAGE_KEYS.THEME, 'light');
  applyTheme(saved);
}

themeToggleBtn.addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  const next    = current === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  storageSet(STORAGE_KEYS.THEME, next);
});

/* =============================================================
   3. CLOCK / DATE / GREETING
   ============================================================= */

const greetingEl  = document.getElementById('greeting-text');
const dateEl      = document.getElementById('date-display');
const clockEl     = document.getElementById('clock-display');
const nameLabelEl = document.getElementById('name-display-label');

const DAYS   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];

function getGreetingPrefix(hour) {
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function updateClock() {
  const now  = new Date();
  const hour = now.getHours();
  const min  = String(now.getMinutes()).padStart(2, '0');
  const sec  = String(now.getSeconds()).padStart(2, '0');
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const h12  = hour % 12 || 12;

  clockEl.textContent = `${String(h12).padStart(2,'0')}:${min}:${sec} ${ampm}`;

  const day  = DAYS[now.getDay()];
  const date = now.getDate();
  const mon  = MONTHS[now.getMonth()];
  const yr   = now.getFullYear();
  dateEl.textContent = `${day}, ${mon} ${date}, ${yr}`;

  const name   = storageGet(STORAGE_KEYS.NAME, '');
  const prefix = getGreetingPrefix(hour);
  greetingEl.textContent = name
    ? `${prefix}, ${name}! 👋`
    : `${prefix}! 👋`;
}

/* ── Name editor ── */
const editNameBtn    = document.getElementById('edit-name-btn');
const nameForm       = document.getElementById('name-form');
const nameInput      = document.getElementById('name-input');
const cancelNameBtn  = document.getElementById('cancel-name-btn');

function showNameForm() {
  nameInput.value = storageGet(STORAGE_KEYS.NAME, '');
  nameForm.classList.remove('hidden');
  editNameBtn.classList.add('hidden');
  nameLabelEl.classList.add('hidden');
  nameInput.focus();
}

function hideNameForm() {
  nameForm.classList.add('hidden');
  editNameBtn.classList.remove('hidden');
  nameLabelEl.classList.remove('hidden');
}

function updateNameLabel() {
  const name = storageGet(STORAGE_KEYS.NAME, '');
  nameLabelEl.textContent = name ? `Hi, ${name}` : '';
}

editNameBtn.addEventListener('click', showNameForm);
cancelNameBtn.addEventListener('click', hideNameForm);

nameForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const trimmed = nameInput.value.trim();
  storageSet(STORAGE_KEYS.NAME, trimmed);
  updateNameLabel();
  updateClock(); // refresh greeting immediately
  hideNameForm();
});

/* =============================================================
   4. FOCUS TIMER
   ============================================================= */

const timerMinEl  = document.getElementById('timer-minutes');
const timerSecEl  = document.getElementById('timer-seconds');
const startBtn    = document.getElementById('timer-start');
const stopBtn     = document.getElementById('timer-stop');
const resetBtn    = document.getElementById('timer-reset');
const timerStatus = document.getElementById('timer-status');
const presetBtns  = document.querySelectorAll('.preset-btn');

let timerInterval  = null;       // active setInterval id
let timerRemaining = 25 * 60;    // seconds remaining
let timerDuration  = 25 * 60;    // total seconds for current preset
let timerRunning   = false;

function renderTimer() {
  const m = Math.floor(timerRemaining / 60);
  const s = timerRemaining % 60;
  timerMinEl.textContent = String(m).padStart(2, '0');
  timerSecEl.textContent = String(s).padStart(2, '0');
}

function setTimerPreset(minutes) {
  // Prevent changing preset while timer is running
  if (timerRunning) return;
  timerDuration  = minutes * 60;
  timerRemaining = timerDuration;
  storageSet(STORAGE_KEYS.TIMER, minutes);
  renderTimer();
  timerStatus.textContent = '';

  presetBtns.forEach(btn => {
    const isActive = Number(btn.dataset.minutes) === minutes;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
  });
}

function startTimer() {
  if (timerRunning) return; // guard against double-start
  if (timerRemaining <= 0) {
    timerRemaining = timerDuration;
    renderTimer();
  }
  timerRunning = true;
  startBtn.disabled = true;
  stopBtn.disabled  = false;
  timerStatus.textContent = 'Focus session in progress…';

  timerInterval = setInterval(() => {
    timerRemaining -= 1;
    renderTimer();
    if (timerRemaining <= 0) {
      clearInterval(timerInterval);
      timerInterval = null;
      timerRunning  = false;
      startBtn.disabled = false;
      stopBtn.disabled  = true;
      timerStatus.textContent = '✅ Session complete! Take a break.';
    }
  }, 1000);
}

function stopTimer() {
  if (!timerRunning) return;
  clearInterval(timerInterval);
  timerInterval = null;
  timerRunning  = false;
  startBtn.disabled = false;
  stopBtn.disabled  = true;
  timerStatus.textContent = 'Timer paused.';
}

function resetTimer() {
  stopTimer();
  timerRemaining = timerDuration;
  renderTimer();
  timerStatus.textContent = '';
}

startBtn.addEventListener('click', startTimer);
stopBtn.addEventListener('click',  stopTimer);
resetBtn.addEventListener('click', resetTimer);

presetBtns.forEach(btn => {
  btn.addEventListener('click', () => setTimerPreset(Number(btn.dataset.minutes)));
});

function initTimer() {
  const savedMinutes = storageGet(STORAGE_KEYS.TIMER, 25);
  setTimerPreset(savedMinutes);
}

/* =============================================================
   5. QUICK LINKS
   ============================================================= */

const linksListEl    = document.getElementById('links-list');
const addLinkForm    = document.getElementById('add-link-form');
const linkNameInput  = document.getElementById('link-name-input');
const linkUrlInput   = document.getElementById('link-url-input');
const linkError      = document.getElementById('link-error');

const SAFE_PROTOCOLS = ['http:', 'https:'];

function isValidUrl(raw) {
  try {
    const url = new URL(raw);
    return SAFE_PROTOCOLS.includes(url.protocol);
  } catch {
    return false;
  }
}

function loadLinks() {
  const stored = storageGet(STORAGE_KEYS.LINKS, null);
  // First run: return defaults
  if (stored === null) return DEFAULT_LINKS.map(l => ({ ...l }));
  // Merge: keep defaults that haven't been explicitly removed by user
  return stored;
}

function saveLinks(links) {
  storageSet(STORAGE_KEYS.LINKS, links);
}

function renderLinks() {
  const links = loadLinks();
  linksListEl.innerHTML = '';

  if (links.length === 0) {
    const li = document.createElement('li');
    li.className = 'empty-msg';
    li.style.cssText = 'font-size:0.85rem;color:var(--text-muted);padding:0.5rem 0;';
    li.textContent = 'No links yet. Add one below.';
    linksListEl.appendChild(li);
    return;
  }

  links.forEach(link => {
    const li = document.createElement('li');
    li.className = 'link-item';

    const a = document.createElement('a');
    a.href   = link.url;
    a.target = '_blank';
    a.rel    = 'noopener noreferrer';
    a.textContent = link.name || link.url;
    a.title  = link.url;

    const delBtn = document.createElement('button');
    delBtn.className = 'link-delete-btn';
    delBtn.setAttribute('aria-label', `Remove ${link.name || link.url}`);
    delBtn.textContent = '✕';
    delBtn.addEventListener('click', () => deleteLink(link.id));

    li.appendChild(a);
    li.appendChild(delBtn);
    linksListEl.appendChild(li);
  });
}

function deleteLink(id) {
  const links = loadLinks().filter(l => l.id !== id);
  saveLinks(links);
  renderLinks();
}

addLinkForm.addEventListener('submit', (e) => {
  e.preventDefault();
  linkError.textContent = '';

  const name = linkNameInput.value.trim();
  const raw  = linkUrlInput.value.trim();

  if (!name) {
    linkError.textContent = 'Please enter a link name.';
    linkNameInput.focus();
    return;
  }

  // Auto-prepend https:// if no protocol detected
  const urlStr = raw.match(/^https?:\/\//i) ? raw : `https://${raw}`;

  if (!isValidUrl(urlStr)) {
    linkError.textContent = 'Please enter a valid URL (https://…).';
    linkUrlInput.focus();
    return;
  }

  const links = loadLinks();
  const newLink = {
    id:        `lnk_${Date.now()}`,
    name,
    url:       urlStr,
    isDefault: false,
  };

  links.push(newLink);
  saveLinks(links);
  renderLinks();

  linkNameInput.value = '';
  linkUrlInput.value  = '';
  linkNameInput.focus();
});

/* =============================================================
   6. TASK MANAGER
   ============================================================= */

/* ── 6a. Data helpers ── */

/**
 * Task shape:
 * {
 *   id:        string,
 *   title:     string,
 *   priority:  'low' | 'medium' | 'high',
 *   dueDate:   string (YYYY-MM-DD) | '',
 *   completed: boolean,
 *   createdAt: number (timestamp),
 * }
 */

function loadTasks() {
  return storageGet(STORAGE_KEYS.TASKS, []);
}

function saveTasks(tasks) {
  storageSet(STORAGE_KEYS.TASKS, tasks);
}

/* ── 6b. DOM refs ── */

const addTaskForm       = document.getElementById('add-task-form');
const taskTitleInput    = document.getElementById('task-title-input');
const taskPriorityEl    = document.getElementById('task-priority');
const taskDueEl         = document.getElementById('task-due');
const taskError         = document.getElementById('task-error');
const taskListEl        = document.getElementById('task-list');
const taskEmptyEl       = document.getElementById('task-empty');
const filterTabs        = document.querySelectorAll('.filter-tab');
const clearCompletedBtn = document.getElementById('clear-completed-btn');
const statTotal         = document.getElementById('stat-total');
const statActive        = document.getElementById('stat-active');
const statDone          = document.getElementById('stat-done');

/* ── 6c. Filter state ── */

let currentFilter = storageGet(STORAGE_KEYS.FILTER, 'all');

function setFilter(filter) {
  currentFilter = filter;
  storageSet(STORAGE_KEYS.FILTER, filter);

  filterTabs.forEach(tab => {
    const isActive = tab.dataset.filter === filter;
    tab.classList.toggle('active', isActive);
    tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
  });

  renderTasks();
}

filterTabs.forEach(tab => {
  tab.addEventListener('click', () => setFilter(tab.dataset.filter));
});

/* ── 6d. Stats ── */

function updateStats(tasks) {
  const total     = tasks.length;
  const doneCount = tasks.filter(t => t.completed).length;
  const active    = total - doneCount;

  statTotal.textContent  = `${total} total`;
  statActive.textContent = `${active} active`;
  statDone.textContent   = `${doneCount} done`;

  // Show/hide clear-completed button
  if (doneCount > 0) {
    clearCompletedBtn.classList.remove('hidden');
  } else {
    clearCompletedBtn.classList.add('hidden');
  }
}

/* ── 6e. Duplicate check ── */

function isDuplicateTitle(title, tasks, excludeId = null) {
  const normalised = title.trim().toLowerCase();
  return tasks.some(t => t.id !== excludeId && t.title.trim().toLowerCase() === normalised);
}

/* ── 6f. Render ── */

function formatDueDate(dateStr) {
  if (!dateStr) return null;
  // dateStr is YYYY-MM-DD (local)
  const [yr, mo, dy] = dateStr.split('-').map(Number);
  const taskDate = new Date(yr, mo - 1, dy);
  const today    = new Date();
  today.setHours(0, 0, 0, 0);

  const diff = Math.round((taskDate - today) / 86400000);

  if (diff < 0)  return { label: `Overdue by ${Math.abs(diff)} day${Math.abs(diff) > 1 ? 's' : ''}`, overdue: true };
  if (diff === 0) return { label: 'Due today', overdue: false };
  if (diff === 1) return { label: 'Due tomorrow', overdue: false };
  return { label: `Due ${MONTHS[taskDate.getMonth()].slice(0,3)} ${taskDate.getDate()}`, overdue: false };
}

function renderTasks() {
  const allTasks = loadTasks();

  // Apply filter
  let visible;
  if      (currentFilter === 'active')    visible = allTasks.filter(t => !t.completed);
  else if (currentFilter === 'completed') visible = allTasks.filter(t =>  t.completed);
  else                                    visible = [...allTasks];

  updateStats(allTasks);

  taskListEl.innerHTML = '';

  if (visible.length === 0) {
    taskEmptyEl.classList.remove('hidden');
    return;
  }

  taskEmptyEl.classList.add('hidden');

  visible.forEach(task => {
    const li = document.createElement('li');
    li.className  = `task-item${task.completed ? ' completed' : ''}`;
    li.dataset.priority = task.priority;
    li.dataset.id       = task.id;

    // Checkbox
    const cb = document.createElement('input');
    cb.type    = 'checkbox';
    cb.className = 'task-checkbox';
    cb.checked   = task.completed;
    cb.setAttribute('aria-label', `Mark "${task.title}" as ${task.completed ? 'incomplete' : 'complete'}`);
    cb.addEventListener('change', () => toggleTask(task.id));

    // Body
    const body = document.createElement('div');
    body.className = 'task-body';

    const titleEl = document.createElement('p');
    titleEl.className   = 'task-title';
    titleEl.textContent = task.title;

    body.appendChild(titleEl);

    // Meta: priority badge + due date
    const metaRow = document.createElement('div');
    metaRow.className = 'task-meta';

    const priBadge = document.createElement('span');
    priBadge.className   = `priority-badge ${task.priority}`;
    priBadge.textContent = task.priority.charAt(0).toUpperCase() + task.priority.slice(1);
    metaRow.appendChild(priBadge);

    if (task.dueDate) {
      const dueInfo  = formatDueDate(task.dueDate);
      const dueSpan  = document.createElement('span');
      dueSpan.className   = `task-due${dueInfo.overdue ? ' overdue' : ''}`;
      dueSpan.textContent = `📅 ${dueInfo.label}`;
      metaRow.appendChild(dueSpan);
    }

    body.appendChild(metaRow);

    // Actions
    const actions = document.createElement('div');
    actions.className = 'task-actions';

    const editBtn = document.createElement('button');
    editBtn.className = 'task-action-btn edit';
    editBtn.setAttribute('aria-label', `Edit task: ${task.title}`);
    editBtn.title     = 'Edit';
    editBtn.textContent = '✏️';
    editBtn.addEventListener('click', () => openEditModal(task.id));

    const delBtn = document.createElement('button');
    delBtn.className = 'task-action-btn delete';
    delBtn.setAttribute('aria-label', `Delete task: ${task.title}`);
    delBtn.title     = 'Delete';
    delBtn.textContent = '🗑️';
    delBtn.addEventListener('click', () => deleteTask(task.id));

    actions.appendChild(editBtn);
    actions.appendChild(delBtn);

    li.appendChild(cb);
    li.appendChild(body);
    li.appendChild(actions);

    taskListEl.appendChild(li);
  });
}

/* ── 6g. CRUD operations ── */

function addTask(title, priority, dueDate) {
  const tasks = loadTasks();

  if (isDuplicateTitle(title, tasks)) {
    return { success: false, error: 'A task with that title already exists.' };
  }

  const newTask = {
    id:        `task_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    title:     title.trim(),
    priority,
    dueDate:   dueDate || '',
    completed: false,
    createdAt: Date.now(),
  };

  tasks.push(newTask);
  saveTasks(tasks);
  return { success: true };
}

function toggleTask(id) {
  const tasks = loadTasks();
  const task  = tasks.find(t => t.id === id);
  if (!task) return;
  task.completed = !task.completed;
  saveTasks(tasks);
  renderTasks();
}

function deleteTask(id) {
  let tasks = loadTasks();
  tasks     = tasks.filter(t => t.id !== id);
  saveTasks(tasks);
  renderTasks();
}

function updateTask(id, { title, priority, dueDate }) {
  const tasks = loadTasks();

  if (isDuplicateTitle(title, tasks, id)) {
    return { success: false, error: 'Another task with that title already exists.' };
  }

  const task = tasks.find(t => t.id === id);
  if (!task) return { success: false, error: 'Task not found.' };

  task.title    = title.trim();
  task.priority = priority;
  task.dueDate  = dueDate || '';
  saveTasks(tasks);
  return { success: true };
}

/* ── 6h. Add task form ── */

addTaskForm.addEventListener('submit', (e) => {
  e.preventDefault();
  taskError.textContent = '';

  const title    = taskTitleInput.value.trim();
  const priority = taskPriorityEl.value;
  const dueDate  = taskDueEl.value;

  if (!title) {
    taskError.textContent = 'Task title cannot be empty.';
    taskTitleInput.focus();
    return;
  }

  const result = addTask(title, priority, dueDate);
  if (!result.success) {
    taskError.textContent = result.error;
    taskTitleInput.focus();
    return;
  }

  // Reset form
  taskTitleInput.value = '';
  taskDueEl.value      = '';
  taskPriorityEl.value = 'medium';

  renderTasks();
  taskTitleInput.focus();
});

/* ── 6i. Clear completed ── */

clearCompletedBtn.addEventListener('click', () => {
  const tasks    = loadTasks();
  const doneCount = tasks.filter(t => t.completed).length;
  if (doneCount === 0) return;

  const confirmed = window.confirm(
    `Remove ${doneCount} completed task${doneCount > 1 ? 's' : ''}? This cannot be undone.`
  );
  if (!confirmed) return;

  saveTasks(tasks.filter(t => !t.completed));
  renderTasks();
});

/* =============================================================
   7. EDIT MODAL
   ============================================================= */

const editModal      = document.getElementById('edit-modal');
const editTaskForm   = document.getElementById('edit-task-form');
const editTitleInput = document.getElementById('edit-task-title');
const editPriority   = document.getElementById('edit-task-priority');
const editDue        = document.getElementById('edit-task-due');
const editTaskError  = document.getElementById('edit-task-error');
const editCancelBtn  = document.getElementById('edit-cancel-btn');

let editingTaskId = null;

function openEditModal(id) {
  const tasks = loadTasks();
  const task  = tasks.find(t => t.id === id);
  if (!task) return;

  editingTaskId         = id;
  editTitleInput.value  = task.title;
  editPriority.value    = task.priority;
  editDue.value         = task.dueDate || '';
  editTaskError.textContent = '';

  editModal.classList.remove('hidden');
  editTitleInput.focus();
  editTitleInput.select();
}

function closeEditModal() {
  editModal.classList.add('hidden');
  editingTaskId = null;
}

editCancelBtn.addEventListener('click', closeEditModal);

// Close on overlay click (but not on the box itself)
editModal.addEventListener('click', (e) => {
  if (e.target === editModal) closeEditModal();
});

// Escape key closes modal
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !editModal.classList.contains('hidden')) {
    closeEditModal();
  }
});

editTaskForm.addEventListener('submit', (e) => {
  e.preventDefault();
  editTaskError.textContent = '';

  const title    = editTitleInput.value.trim();
  const priority = editPriority.value;
  const dueDate  = editDue.value;

  if (!title) {
    editTaskError.textContent = 'Task title cannot be empty.';
    editTitleInput.focus();
    return;
  }

  const result = updateTask(editingTaskId, { title, priority, dueDate });
  if (!result.success) {
    editTaskError.textContent = result.error;
    editTitleInput.focus();
    return;
  }

  closeEditModal();
  renderTasks();
});

/* =============================================================
   8. INITIALISATION
   ============================================================= */

function init() {
  // Apply theme before first paint (already applied via initTheme called below)
  initTheme();

  // Boot clock (also sets greeting + name label)
  updateNameLabel();
  updateClock();
  setInterval(updateClock, 1000);

  // Timer
  initTimer();
  renderTimer();
  stopBtn.disabled = true; // ensure correct initial state

  // Quick Links: load defaults on first run
  const storedLinks = storageGet(STORAGE_KEYS.LINKS, null);
  if (storedLinks === null) {
    saveLinks(DEFAULT_LINKS.map(l => ({ ...l })));
  }
  renderLinks();

  // Tasks
  setFilter(currentFilter); // re-applies active tab and renders
}

// Apply theme synchronously before init runs to avoid flash
(function earlyTheme() {
  const saved = storageGet(STORAGE_KEYS.THEME, 'light');
  document.documentElement.setAttribute('data-theme', saved);
}());

init();
