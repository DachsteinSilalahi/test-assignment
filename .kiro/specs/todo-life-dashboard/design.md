# Design Document — To-Do List Life Dashboard

## Overview

To-Do List Life Dashboard adalah aplikasi web dashboard personal satu halaman yang dibangun sepenuhnya dengan **Vanilla HTML, CSS, dan JavaScript** tanpa framework atau backend. Aplikasi ini menggabungkan empat widget utama — Greeting (waktu/tanggal/salam/nama), Focus Timer (Pomodoro 25 menit), To-Do List (CRUD + duplikat prevention), dan Quick Links (bookmark favorit) — dalam satu layar terpadu.

Seluruh state disimpan di **Browser Local Storage** sehingga data persisten lintas sesi tanpa koneksi internet. Aplikasi mendukung **Light/Dark Mode** yang diapply sebelum render pertama untuk menghindari flash, serta **Custom Name** pada greeting.

### Batasan Desain

| Batasan | Nilai |
|---------|-------|
| File HTML | `index.html` (1 file) |
| File CSS | `css/style.css` (1 file) |
| File JS | `js/script.js` (1 file) |
| Library eksternal | Tidak ada |
| Backend / build step | Tidak ada |
| Penyimpanan | `window.localStorage` |
| Target browser | Chrome, Firefox, Edge, Safari (2 versi mayor terkini) |

---

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                          index.html                             │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  <head> — inline theme script (flash prevention)        │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  <body>                                                  │   │
│  │  ┌──────────┐ ┌──────────┐ ┌────────────┐ ┌──────────┐  │   │
│  │  │ Greeting │ │  Focus   │ │  To-Do     │ │  Quick   │  │   │
│  │  │ Section  │ │  Timer   │ │  List      │ │  Links   │  │   │
│  │  └──────────┘ └──────────┘ └────────────┘ └──────────┘  │   │
│  └──────────────────────────────────────────────────────────┘   │
│  <script src="js/script.js">                                    │
└─────────────────────────────────────────────────────────────────┘
         │                          │
         ▼                          ▼
  js/script.js              css/style.css
  (Module pattern)          (CSS custom properties)
```

### Module Architecture (js/script.js)

```
js/script.js
│
├── StorageManager       — semua read/write ke localStorage
├── Validator            — validasi input (empty, duplicate, URL, length)
├── NotificationModule   — toast messages & visual feedback
├── ThemeModule          — toggle dark-mode, persistence, no-flash init
├── GreetingModule       — clock tick, date, salam, custom name
├── TimerModule          — countdown 25 min, state machine, audio alert
├── TodoModule           — CRUD tasks, duplicate prevention
├── QuickLinksModule     — add/delete quick links
└── App.init()           — bootstrap semua modul saat DOMContentLoaded
```

### Alur Data

```
User Interaction
      │
      ▼
 Module Handler (e.g., TodoModule.addTask)
      │
      ├─► Validator.validate(input)
      │         │ invalid ──► NotificationModule.showError()
      │         │ valid   ──► continue
      │
      ├─► Update in-memory state (e.g., tasks array)
      │
      ├─► StorageManager.save(key, data)
      │         └─► localStorage.setItem(key, JSON.stringify(data))
      │
      └─► UIController.render(state)
                └─► DOM manipulation
