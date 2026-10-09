/**
 * To-Do List Life Dashboard
 * Single-file Vanilla JS application — no external dependencies.
 *
 * Module pattern with conditional exports for Node.js test environment support.
 */

/* ============================================================
 * StorageManager
 * Single point of contact for all localStorage read/write ops.
 * ============================================================ */
const StorageManager = {
  KEYS: {
    TASKS: 'tasks',
    USERNAME: 'username',
    THEME: 'theme',
    QUICK_LINKS: 'quickLinks',
  },

  /**
   * Read and JSON-parse a value from localStorage.
   * @param {string} key
   * @returns {*|null} Parsed value, or null if key absent / parse fails.
   */
  get(key) {
    try {
      const raw = (typeof localStorage !== 'undefined')
        ? localStorage.getItem(key)
        : null;
      return raw !== null ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  },

  /**
   * JSON-stringify a value and write it to localStorage.
   * @param {string} key
   * @param {*} value
   * @returns {boolean} true on success, false on QuotaExceededError or any other error.
   */
  set(key, value) {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, JSON.stringify(value));
      }
      return true;
    } catch (e) {
      console.error('StorageManager.set failed:', e);
      return false;
    }
  },

  /**
   * Remove a key from localStorage.
   * @param {string} key
   */
  remove(key) {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(key);
      }
    } catch (e) {
      // Silently ignore removal errors
    }
  },

  // ─── Typed Getters ────────────────────────────────────────────────────────

  /**
   * Read tasks from storage.
   * @returns {Array} Validated Task array, or [] on missing / invalid data.
   */
  getTasks() {
    const data = this.get(this.KEYS.TASKS);
    return this._validateTasks(data);
  },

  /**
   * Read username from storage.
   * @returns {string} Stored username, or '' if missing / not a string.
   */
  getUsername() {
    const data = this.get(this.KEYS.USERNAME);
    if (data === null || typeof data !== 'string') {
      return '';
    }
    return data;
  },

  /**
   * Read theme from storage.
   * @returns {'light'|'dark'} Validated theme, or 'light' as default.
   */
  getTheme() {
    const data = this.get(this.KEYS.THEME);
    return this._validateTheme(data);
  },

  /**
   * Read quick links from storage.
   * @returns {Array} Validated QuickLink array, or [] on missing / invalid data.
   */
  getQuickLinks() {
    const data = this.get(this.KEYS.QUICK_LINKS);
    return this._validateQuickLinks(data);
  },

  // ─── Private Validators ──────────────────────────────────────────────────

  /**
   * Validate that data is a proper array; return [] otherwise.
   * @param {*} data
   * @returns {Array}
   */
  _validateTasks(data) {
    return Array.isArray(data) ? data : [];
  },

  /**
   * Validate that data is 'light' or 'dark'; return 'light' otherwise.
   * @param {*} data
   * @returns {'light'|'dark'}
   */
  _validateTheme(data) {
    return (data === 'light' || data === 'dark') ? data : 'light';
  },

  /**
   * Validate that data is a proper array; return [] otherwise.
   * @param {*} data
   * @returns {Array}
   */
  _validateQuickLinks(data) {
    return Array.isArray(data) ? data : [];
  },
};

/* ============================================================
 * Validator
 * Pure-function module for input validation. No side effects.
 * ============================================================ */