```

### Widget Layout

```
┌──────────────────────────────────────────────────────────────┐
│                     GREETING SECTION                         │
│  Good Morning, Alice!    Thursday, 8 October 2026   10:45    │
│  [Change Name Input]  [Save Name]                            │
├───────────────────────────┬──────────────────────────────────┤
│       FOCUS TIMER         │          QUICK LINKS             │
│        25:00              │  [GitHub] [Gmail] [+ Add Link]   │
│   [Start] [Stop] [Reset]  │                                  │
├───────────────────────────┴──────────────────────────────────┤
│                        TO-DO LIST                            │
│  [___________________] [Add Task]                            │
│  ☐ Buy groceries   [Edit] [Delete]                          │
│  ☑ Read book       [Edit] [Delete]  (strikethrough)         │
└──────────────────────────────────────────────────────────────┘
│  [🌙 Dark Mode]  (toggle — top right)                        │
└──────────────────────────────────────────────────────────────┘
```

---

## Components and Interfaces

### 1. StorageManager

Satu-satunya modul yang bersentuhan langsung dengan `window.localStorage`. Semua modul lain harus melalui StorageManager untuk baca/tulis.

```javascript
const StorageManager = {
  KEYS: {
    TASKS: 'tasks',
    USERNAME: 'username',
    THEME: 'theme',
    QUICK_LINKS: 'quickLinks',
  },

  // Membaca dan mem-parse JSON dari localStorage.
  // Return null jika key tidak ada atau parsing gagal.
  get(key),                          // → any | null

  // Menyimpan data sebagai JSON ke localStorage.
  // Return true jika berhasil, false jika QuotaExceededError.
  set(key, value),                   // → boolean

  // Menghapus key dari localStorage.
  remove(key),                       // → void

  // Membaca tasks; return [] jika tidak ada / invalid.
  getTasks(),                        // → Task[]

  // Membaca username; return '' jika tidak ada / invalid.
  getUsername(),                     // → string

  // Membaca theme; return 'light' jika tidak ada / invalid.
  getTheme(),                        // → 'light' | 'dark'

  // Membaca quickLinks; return [] jika tidak ada / invalid.
  getQuickLinks(),                   // → QuickLink[]

  // Validasi tipe data setelah membaca dari storage.
  _validateTasks(data),              // → Task[]
  _validateTheme(data),              // → 'light' | 'dark'
  _validateQuickLinks(data),         // → QuickLink[]
};
```

### 2. Validator

Modul pure-function untuk validasi input. Tidak ada side effect.

```javascript
const Validator = {
  // Mengembalikan { valid: true } atau { valid: false, error: string }
  validateTaskText(text, existingTasks),  // → ValidationResult
  validateUsername(name),                // → ValidationResult
  validateQuickLinkLabel(label),         // → ValidationResult
  validateQuickLinkUrl(url),             // → ValidationResult

  // Helper normalisasi untuk duplikat check
  normalizeText(text),   // → string  (trim + toLowerCase)
  isDuplicate(text, existingTasks),  // → boolean
};

// Type: { valid: boolean, error?: string }
```

### 3. NotificationModule

Menampilkan toast notification (success/error) yang otomatis menghilang.

```javascript
const NotificationModule = {
  // Tampilkan toast dengan type 'success' | 'error' | 'warning', durasi ms
  show(message, type, duration),    // → void
  hide(),                           // → void
  _createToastElement(message, type), // → HTMLElement
};
```

### 4. ThemeModule

```javascript
const ThemeModule = {
  // Dipanggil dari inline script di <head> — tidak boleh bergantung pada DOM.
  // Membaca localStorage dan menyetel class sebelum body dirender.
  initNoFlash(),     // → void (dipanggil dari <head>)

  // Dipanggil saat DOM siap — memasang event listener pada toggle button.
  init(),            // → void

  // Toggle antara light dan dark; simpan ke storage.
  toggle(),          // → void

  // Menerapkan tema ke <body>; tidak mengubah storage.
  _applyTheme(theme), // → void  ('light' | 'dark')

  // Membaca tema saat ini dari DOM (body class).
  getCurrent(),      // → 'light' | 'dark'
};
```

### 5. GreetingModule

```javascript
const GreetingModule = {
  _intervalId: null,

  init(),              // → void  (start clock tick + load username)
  _tick(),             // → void  (update jam setiap detik)
  _getGreeting(hour),  // → 'Good Morning' | 'Good Afternoon' | 'Good Evening'
  _formatTime(date),   // → string  'HH:MM'
  _formatDate(date),   // → string  'Thursday, 8 October 2026'
  saveName(name),      // → void  (validate → save → render)
  _renderGreeting(),   // → void  (update DOM)
  _renderNameInput(),  // → void  (show/hide name form)
};
```

### 6. TimerModule

```javascript
// Timer state machine:
//   idle ──[start]──► running ──[stop]──► stopped ──[start]──► running
//   idle ──[reset]──► idle
//   running ──[reset]──► idle   (disabled saat running)
//   running ──[reach 0]──► idle + notification
//   stopped ──[reset]──► idle

const TimerModule = {
  DURATION: 25 * 60,   // seconds
  _state: 'idle',      // 'idle' | 'running' | 'stopped'
  _remaining: 25 * 60, // seconds
  _intervalId: null,

  init(),              // → void
  start(),             // → void
  stop(),              // → void
  reset(),             // → void
  _tick(),             // → void  (decrement + render + check 0)
  _onComplete(),       // → void  (stop + notif visual + audio)
  _formatTime(secs),   // → string  'MM:SS'
  _renderDisplay(),    // → void
  _renderButtons(),    // → void  (enable/disable berdasarkan state)
  _playSound(),        // → void  (AudioContext beep)
};
```

### 7. TodoModule

```javascript
const TodoModule = {
  _tasks: [],   // in-memory Task[]

  init(),                          // → void  (load from storage + render)
  addTask(text),                   // → void  (validate → create → save → render)
  editTask(id, newText),           // → void  (validate → update → save → render)
  deleteTask(id),                  // → void  (filter → save → render)
  toggleComplete(id),              // → void  (flip completed → save → render)
  _generateId(),                   // → string  (timestamp + random)
  _saveToStorage(),                // → void
  _renderList(),                   // → void  (full re-render task list)
  _renderTask(task),               // → HTMLElement
  _activateEditMode(id),           // → void
  _deactivateEditMode(id),         // → void
};
```

### 8. QuickLinksModule

```javascript
const QuickLinksModule = {
  _links: [],   // in-memory QuickLink[]

  init(),                  // → void  (load from storage + render)
  addLink(label, url),     // → void  (validate → create → save → render)
  deleteLink(id),          // → void  (filter → save → render)
  _generateId(),           // → string
  _saveToStorage(),        // → void
  _renderLinks(),          // → void
  _renderLink(link),       // → HTMLElement
};
```

### 9. App

```javascript
const App = {
  init() {
    // ThemeModule.initNoFlash() dipanggil dari <head>, bukan di sini
    document.addEventListener('DOMContentLoaded', () => {
      ThemeModule.init();
      GreetingModule.init();
      TimerModule.init();
      TodoModule.init();
      QuickLinksModule.init();
      NotificationModule.init();  // mount container element
    });
  }
};

App.init();
```

---

## Data Models

### Task Object

```javascript
/**
 * @typedef {Object} Task
 * @property {string} id          - Unique identifier (timestamp + random)
 * @property {string} text        - Task description (1–200 chars, trimmed)
 * @property {boolean} completed  - Status selesai/belum
 * @property {number} createdAt   - Unix timestamp (Date.now())
 */

// Contoh:
{
  id: "1720000000000_a3f2",
  text: "Buy groceries",
  completed: false,
  createdAt: 1720000000000
}
```

### QuickLink Object

```javascript
/**
 * @typedef {Object} QuickLink
 * @property {string} id     - Unique identifier
 * @property {string} label  - Display label (1–50 chars, trimmed)
 * @property {string} url    - Full URL dimulai dengan http:// atau https://
 */

// Contoh:
{
  id: "1720000001000_b7c9",
  label: "GitHub",
  url: "https://github.com"
}
```

### Local Storage Schema

```javascript
// key: 'tasks'
// value: JSON.stringify(Task[])
// default: '[]'

// key: 'username'
// value: string (plain, bukan JSON)
// default: ''

// key: 'theme'
// value: '"light"' | '"dark"'  (atau disimpan sebagai plain string)
// default: 'light'