const Validator = {
  /**
   * Normalize text by trimming whitespace and converting to lowercase.
   * Used for case-insensitive duplicate detection.
   * @param {string} text
   * @returns {string}
   */
  normalizeText(text) {
    return text.trim().toLowerCase();
  },

  /**
   * Check whether newText (after normalization) duplicates any existing task.
   * Linear scan — O(n). Handles up to 1,000 tasks within 500 ms.
   * @param {string} newText
   * @param {Array<{text: string}>} existingTasks
   * @returns {boolean}
   */
  isDuplicate(newText, existingTasks) {
    const normalized = this.normalizeText(newText);
    return existingTasks.some(task => this.normalizeText(task.text) === normalized);
  },

  /**
   * Validate task text.
   * Rules (in order):
   *   1. Must not be empty or whitespace-only.
   *   2. Must not exceed 200 characters (after trim).
   *   3. Must not duplicate an existing task (case-insensitive, trimmed).
   *
   * @param {string} text
   * @param {Array<{text: string}>} existingTasks
   * @returns {{ valid: true } | { valid: false, error: string }}
   */
  validateTaskText(text, existingTasks) {
    if (typeof text !== 'string' || text.trim().length === 0) {
      return { valid: false, error: 'Task tidak boleh kosong.' };
    }
    if (text.trim().length > 200) {
      return { valid: false, error: 'Task tidak boleh melebihi 200 karakter.' };
    }
    if (this.isDuplicate(text, existingTasks)) {
      return { valid: false, error: 'Task tersebut sudah ada dalam daftar.' };
    }
    return { valid: true };
  },

  /**
   * Validate a username.
   * Rules (in order):
   *   1. Must not be empty or whitespace-only.
   *   2. Must not exceed 50 characters (after trim).
   *
   * @param {string} name
   * @returns {{ valid: true } | { valid: false, error: string }}
   */
  validateUsername(name) {
    if (typeof name !== 'string' || name.trim().length === 0) {
      return { valid: false, error: 'Nama tidak boleh kosong.' };
    }
    if (name.trim().length > 50) {
      return { valid: false, error: 'Nama tidak boleh melebihi 50 karakter.' };
    }
    return { valid: true };
  },

  /**
   * Validate a Quick Link label.
   * Rules (in order):
   *   1. Must not be empty or whitespace-only.
   *   2. Must not exceed 50 characters (after trim).
   *
   * @param {string} label
   * @returns {{ valid: true } | { valid: false, error: string }}
   */
  validateQuickLinkLabel(label) {
    if (typeof label !== 'string' || label.trim().length === 0) {
      return { valid: false, error: 'Label tidak boleh kosong.' };
    }
    if (label.trim().length > 50) {
      return { valid: false, error: 'Label tidak boleh melebihi 50 karakter.' };
    }
    return { valid: true };
  },

  /**
   * Validate a Quick Link URL.
   * Rule: URL must start with 'http://' or 'https://'.
   *
   * @param {string} url
   * @returns {{ valid: true } | { valid: false, error: string }}
   */
  validateQuickLinkUrl(url) {
    if (typeof url !== 'string' || (!url.startsWith('http://') && !url.startsWith('https://'))) {
      return { valid: false, error: "URL harus dimulai dengan 'http://' atau 'https://'." };
    }
    return { valid: true };
  },
};

/* ============================================================
 * NotificationModule
 * Displays auto-dismissing toast notifications (success/error/warning).
 * ============================================================ */
const NotificationModule = {
  /** @type {HTMLElement|null} */
  _container: null,

  /**
   * Ensure the notification container element is available.
   */
  init() {
    this._container = document.getElementById('notification-container');
    if (!this._container) {
      // Fallback: create container if not found in DOM
      this._container = document.createElement('div');
      this._container.id = 'notification-container';
      document.body.appendChild(this._container);
    }
  },

  /**
   * Show a toast notification.
   * @param {string} message
   * @param {'success'|'error'|'warning'} [type='success']
   * @param {number} [duration=3000] ms before auto-hide
   */
  show(message, type, duration) {
    const resolvedType = type || 'success';
    const resolvedDuration = (typeof duration === 'number') ? duration : 3000;
    const toast = this._createToastElement(message, resolvedType);
    if (!this._container) this.init();
    this._container.appendChild(toast);

    setTimeout(() => {
      this._removeToast(toast);
    }, resolvedDuration);
  },

  /**
   * Remove all visible toasts immediately.
   */
  hide() {
    if (!this._container) return;
    Array.from(this._container.children).forEach(child => {
      this._removeToast(child);
    });
  },

  /**
   * Animate out then remove a toast element.
   * @param {HTMLElement} toast
   */
  _removeToast(toast) {
    if (!toast || !toast.parentNode) return;
    toast.classList.add('hiding');
    // Remove after animation (200ms)
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 210);
  },

  /**
   * Create a toast element.
   * @param {string} message
   * @param {string} type
   * @returns {HTMLElement}
   */
  _createToastElement(message, type) {
    const el = document.createElement('div');
    el.className = 'toast ' + type;
    el.textContent = message;
    return el;
  },
};

/* ============================================================
 * ThemeModule
 * Manages light/dark mode toggle with localStorage persistence.
 * The actual no-flash init is handled by the inline <head> script.
 * ============================================================ */