// key: 'quickLinks'
// value: JSON.stringify(QuickLink[])
// default: '[]'
```

### Validasi Constraints

| Field | Constraint |
|-------|-----------|
| Task text | 1–200 karakter, bukan whitespace-only, tidak duplikat (case-insensitive + trim) |
| Username | 1–50 karakter, bukan whitespace-only |
| QuickLink label | 1–50 karakter, bukan whitespace-only |
| QuickLink url | Dimulai dengan `http://` atau `https://` |
| Theme | Hanya `"light"` atau `"dark"` |

### Duplicate Detection Algorithm

```javascript
// Validator.normalizeText
function normalizeText(text) {
  return text.trim().toLowerCase();
}

// Validator.isDuplicate
function isDuplicate(newText, existingTasks) {
  const normalized = normalizeText(newText);
  return existingTasks.some(task => normalizeText(task.text) === normalized);
}

// Kompleksitas: O(n) — linear scan, maks 1.000 task < 500ms
```

### Timer State Machine

```
States: idle | running | stopped

Transitions:
  idle    + start  → running
  idle    + reset  → idle      (no-op)
  idle    + stop   → idle      (no-op)
  running + stop   → stopped
  running + tick=0 → idle      (+ onComplete notification)
  running + reset  → (disabled — button inactive)
  stopped + start  → running   (resume dari waktu tersisa)
  stopped + reset  → idle      (reset ke 25:00)

Button states:
  idle:    Start=enabled, Stop=disabled, Reset=enabled
  running: Start=disabled, Stop=enabled, Reset=disabled
  stopped: Start=enabled, Stop=disabled, Reset=enabled
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Reflection: Redundancy Analysis

Sebelum finalisasi, dilakukan refleksi untuk menghilangkan redundansi:

- **P3 (Task Addition Round-Trip)** dan **P7 (Storage Read-After-Write)** keduanya menyentuh konsistensi storage setelah add. P7 lebih luas (mencakup seluruh siklus hidup task), sehingga P3 dipertahankan sebagai supset *add* saja karena kejelasannya, sedangkan P7 mencakup urutan operasi yang lebih kompleks.
- **P2.3, P2.4, P2.5** (kriteria per rentang jam) digabung menjadi satu property exhaustiveness di P8 untuk menghindari tiga property terpisah yang tumpang tindih.
- **P4** (Task Deletion) dan **P7** keduanya memvalidasi storage setelah delete; P4 dipertahankan karena fokus pada satu operasi atomik, P7 pada urutan operasi.
- Kriteria 5.7, 5.8, 5.12, 5.15 semuanya tercakup oleh P7 (Storage Read-After-Write), sehingga tidak perlu property terpisah.
- **P5 (Theme Round-Trip)** mencakup 8.2, 8.5, 8.6, 9.3 sekaligus — tidak perlu property tambahan untuk toggle.

---

### Property 1: Task Uniqueness Invariant

*For any* task list containing at least one task, and any new task text whose normalized form (trim + toLowerCase) matches the normalized form of any existing task in the list, calling `TodoModule.addTask(text)` SHALL leave the task list completely unchanged — same length and same contents as before the call.

**Validates: Requirements 6.1, 6.2, 6.3**

---

### Property 2: Whitespace and Empty Task Rejection

*For any* string composed entirely of whitespace characters (space `' '`, tab `'\t'`, newline `'\n'`), or the empty string, calling `Validator.validateTaskText(text, existingTasks)` SHALL return `{ valid: false }`, and calling `TodoModule.addTask(text)` SHALL leave the task list unchanged.

**Validates: Requirements 5.3, 6.4**

---

### Property 3: Task Addition Round-Trip

*For any* initial task list and any valid task text (non-empty, non-whitespace-only, not a duplicate of any existing task after normalization), after calling `TodoModule.addTask(text)`:
1. `StorageManager.getTasks()` returns an array of length exactly one greater than before.
2. The returned array contains exactly one task whose `text` field equals the trimmed form of the input.

**Validates: Requirements 5.2, 5.4, 9.1**

---

### Property 4: Task Deletion Consistency

*For any* task list of size `n ≥ 1` and any task `id` that exists in the list, after calling `TodoModule.deleteTask(id)`:
1. `StorageManager.getTasks()` returns an array of length exactly `n - 1`.
2. The returned array contains no task with that `id`.

**Validates: Requirements 5.14, 5.15**

---

### Property 5: Theme Persistence Round-Trip

*For any* theme value `t` in `{ 'light', 'dark' }`, after calling `StorageManager.set('theme', t)`, calling `StorageManager.getTheme()` SHALL return exactly `t`. Additionally, for any initial theme state (light or dark), calling `ThemeModule.toggle()` twice SHALL return the system to its original theme state (toggle is its own inverse).

**Validates: Requirements 8.2, 8.5, 8.6, 9.3**

---

### Property 6: Username Persistence Round-Trip

*For any* valid username string `s` where `s.trim().length ≥ 1` and `s.trim().length ≤ 50`, after calling `GreetingModule.saveName(s)`, calling `StorageManager.getUsername()` SHALL return exactly `s.trim()`.

**Validates: Requirements 3.3, 3.4, 9.2**

---

### Property 7: Storage Read-After-Write Consistency

*For any* sequence of task operations (`addTask`, `deleteTask`, `toggleComplete`, `editTask`) applied in any order, after each operation completes, the in-memory array `TodoModule._tasks` SHALL be deeply equal to the array returned by `StorageManager.getTasks()`. In other words, the in-memory state and the persisted state are always in sync.

**Validates: Requirements 5.4, 5.8, 5.12, 5.15, 9.1**

---

### Property 8: Greeting Time-of-Day Exhaustiveness and Correctness

*For any* integer `h` in `[0, 23]`, `GreetingModule._getGreeting(h)` SHALL return exactly one of three values:
- `'Good Morning'` if and only if `0 ≤ h ≤ 11`
- `'Good Afternoon'` if and only if `12 ≤ h ≤ 17`
- `'Good Evening'` if and only if `18 ≤ h ≤ 23`

The three ranges are mutually exclusive and exhaustive: every integer in `[0, 23]` maps to exactly one greeting, with no gaps or overlaps.

**Validates: Requirements 2.3, 2.4, 2.5**

---

### Property 9: Timer Countdown Monotonicity and Non-Negative Bound

*For any* initial remaining time `t` where `1 ≤ t ≤ 1500`, and any number of `_tick()` calls `n` where `1 ≤ n ≤ t`, after `n` ticks in `running` state:
1. `_remaining === t - n` (decrements by exactly 1 per tick).
2. `_remaining ≥ 0` (never goes below zero).
3. When `_remaining` reaches `0`, `_state` transitions to `'idle'` and `_onComplete()` is invoked.

**Validates: Requirements 4.2, 4.6, 4.7**

---

### Property 10: Quick Links Storage Round-Trip

*For any* initial quick links list and any valid `{ label, url }` pair (label non-empty non-whitespace, url starts with `http://` or `https://`), after calling `QuickLinksModule.addLink(label, url)`:
1. `StorageManager.getQuickLinks()` returns an array of length exactly one greater than before.
2. The returned array contains a link whose `label` equals `label.trim()` and whose `url` equals `url`.

**Validates: Requirements 7.2, 7.4, 9.4**

---

### Property 11: Storage Default Values on Missing Keys

*For any* of the four storage keys (`tasks`, `username`, `theme`, `quickLinks`), when the key is absent from localStorage (or contains corrupted/non-parseable data), the corresponding `StorageManager` getter SHALL return the correct default value:
- `getTasks()` → `[]`
- `getUsername()` → `''`
- `getTheme()` → `'light'`
- `getQuickLinks()` → `[]`

**Validates: Requirements 9.5, 9.7**

---

### Property 12: URL Validation Correctness

*For any* string `url` that does not start with `http://` or `https://` (including empty strings, strings with other schemes like `ftp://`, or plain domain names), `Validator.validateQuickLinkUrl(url)` SHALL return `{ valid: false }`. Conversely, for any string that starts with `http://` or `https://`, it SHALL return `{ valid: true }`.

**Validates: Requirements 7.9**

---

### Property 13: Duplicate Detection Performance

*For any* task list of up to 1,000 tasks and any input text, `Validator.isDuplicate(text, tasks)` SHALL complete in under 500 milliseconds.

**Validates: Requirements 6.7**

---

## Error Handling

### Storage Write Failure

`StorageManager.set()` catches `QuotaExceededError` dan error lain dari `localStorage.setItem()`. Jika gagal, method mengembalikan `false` dan modul pemanggil bertanggung jawab memanggil `NotificationModule.show('Data tidak dapat disimpan...', 'error')`.