const ThemeModule = {
  /**
   * Reference only — actual no-flash logic runs from inline <head> script.
   * This method exists so other code can call it without errors.
   */
  initNoFlash() {
    // Handled by inline <head> script — nothing to do here.
  },

  /**
   * Attach event listener to the theme toggle button and sync the
   * button label with the current theme.
   */
  init() {
    // Sync body class with what the inline script set on <html>
    if (document.documentElement.classList.contains('dark-mode')) {
      document.body.classList.add('dark-mode');
    }

    const btn = document.getElementById('theme-toggle');
    if (btn) {
      btn.addEventListener('click', () => this.toggle());
    }
    this._updateToggleLabel();
  },

  /**
   * Toggle between light and dark theme.
   */
  toggle() {
    const current = this.getCurrent();
    const next = current === 'dark' ? 'light' : 'dark';
    this._applyTheme(next);
    const saved = StorageManager.set(StorageManager.KEYS.THEME, next);
    if (!saved) {
      NotificationModule.show('Tema tidak dapat disimpan.', 'error');
    }
    this._updateToggleLabel();
  },

  /**
   * Apply a theme by adding/removing the `dark-mode` class on both
   * <html> and <body> so CSS selectors and the inline-script class
   * both work correctly.
   * @param {'light'|'dark'} theme
   */
  _applyTheme(theme) {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark-mode');
      document.body.classList.add('dark-mode');
    } else {
      document.documentElement.classList.remove('dark-mode');
      document.body.classList.remove('dark-mode');
    }
  },

  /**
   * Return the current theme based on <body> class.
   * @returns {'light'|'dark'}
   */
  getCurrent() {
    return document.body.classList.contains('dark-mode') ? 'dark' : 'light';
  },

  /**
   * Update the toggle button label to reflect the current theme.
   */
  _updateToggleLabel() {
    const btn = document.getElementById('theme-toggle');
    if (!btn) return;
    const current = this.getCurrent();
    btn.textContent = current === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode';
    btn.setAttribute('aria-label', current === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
  },
};

/* ============================================================
 * GreetingModule
 * Clock tick, date display, time-of-day greeting, and custom name.
 * ============================================================ */
const GreetingModule = {
  /** @type {number|null} */
  _intervalId: null,

  /**
   * Bootstrap the greeting: start clock, render greeting + name form.
   */
  init() {
    this._tick();                  // Immediate display (Req 2.7)
    this._intervalId = setInterval(() => this._tick(), 1000);
    this._renderNameInput();
    this._renderGreeting();

    // Save name button / form submit
    const form = document.getElementById('name-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const input = document.getElementById('username-input');
        if (input) this.saveName(input.value);
      });
    }

    // Edit name button
    const editBtn = document.getElementById('edit-name-btn');
    if (editBtn) {
      editBtn.addEventListener('click', () => {
        const nameForm = document.getElementById('name-form');
        if (nameForm) nameForm.style.display = '';
        editBtn.style.display = 'none';
        const input = document.getElementById('username-input');
        if (input) input.focus();
      });
    }
  },

  /**
   * Update the clock and date DOM elements.
   * On failure, show fallback text — no error thrown.
   */
  _tick() {
    try {
      const now = new Date();
      const clockEl = document.getElementById('clock');
      const dateEl = document.getElementById('date');
      if (clockEl) clockEl.textContent = this._formatTime(now);
      if (dateEl) dateEl.textContent = this._formatDate(now);
    } catch (e) {
      const clockEl = document.getElementById('clock');
      if (clockEl) clockEl.textContent = 'Waktu tidak tersedia';
    }
  },

  /**
   * Return the time-of-day greeting for a given hour (0–23).
   * @param {number} hour
   * @returns {'Good Morning'|'Good Afternoon'|'Good Evening'}
   */
  _getGreeting(hour) {
    if (hour >= 0 && hour <= 11) return 'Good Morning';
    if (hour >= 12 && hour <= 17) return 'Good Afternoon';
    return 'Good Evening';
  },

  /**
   * Format a Date as 'HH:MM' in the user's local timezone.
   * @param {Date} date
   * @returns {string}
   */
  _formatTime(date) {
    const h = String(date.getHours()).padStart(2, '0');
    const m = String(date.getMinutes()).padStart(2, '0');
    return h + ':' + m;
  },

  /**
   * Format a Date as 'Thursday, 8 October 2026'.
   * @param {Date} date
   * @returns {string}
   */
  _formatDate(date) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];
    const dayName = days[date.getDay()];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return dayName + ', ' + day + ' ' + month + ' ' + year;
  },

  /**
   * Update #greeting-text with the appropriate greeting and name.
   */
  _renderGreeting() {
    const el = document.getElementById('greeting-text');
    if (!el) return;
    const hour = new Date().getHours();
    const salutation = this._getGreeting(hour);
    const name = StorageManager.getUsername();
    el.textContent = name ? salutation + ', ' + name + '!' : salutation + '!';
  },

  /**
   * Pre-fill #username-input with the stored name and toggle
   * the form/edit button visibility.
   */
  _renderNameInput() {
    const input = document.getElementById('username-input');
    const form = document.getElementById('name-form');
    const editBtn = document.getElementById('edit-name-btn');
    if (!input) return;

    const name = StorageManager.getUsername();
    input.value = name;

    if (name && form && editBtn) {
      form.style.display = 'none';
      editBtn.style.display = '';
    }
  },

  /**
   * Validate and persist the username.
   * @param {string} name Raw input value
   */
  saveName(name) {
    const errorEl = document.getElementById('greeting-error');
    const result = Validator.validateUsername(name);

    if (!result.valid) {
      if (errorEl) errorEl.textContent = result.error;
      return;
    }

    if (errorEl) errorEl.textContent = '';

    const trimmed = name.trim();
    const saved = StorageManager.set(StorageManager.KEYS.USERNAME, trimmed);

    if (!saved) {
      NotificationModule.show('Nama tidak dapat disimpan.', 'error');
      return;
    }

    // Hide form, show edit button
    const form = document.getElementById('name-form');
    const editBtn = document.getElementById('edit-name-btn');
    if (form) form.style.display = 'none';
    if (editBtn) editBtn.style.display = '';

    this._renderGreeting();
    NotificationModule.show('Nama berhasil disimpan!', 'success');
  },
};