```javascript
set(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    console.error('StorageManager.set failed:', e);
    return false;
  }
}
```

### Storage Read / Parse Failure

`StorageManager.get()` catches `JSON.parse` errors dan mengembalikan `null`. Setiap typed getter (`getTasks()`, dll.) menggunakan `null` sebagai sinyal untuk mengembalikan nilai default.

```javascript
get(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw !== null ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}
```

### Timezone Read Failure (Requirement 2.8)

`GreetingModule._tick()` membungkus operasi `new Date()` dalam try-catch. Jika gagal, DOM element waktu menampilkan teks `"Waktu tidak tersedia"` tanpa melempar error ke console.

### Validation Error Display

Pesan error ditampilkan melalui `NotificationModule.show()` dengan type `'error'`. Error message dihapus saat:
- Pengguna berhasil menambahkan item valid
- Pengguna mengosongkan input secara manual (event `input` pada field)

### Input Length Enforcement

Atribut HTML `maxlength` digunakan sebagai lapis pertama (browser-native). Validator tetap memeriksa panjang di JavaScript sebagai lapis kedua untuk keandalan.

---

## Testing Strategy

### Dual Testing Approach

Strategi pengujian menggunakan dua lapisan yang saling melengkapi:

1. **Unit tests (example-based)** — menguji perilaku konkret, edge case, dan integrasi antar komponen
2. **Property-based tests (PBT)** — menguji properti universal yang harus berlaku untuk semua input yang valid

### Property-Based Testing Library

Gunakan **[fast-check](https://github.com/dubzzz/fast-check)** (JavaScript) untuk mengimplementasikan property-based tests. Konfigurasi minimum **100 iterasi** per property test.

Setiap property test diberi tag komentar dalam format:
```
// Feature: todo-life-dashboard, Property N: <property_text>
```

### Property Test Mapping

| Property | Test Strategy | fast-check Arbitraries |
|----------|--------------|------------------------|
| P1: Task Uniqueness Invariant | Generate task list + duplicate input (case/spacing variants of existing task) | `fc.array(taskArb)`, `fc.string()` with case/trim mutation |
| P2: Whitespace & Empty Task Rejection | Generate strings of only whitespace chars, or empty string | `fc.stringOf(fc.constantFrom(' ', '\t', '\n'))` |
| P3: Task Addition Round-Trip | Generate valid task text + existing task list (no duplicate) | `fc.string({ minLength: 1, maxLength: 200 })` |
| P4: Task Deletion Consistency | Generate task list ≥ 1 + pick random id from list | `fc.array(taskArb, { minLength: 1 })` |
| P5: Theme Round-Trip | Generate theme from `{ 'light', 'dark' }`; verify toggle is its own inverse | `fc.constantFrom('light', 'dark')` |
| P6: Username Round-Trip | Generate valid username strings (1–50 chars, non-whitespace-only) | `fc.string({ minLength: 1, maxLength: 50 })` |
| P7: Storage Read-After-Write | Generate sequence of add/delete/toggle/edit operations; verify in-memory === storage | `fc.commands([addCmd, deleteCmd, toggleCmd, editCmd])` |
| P8: Greeting Time-of-Day | Generate integer hour in 0–23 | `fc.integer({ min: 0, max: 23 })` |
| P9: Timer Countdown Monotonicity | Generate initial time (1–1500), tick count n ≤ t | `fc.integer({ min: 1, max: 1500 })` |
| P10: Quick Links Round-Trip | Generate valid label + URL starting with http/https | `fc.string({ minLength: 1 })`, `fc.webUrl()` |
| P11: Storage Defaults | For each key, use corrupted/absent data; verify correct default returned | `fc.constantFrom(null, undefined, 42, 'bad', {})` |
| P12: URL Validation | Generate URLs without http/https prefix; verify rejection | `fc.string()` filtered to not start with `http` |
| P13: Duplicate Detection Performance | Generate list of up to 1,000 tasks; measure isDuplicate runtime | `fc.array(taskArb, { maxLength: 1000 })` |

### Unit Test Scenarios (example-based)

Fokus pada skenario konkret yang tidak tercakup PBT:

**StorageManager:**
- Mengembalikan default value saat key tidak ada
- Mengembalikan default value saat data korup (non-JSON)
- Mengembalikan `false` saat quota exceeded

**Validator:**
- Input tepat 1 karakter diterima
- Input tepat 200 karakter untuk task diterima
- Input 201 karakter ditolak
- URL tanpa protokol ditolak; `http://` dan `https://` diterima

**TimerModule:**
- Timer berhenti otomatis saat mencapai 00:00
- Tombol Start disabled saat running
- Tombol Reset disabled saat running
- Reset mengembalikan ke 1500 detik (25:00)

**ThemeModule:**
- `initNoFlash()` menerapkan dark class sebelum DOMContentLoaded
- Toggle dari light → dark menambah class `dark-mode` ke body
- Toggle dari dark → light menghapus class `dark-mode` dari body

**GreetingModule:**
- Menampilkan username dari storage saat init
- Menampilkan salam default tanpa nama jika username kosong
- Error saat input nama kosong atau hanya spasi

**Integration Tests:**
- Seluruh data task persisten setelah page reload (simulasi dengan re-init StorageManager)
- Quick links muncul kembali setelah reload
- Theme diterapkan sebelum body render (tidak ada FOUC)

### Test File Structure (di luar 3 file produksi)

```
test/
  unit/
    storageManager.test.js
    validator.test.js
    timerModule.test.js
    themeModule.test.js
    greetingModule.test.js
  property/
    taskUniqueness.prop.test.js
    storagePersistence.prop.test.js
    timerCountdown.prop.test.js
    greetingTimeOfDay.prop.test.js
  integration/
    persistence.integration.test.js
```

> **Catatan**: File test tidak termasuk dalam 3 file produksi (`index.html`, `css/style.css`, `js/script.js`). Test dijalankan di environment Node.js/Jest/Vitest terpisah. Modul JS produksi perlu ditulis dengan pola yang memungkinkan import (IIFE atau ES module dengan conditional export).

### CSS Architecture Note

Gunakan **CSS Custom Properties** untuk theming:

```css
/* css/style.css */
:root {
  --color-bg: #ffffff;
  --color-surface: #f5f5f5;
  --color-text: #1a1a1a;
  --color-accent: #4a90e2;
  /* ... */
}

body.dark-mode {
  --color-bg: #1a1a2e;
  --color-surface: #16213e;
  --color-text: #e0e0e0;
  /* ... */
}
```

Semua komponen menggunakan `var(--color-*)` sehingga toggle dark mode cukup dengan menambah/hapus class `dark-mode` pada `<body>`.

### Flash Prevention (Theme)

Script inline di `<head>` (sebelum `<link>` CSS) menerapkan class `dark-mode` sebelum browser merender body:

```html
<head>
  <script>
    // Inline — tidak boleh bergantung pada fungsi eksternal
    (function() {
      try {
        var theme = localStorage.getItem('theme');
        if (theme === 'dark') {
          document.documentElement.classList.add('dark-mode');
        }
      } catch(e) {}
    })();
  </script>
  <link rel="stylesheet" href="css/style.css">
</head>
```

> Class diterapkan ke `<html>` (bukan `<body>`) di inline script karena `<body>` belum ada saat `<head>` diproses. CSS perlu mengakomodasi `html.dark-mode` atau `body.dark-mode` — atau gunakan `documentElement` dan sesuaikan selector CSS.