/* ============================================================
 * TimerModule
 * Pomodoro countdown timer (25 minutes) with state machine.
 *
 * States: idle | running | stopped
 *   idle    + start  → running
 *   idle    + reset  → idle       (no-op)
 *   idle    + stop   → idle       (no-op)
 *   running + stop   → stopped
 *   running + tick=0 → idle       (+ onComplete notification)
 *   running + reset  → (disabled — button inactive)
 *   stopped + start  → running    (resume from remaining time)
 *   stopped + reset  → idle       (reset to 25:00)
 * ============================================================ */
const TimerModule = {
  /** Total duration in seconds (25 minutes). */
  DURATION: 25 * 60,

  /** @type {'idle'|'running'|'stopped'} */
  _state: 'idle',

  /** Remaining seconds. */
  _remaining: 25 * 60,

  /** @type {number|null} */
  _intervalId: null,

  /**
   * Bootstrap the timer: render initial display and buttons.
   * Event listeners for Start/Stop/Reset buttons are attached here.
   * (Req 4.2, 4.3, 4.4, 4.5, 4.8, 4.9, 10.4)
   */
  init() {
    const startBtn = document.getElementById('timer-start');
    const stopBtn  = document.getElementById('timer-stop');
    const resetBtn = document.getElementById('timer-reset');

    if (startBtn) startBtn.addEventListener('click', () => this.start());
    if (stopBtn)  stopBtn.addEventListener('click',  () => this.stop());
    if (resetBtn) resetBtn.addEventListener('click', () => this.reset());

    this._renderDisplay();
    this._renderButtons();
  },

  /**
   * Start the countdown from the current _remaining value.
   * Transitions: idle → running, stopped → running.
   */
  start() {
    if (this._state === 'running') return;
    this._state = 'running';
    this._intervalId = setInterval(() => this._tick(), 1000);
    this._renderDisplay();
    this._renderButtons();
  },

  /**
   * Stop the countdown without resetting the remaining time.
   * Transition: running → stopped.
   */
  stop() {
    if (this._state !== 'running') return;
    clearInterval(this._intervalId);
    this._intervalId = null;
    this._state = 'stopped';
    this._renderDisplay();
    this._renderButtons();
  },

  /**
   * Stop the countdown and reset to the full 25:00 duration.
   * Disabled while running (button is inactive in that state).
   * Transitions: idle → idle (no-op), stopped → idle.
   */
  reset() {
    if (this._state === 'running') return; // guard — button should be disabled
    clearInterval(this._intervalId);
    this._intervalId = null;
    this._state = 'idle';
    this._remaining = this.DURATION;
    this._renderDisplay();
    this._renderButtons();
  },

  /**
   * Called every second while running.
   * Decrements _remaining by 1, re-renders the display, and triggers
   * _onComplete() when the countdown reaches zero.
   * (Req 4.2, 4.7)
   */
  _tick() {
    this._remaining -= 1;
    this._renderDisplay();
    if (this._remaining <= 0) {
      this._onComplete();
    }
  },

  /**
   * Invoked when the countdown reaches 00:00.
   * Clears the interval, resets state to idle, ensures _remaining is 0,
   * re-renders display and buttons, plays the completion sound, and shows
   * a visual notification via NotificationModule.
   * (Req 4.6)
   */
  _onComplete() {
    clearInterval(this._intervalId);
    this._intervalId = null;
    this._state = 'idle';
    this._remaining = 0;
    this._renderDisplay();
    this._renderButtons();
    this._playSound();
    NotificationModule.show('Focus session selesai! Waktunya istirahat. 🎉', 'success', 5000);
  },

  /**
   * Format a number of seconds as 'MM:SS' with zero-padding.
   * @param {number} secs
   * @returns {string}  e.g. 1500 → '25:00', 90 → '01:30', 5 → '00:05'
   */
  _formatTime(secs) {
    const minutes = Math.floor(secs / 60);
    const seconds = secs % 60;
    return String(minutes).padStart(2, '0') + ':' + String(seconds).padStart(2, '0');
  },

  /**
   * Update the timer display element with the current _remaining time
   * and the status label text + CSS class.
   * (Req 4.1, 4.7)
   */
  _renderDisplay() {
    const displayEl = document.getElementById('timer-display');
    const statusEl  = document.getElementById('timer-status');

    if (displayEl) {
      displayEl.textContent = this._formatTime(this._remaining);
    }

    if (statusEl) {
      // Remove all state classes before applying the current one
      statusEl.classList.remove('running', 'stopped');

      if (this._state === 'running') {
        statusEl.textContent = 'Running';
        statusEl.classList.add('running');
      } else if (this._state === 'stopped') {
        statusEl.textContent = 'Stopped';
        statusEl.classList.add('stopped');
      } else {
        // idle
        statusEl.textContent = 'Ready';
        // No extra class for idle/ready state
      }
    }
  },

  /**
   * Enable/disable Start, Stop, and Reset buttons based on current _state.
   *
   * State machine button rules:
   *   idle:    Start=enabled,  Stop=disabled, Reset=enabled
   *   running: Start=disabled, Stop=enabled,  Reset=disabled
   *   stopped: Start=enabled,  Stop=disabled, Reset=enabled
   *
   * (Req 4.3, 4.4, 4.9)
   */
  _renderButtons() {
    const startBtn = document.getElementById('timer-start');
    const stopBtn  = document.getElementById('timer-stop');
    const resetBtn = document.getElementById('timer-reset');

    if (!startBtn || !stopBtn || !resetBtn) return;

    if (this._state === 'running') {
      startBtn.disabled = true;
      stopBtn.disabled  = false;
      resetBtn.disabled = true;
    } else if (this._state === 'stopped') {
      startBtn.disabled = false;
      stopBtn.disabled  = true;
      resetBtn.disabled = false;
    } else {
      // idle
      startBtn.disabled = false;
      stopBtn.disabled  = true;
      resetBtn.disabled = false;
    }
  },

  /**
   * Play an audio beep using the Web Audio API to signal timer completion.
   * Uses a sine-wave oscillator at 440 Hz for 1 second.
   * Silently fails if AudioContext is not available in the browser.
   * (Req 4.6)
   */
  _playSound() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;

      const ctx        = new AudioCtx();
      const oscillator = ctx.createOscillator();
      const gainNode   = ctx.createGain();

      oscillator.type            = 'sine';
      oscillator.frequency.value = 440; // Hz — concert A

      // Gentle ramp-down to avoid a click at the end
      gainNode.gain.setValueAtTime(0.4, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1);

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 1);

      // Close the context shortly after to free resources
      oscillator.onended = () => {
        ctx.close();
      };
    } catch (e) {
      // AudioContext not available — silently ignore
    }
  },
};

/* ============================================================
 * TodoModule
 * CRUD operations for the To-Do List with duplicate prevention.
 *
 * Persistence: all changes are written to localStorage via StorageManager.
 * In-memory state (_tasks) is always kept in sync with storage.
 * ============================================================ */
const TodoModule = {
  /** @type {Array<{id: string, text: string, completed: boolean, createdAt: number}>} */
  _tasks: [],

  /**
   * Bootstrap the module: load tasks from storage, render the list,
   * and attach the Add Task button event listener.
   * Also attaches an input listener to #task-input to clear validation
   * errors as the user types (Req 6.5).
   * (Req 5.16, 5.17)
   */
  init() {
    this._tasks = StorageManager.getTasks();
    this._renderList();

    const addBtn = document.getElementById('add-task-btn');
    if (addBtn) {
      addBtn.addEventListener('click', () => this.addTask());
    }

    // Clear error message whenever the user modifies the input (Req 6.5)
    const taskInput = document.getElementById('task-input');
    if (taskInput) {
      taskInput.addEventListener('input', () => {
        const errorEl = document.getElementById('task-error');
        if (errorEl) errorEl.textContent = '';
      });
    }
  },

  /**
   * Generate a unique task identifier using a timestamp + random suffix.
   * @returns {string}  e.g. "1720000000000_a3f2"
   */
  _generateId() {
    return Date.now() + '_' + Math.random().toString(36).slice(2, 6);
  },

  /**
   * Clear and fully re-render the #task-list element from _tasks.
   * (Req 5.16)
   */
  _renderList() {
    const listEl = document.getElementById('task-list');
    if (!listEl) return;

    // Clear existing items
    listEl.innerHTML = '';

    this._tasks.forEach(task => {
      const item = this._renderTask(task);
      listEl.appendChild(item);
    });
  },

  /**
   * Build and return a <li> element for a single task.
   * Structure:
   *   <li data-id="..." [class="completed"]>
   *     <input type="checkbox" class="task-checkbox" [checked]>
   *     <span class="task-text">...</span>
   *     <div class="task-actions">
   *       <button class="btn-edit">Edit</button>
   *       <button class="btn-delete">Delete</button>
   *     </div>
   *   </li>
   *
   * @param {{id: string, text: string, completed: boolean, createdAt: number}} task
   * @returns {HTMLLIElement}
   */
  _renderTask(task) {
    const li = document.createElement('li');
    li.setAttribute('data-id', task.id);
    if (task.completed) {
      li.classList.add('completed');
    }

    // Checkbox (Req 5.9)
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'task-checkbox';
    checkbox.checked = task.completed;
    checkbox.setAttribute('aria-label', 'Tandai selesai: ' + task.text);
    checkbox.addEventListener('change', () => this.toggleComplete(task.id));

    // Task text (Req 5.10)
    const span = document.createElement('span');
    span.className = 'task-text';
    span.textContent = task.text;

    // Action buttons (Req 5.11)
    const actions = document.createElement('div');
    actions.className = 'task-actions';

    const editBtn = document.createElement('button');
    editBtn.className = 'btn-edit';
    editBtn.textContent = 'Edit';
    editBtn.setAttribute('aria-label', 'Edit task: ' + task.text);
    editBtn.addEventListener('click', () => this.editTask(task.id));

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn-delete';
    deleteBtn.textContent = 'Delete';
    deleteBtn.setAttribute('aria-label', 'Hapus task: ' + task.text);
    deleteBtn.addEventListener('click', () => this.deleteTask(task.id));

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);

    li.appendChild(checkbox);
    li.appendChild(span);
    li.appendChild(actions);

    return li;
  },

  // ─── CRUD operations ─────────────────────────────────────────────────────

  /**
   * Read task text from #task-input, validate, create task object,
   * persist, and re-render.
   * On validation failure: show error in #task-error, keep input text.
   * On success: clear input and error, persist, re-render, show toast.
   * (Req 5.2, 5.3, 5.4, 6.1, 6.2, 6.3, 6.5, 6.6)
   */
  addTask() {
    const inputEl = document.getElementById('task-input');
    const errorEl = document.getElementById('task-error');
    const text = inputEl ? inputEl.value : '';

    const result = Validator.validateTaskText(text, this._tasks);

    if (!result.valid) {
      // Show error and keep the input text intact (Req 6.5, 6.6)
      if (errorEl) errorEl.textContent = result.error;
      return;
    }

    // Build the new task object (Req 5.2)
    const task = {
      id: this._generateId(),
      text: text.trim(),
      completed: false,
      createdAt: Date.now(),
    };

    this._tasks.push(task);
    this._saveToStorage();
    this._renderList();

    // Clear input and error on success (Req 5.3)
    if (inputEl) inputEl.value = '';
    if (errorEl) errorEl.textContent = '';

    NotificationModule.show('Task berhasil ditambahkan!', 'success');
  },

  /**
   * Open or commit an edit on the task identified by id.
   *
   * Called with only id (from the Edit button): activates inline edit mode.
   * Called with id + newText (from the Save button inside edit mode): validates
   * the new text and, if valid, updates the task, persists, and re-renders.
   *
   * (Req 5.5, 5.6, 5.7, 5.8)
   * @param {string} id
   * @param {string} [newText]
   */
  editTask(id, newText) {
    // Called without newText → open edit mode
    if (newText === undefined) {
      this._activateEditMode(id);
      return;
    }

    // Called with newText → validate and save
    const otherTasks = this._tasks.filter(t => t.id !== id);
    const result = Validator.validateTaskText(newText, otherTasks);

    if (!result.valid) {
      // Keep edit mode open and show inline error if element exists
      const listEl = document.getElementById('task-list');
      if (listEl) {
        const li = listEl.querySelector('[data-id="' + id + '"]');
        if (li) {
          let errorEl = li.querySelector('.task-edit-error');
          if (!errorEl) {
            errorEl = document.createElement('span');
            errorEl.className = 'task-edit-error';
            errorEl.style.color = 'var(--color-error, #e74c3c)';
            errorEl.style.fontSize = '0.85em';
            errorEl.style.display = 'block';
            const input = li.querySelector('.task-edit-input');
            if (input && input.parentNode) {
              input.parentNode.insertBefore(errorEl, input.nextSibling);
            } else {
              li.appendChild(errorEl);
            }
          }
          errorEl.textContent = result.error;
        }
      }
      return;
    }

    // Valid — update task
    const task = this._tasks.find(t => t.id === id);
    if (!task) return;

    task.text = newText.trim();
    this._saveToStorage();
    this._renderList(); // re-render also deactivates edit mode implicitly
  },

  /**
   * Remove the task with the given id from _tasks, persist, and re-render.
   * (Req 5.14, 5.15)
   * @param {string} id
   */
  deleteTask(id) {
    this._tasks = this._tasks.filter(t => t.id !== id);
    this._saveToStorage();
    this._renderList();
  },

  /**
   * Flip the completed status of the task with the given id, persist,
   * and re-render.
   * (Req 5.9, 5.10, 5.11, 5.12)
   * @param {string} id
   */
  toggleComplete(id) {
    const task = this._tasks.find(t => t.id === id);
    if (!task) return;
    task.completed = !task.completed;
    this._saveToStorage();
    this._renderList();
  },

  /**
   * Persist the current _tasks array to localStorage via StorageManager.
   * Shows an error toast if the write fails (e.g. QuotaExceededError).
   */
  _saveToStorage() {
    const saved = StorageManager.set(StorageManager.KEYS.TASKS, this._tasks);
    if (!saved) {
      NotificationModule.show('Data tidak dapat disimpan. Perubahan tidak akan tersimpan.', 'error');
    }
  },

  /**
   * Replace the task's display span+buttons with an edit input + Save/Cancel buttons.
   * (Req 5.5, 5.6)
   * @param {string} id
   */
  _activateEditMode(id) {
    const listEl = document.getElementById('task-list');
    if (!listEl) return;

    const li = listEl.querySelector('[data-id="' + id + '"]');
    if (!li) return;

    // Find the task for pre-filling the input
    const task = this._tasks.find(t => t.id === id);
    if (!task) return;

    // Hide .task-text and .task-actions
    const textSpan   = li.querySelector('.task-text');
    const actionsDiv = li.querySelector('.task-actions');
    if (textSpan)   textSpan.style.display   = 'none';
    if (actionsDiv) actionsDiv.style.display = 'none';

    // Create edit input pre-filled with current task text
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'task-edit-input';
    input.value = task.text;
    input.setAttribute('aria-label', 'Edit task: ' + task.text);

    // Create Save button
    const saveBtn = document.createElement('button');
    saveBtn.className = 'btn-save-edit';
    saveBtn.textContent = 'Save';
    saveBtn.setAttribute('aria-label', 'Simpan perubahan task');
    saveBtn.addEventListener('click', () => this.editTask(id, input.value));

    // Create Cancel button
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn-cancel-edit';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.setAttribute('aria-label', 'Batalkan edit task');
    cancelBtn.addEventListener('click', () => this._deactivateEditMode(id));

    // Keyboard shortcuts: Enter to save, Escape to cancel
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter')  this.editTask(id, input.value);
      if (e.key === 'Escape') this._deactivateEditMode(id);
    });

    li.appendChild(input);
    li.appendChild(saveBtn);
    li.appendChild(cancelBtn);

    // Focus the input immediately so the user can start typing
    input.focus();
  },

  /**
   * Restore normal task display after editing is done or cancelled.
   * (Req 5.7)
   * @param {string} id
   */
  _deactivateEditMode(id) {
    const listEl = document.getElementById('task-list');
    if (!listEl) return;

    const li = listEl.querySelector('[data-id="' + id + '"]');
    if (!li) return;

    // Remove edit-mode elements
    const input     = li.querySelector('.task-edit-input');
    const saveBtn   = li.querySelector('.btn-save-edit');
    const cancelBtn = li.querySelector('.btn-cancel-edit');
    const errorEl   = li.querySelector('.task-edit-error');

    if (input)     li.removeChild(input);
    if (saveBtn)   li.removeChild(saveBtn);
    if (cancelBtn) li.removeChild(cancelBtn);
    if (errorEl)   li.removeChild(errorEl);

    // Restore .task-text and .task-actions
    const textSpan   = li.querySelector('.task-text');
    const actionsDiv = li.querySelector('.task-actions');
    if (textSpan)   textSpan.style.display   = '';
    if (actionsDiv) actionsDiv.style.display = '';
  },
};

/* ============================================================
 * QuickLinksModule
 * Manages Quick Links (bookmarks) — add, delete, render, persist.
 *
 * Persistence: all changes are written to localStorage via StorageManager.
 * In-memory state (_links) is always kept in sync with storage.
 * ============================================================ */
const QuickLinksModule = {
  /** @type {Array<{id: string, label: string, url: string}>} */
  _links: [],

  /**
   * Bootstrap the module: load links from storage, render the list,
   * and attach the Add Link button event listener.
   * (Req 7.7)
   */
  init() {
    this._links = StorageManager.getQuickLinks();
    this._renderLinks();

    const addBtn = document.getElementById('add-link-btn');
    if (addBtn) {
      addBtn.addEventListener('click', () => this.addLink());
    }
  },

  /**
   * Generate a unique link identifier using a timestamp + random suffix.
   * @returns {string}  e.g. "1720000000000_a3f2"
   */
  _generateId() {
    return Date.now() + '_' + Math.random().toString(36).slice(2, 6);
  },

  /**
   * Read label and URL from their respective inputs, validate both,
   * create the QuickLink object, persist, re-render, and show a toast.
   *
   * When called from the button click, label and url arguments are omitted
   * and the values are read from the DOM inputs instead.
   *
   * On validation failure: show combined/first error in #link-error.
   * On success: clear both inputs and #link-error, show success toast.
   *
   * @param {string} [label] Optional — reads from #link-label-input if absent.
   * @param {string} [url]   Optional — reads from #link-url-input if absent.
   * (Req 7.1, 7.2, 7.4, 7.7, 7.8, 7.9, 10.2, 10.8)
   */
  addLink(label, url) {
    // If called with no arguments (e.g. from button click), read from DOM
    if (label === undefined) {
      const labelInput = document.getElementById('link-label-input');
      label = labelInput ? labelInput.value : '';
    }
    if (url === undefined) {
      const urlInput = document.getElementById('link-url-input');
      url = urlInput ? urlInput.value : '';
    }

    const errorEl = document.getElementById('link-error');

    const labelResult = Validator.validateQuickLinkLabel(label);
    const urlResult   = Validator.validateQuickLinkUrl(url);

    if (!labelResult.valid || !urlResult.valid) {
      // Show the first (or only) error message
      const errorMsg = !labelResult.valid ? labelResult.error : urlResult.error;
      if (errorEl) errorEl.textContent = errorMsg;
      return;
    }

    // Build the new QuickLink object (Req 7.2)
    const link = {
      id: this._generateId(),
      label: label.trim(),
      url: url,
    };

    this._links.push(link);
    this._saveToStorage();
    this._renderLinks();

    // Clear inputs and error on success (Req 7.1)
    const labelInput = document.getElementById('link-label-input');
    const urlInput   = document.getElementById('link-url-input');
    if (labelInput) labelInput.value = '';
    if (urlInput)   urlInput.value   = '';
    if (errorEl)    errorEl.textContent = '';

    NotificationModule.show('Link berhasil ditambahkan!', 'success');
  },

  /**
   * Remove the link with the given id from _links, persist, and re-render.
   * (Req 7.5, 7.6)
   * @param {string} id
   */
  deleteLink(id) {
    this._links = this._links.filter(l => l.id !== id);
    this._saveToStorage();
    this._renderLinks();
  },

  /**
   * Persist the current _links array to localStorage via StorageManager.
   * Shows an error toast if the write fails (e.g. QuotaExceededError).
   * (Req 7.7)
   */
  _saveToStorage() {
    const ok = StorageManager.set(StorageManager.KEYS.QUICK_LINKS, this._links);
    if (!ok) {
      NotificationModule.show('Data tidak dapat disimpan. Perubahan tidak akan tersimpan.', 'error');
    }
  },

  /**
   * Clear and fully re-render the #links-container element from _links.
   * (Req 7.7)
   */
  _renderLinks() {
    const container = document.getElementById('links-container');
    if (!container) return;
    container.innerHTML = '';
    this._links.forEach(link => {
      container.appendChild(this._renderLink(link));
    });
  },

  /**
   * Build and return a DOM element for a single quick link.
   * (Req 7.2, 7.3, 7.5)
   * @param {{id: string, label: string, url: string}} link
   * @returns {HTMLElement}
   */
  _renderLink(link) {
    const item = document.createElement('div');
    item.className = 'quick-link-item';

    const anchor = document.createElement('a');
    anchor.href = link.url;
    anchor.target = '_blank';               // Req 7.3
    anchor.rel = 'noopener noreferrer';     // security best practice
    anchor.textContent = link.label;

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn-delete-link';
    deleteBtn.textContent = '✕';
    deleteBtn.setAttribute('aria-label', 'Hapus link: ' + link.label);
    deleteBtn.addEventListener('click', () => this.deleteLink(link.id));

    item.appendChild(anchor);
    item.appendChild(deleteBtn);
    return item;
  },
};

/* ============================================================
 * App — bootstrap all modules after DOMContentLoaded
 * ============================================================ */
const App = {
  init() {
    document.addEventListener('DOMContentLoaded', () => {
      ThemeModule.init();
      GreetingModule.init();
      TimerModule.init();
      TodoModule.init();
      QuickLinksModule.init();
      NotificationModule.init();
    });
  },
};

App.init();

// ─── Conditional export for Node.js test environment ─────────────────────────
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { StorageManager, Validator, NotificationModule, ThemeModule, GreetingModule, TimerModule, TodoModule, QuickLinksModule };
}
