# Implementation Plan: To-Do List Life Dashboard

## Overview

Implementasi dilakukan secara bertahap dengan urutan: fondasi (StorageManager + Validator) → infrastruktur UI (HTML, CSS, NotificationModule, ThemeModule) → fitur per widget (Greeting, Timer, Todo, QuickLinks) → wiring App.init() → testing. Setiap tahap dapat divalidasi sebelum melanjutkan ke tahap berikutnya. Seluruh kode ditulis dalam 3 file produksi: `index.html`, `css/style.css`, dan `js/script.js`.

---

## Tasks

- [x] 1. StorageManager — Implementasi modul penyimpanan localStorage
  - [x] 1.1 Implementasi `StorageManager` dengan method `get`, `set`, `remove`
    - Tulis objek `StorageManager` di `js/script.js` dengan konstanta `KEYS` (`tasks`, `username`, `theme`, `quickLinks`)
    - Implementasi `get(key)`: baca dari `localStorage`, parse JSON, return `null` jika key tidak ada atau parse gagal (wrap try-catch)
    - Implementasi `set(key, value)`: stringify ke JSON, tulis ke `localStorage`, return `true` jika berhasil, catch `QuotaExceededError` dan return `false`
    - Implementasi `remove(key)`: hapus key dari `localStorage`
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.6_

  - [x] 1.2 Implementasi typed getters di `StorageManager`
    - Implementasi `getTasks()`: panggil `get(KEYS.TASKS)`, validasi array via `_validateTasks()`, return `[]` sebagai default
    - Implementasi `getUsername()`: panggil `get(KEYS.USERNAME)`, return `''` jika null atau bukan string
    - Implementasi `getTheme()`: panggil `get(KEYS.THEME)`, validasi via `_validateTheme()`, return `'light'` sebagai default
    - Implementasi `getQuickLinks()`: panggil `get(KEYS.QUICK_LINKS)`, validasi via `_validateQuickLinks()`, return `[]` sebagai default
    - Implementasi `_validateTasks(data)`: return `data` jika array valid, else `[]`
    - Implementasi `_validateTheme(data)`: return `data` jika `'light'` atau `'dark'`, else `'light'`
    - Implementasi `_validateQuickLinks(data)`: return `data` jika array valid, else `[]`
    - _Requirements: 9.5, 9.7_

  - [ ]* 1.3 Tulis property test untuk StorageManager (Property 11: Storage Default Values on Missing Keys)
    - **Property 11: Storage Default Values on Missing Keys**
    - Gunakan `fast-check`: `fc.constantFrom(null, undefined, 42, 'bad', {})` untuk setiap key — verifikasi getter mengembalikan default yang benar
    - Annotasi: `// Feature: todo-life-dashboard, Property 11: Storage Default Values on Missing Keys`
    - Buat file `test/property/storagePersistence.prop.test.js`
    - **Validates: Requirements 9.5, 9.7**

  - [ ]* 1.4 Tulis unit tests untuk StorageManager
    - Test: mengembalikan default saat key tidak ada
    - Test: mengembalikan default saat data korup (non-JSON string)
    - Test: `set()` mengembalikan `false` saat quota exceeded (mock `localStorage.setItem` throw)
    - Test: `getTheme()` mengembalikan `'light'` untuk nilai selain `'light'`/`'dark'`
    - Buat file `test/unit/storageManager.test.js`
    - _Requirements: 9.5, 9.6, 9.7_

- [x] 2. Validator — Implementasi modul validasi input
  - [x] 2.1 Implementasi `Validator` dengan semua method validasi
    - Implementasi `normalizeText(text)`: `text.trim().toLowerCase()`
    - Implementasi `isDuplicate(newText, existingTasks)`: scan linear dengan `normalizeText`, return boolean
    - Implementasi `validateTaskText(text, existingTasks)`: cek empty/whitespace-only → cek panjang maks 200 → cek duplikat → return `{ valid: true }` atau `{ valid: false, error: string }`
    - Implementasi `validateUsername(name)`: cek empty/whitespace-only → cek panjang maks 50 → return `ValidationResult`
    - Implementasi `validateQuickLinkLabel(label)`: cek empty/whitespace-only → cek panjang maks 50 → return `ValidationResult`
    - Implementasi `validateQuickLinkUrl(url)`: cek dimulai dengan `http://` atau `https://` → return `ValidationResult`
    - _Requirements: 5.1, 5.3, 6.1, 6.2, 6.4, 7.8, 7.9, 3.1, 3.6, 3.7_

  - [ ]* 2.2 Tulis property test untuk Validator (Property 1: Task Uniqueness Invariant)
    - **Property 1: Task Uniqueness Invariant**
    - Gunakan `fc.array(taskArb)` + mutasi case/trim dari task yang ada — verifikasi `validateTaskText` return `{ valid: false }` untuk semua varian duplikat
    - Annotasi: `// Feature: todo-life-dashboard, Property 1: Task Uniqueness Invariant`
    - Buat file `test/property/taskUniqueness.prop.test.js`
    - **Validates: Requirements 6.1, 6.2, 6.3**

  - [ ]* 2.3 Tulis property test untuk Validator (Property 2: Whitespace and Empty Task Rejection)
    - **Property 2: Whitespace and Empty Task Rejection**
    - Gunakan `fc.stringOf(fc.constantFrom(' ', '\t', '\n'))` dan empty string — verifikasi `validateTaskText` selalu return `{ valid: false }`
    - Annotasi: `// Feature: todo-life-dashboard, Property 2: Whitespace and Empty Task Rejection`
    - Tambahkan ke file `test/property/taskUniqueness.prop.test.js`
    - **Validates: Requirements 5.3, 6.4**

  - [ ]* 2.4 Tulis property test untuk Validator (Property 12: URL Validation Correctness)
    - **Property 12: URL Validation Correctness**
    - Gunakan `fc.string()` filter tidak dimulai `http` — verifikasi `validateQuickLinkUrl` return `{ valid: false }`; sebaliknya untuk valid URL
    - Annotasi: `// Feature: todo-life-dashboard, Property 12: URL Validation Correctness`
    - Buat file `test/property/urlValidation.prop.test.js`
    - **Validates: Requirements 7.9**

  - [ ]* 2.5 Tulis property test untuk Validator (Property 13: Duplicate Detection Performance)
    - **Property 13: Duplicate Detection Performance**
    - Gunakan `fc.array(taskArb, { maxLength: 1000 })` — ukur runtime `isDuplicate`, verifikasi selesai < 500ms
    - Annotasi: `// Feature: todo-life-dashboard, Property 13: Duplicate Detection Performance`
    - Tambahkan ke file `test/property/taskUniqueness.prop.test.js`
    - **Validates: Requirements 6.7**

  - [ ]* 2.6 Tulis unit tests untuk Validator
    - Test: input tepat 1 karakter diterima
    - Test: input tepat 200 karakter untuk task diterima; 201 karakter ditolak
    - Test: URL tanpa protokol ditolak; `http://` dan `https://` diterima
    - Test: duplikat case-insensitive terdeteksi; duplikat setelah trim terdeteksi
    - Buat file `test/unit/validator.test.js`
    - _Requirements: 5.1, 6.1, 6.2, 7.9_

- [x] 3. Checkpoint — Validasi fondasi StorageManager dan Validator
  - Pastikan semua unit tests dan property tests untuk StorageManager dan Validator lulus
  - Tanyakan kepada user jika ada pertanyaan sebelum melanjutkan ke fase UI

- [x] 4. HTML Structure — Buat kerangka `index.html`
  - [x] 4.1 Buat file `index.html` dengan struktur dasar dan inline theme script
    - Buat `index.html` dengan `<!DOCTYPE html>`, meta charset, meta viewport, title "Life Dashboard"
    - Tambahkan inline script di `<head>` (sebelum `<link>` CSS) untuk no-flash theme: baca `localStorage.getItem('theme')`, jika `'dark'` tambahkan class `dark-mode` ke `document.documentElement`
    - Tambahkan `<link rel="stylesheet" href="css/style.css">` di head
    - _Requirements: 1.1, 1.2, 8.6_

  - [x] 4.2 Tambahkan markup untuk Greeting Section di `index.html`
    - Tambahkan `<section id="greeting-section">` dengan elemen: `#clock`, `#date`, `#greeting-text`, `#name-form` (input `#username-input` maxlength="50" + tombol `#save-name-btn`), tombol `#edit-name-btn`, `#greeting-error`
    - _Requirements: 2.1, 2.2, 3.1, 3.5, 3.6_

  - [x] 4.3 Tambahkan markup untuk Focus Timer di `index.html`
    - Tambahkan `<section id="timer-section">` dengan elemen: `#timer-display` (teks awal "25:00"), `#timer-status`, tombol `#timer-start`, `#timer-stop`, `#timer-reset`
    - _Requirements: 4.1, 4.3, 10.4_

  - [x] 4.4 Tambahkan markup untuk To-Do List di `index.html`
    - Tambahkan `<section id="todo-section">` dengan elemen: input `#task-input` maxlength="200", tombol `#add-task-btn`, `#task-error`, `<ul id="task-list">`
    - _Requirements: 5.1, 5.5, 5.9, 5.13_

  - [x] 4.5 Tambahkan markup untuk Quick Links di `index.html`
    - Tambahkan `<section id="quicklinks-section">` dengan elemen: input `#link-label-input` maxlength="50", input `#link-url-input`, tombol `#add-link-btn`, `#link-error`, `<div id="links-container">`
    - _Requirements: 7.1, 7.5_

  - [x] 4.6 Tambahkan theme toggle button dan notification container di `index.html`
    - Tambahkan `<button id="theme-toggle">` di header/nav dengan label/ikon yang menunjukkan mode aktif
    - Tambahkan `<div id="notification-container">` untuk toast messages
    - Tambahkan `<script src="js/script.js">` sebelum `</body>`
    - _Requirements: 8.1, 1.1_

- [x] 5. CSS — Implementasi stylesheet dengan light/dark mode
  - [x] 5.1 Buat file `css/style.css` dengan CSS custom properties untuk theming
    - Buat `:root` dengan custom properties: `--color-bg`, `--color-surface`, `--color-text`, `--color-accent`, `--color-border`, `--color-text-muted`, `--color-error`, `--color-success`
    - Tambahkan `body.dark-mode` (dan `html.dark-mode body`) dengan nilai warna gelap yang menggantikan semua custom property
    - Tambahkan `html.dark-mode` selector untuk mendukung inline script yang menerapkan class ke `documentElement`
    - _Requirements: 8.3, 8.4, 1.3_

  - [x] 5.2 Implementasi layout responsif dan global styles
    - Reset/base styles, font, box-sizing
    - Layout dashboard: CSS Grid atau Flexbox untuk menampilkan semua widget, responsif dari 320px hingga 1920px
    - Semua elemen interaktif memiliki `min-height: 44px; min-width: 44px` untuk target klik
    - _Requirements: 10.1, 10.3, 10.5, 1.1_

  - [x] 5.3 Implementasi styles per widget dan komponen interaktif
    - Style untuk `#greeting-section`, `#timer-section`, `#todo-section`, `#quicklinks-section`
    - Style task list item: completed state dengan `text-decoration: line-through` dan reduced opacity
    - Style tombol, input, checkbox menggunakan CSS custom properties (warna dari `var(--color-*)`)
    - Style toast notification: posisi fixed, transisi animasi masuk/keluar
    - Style theme toggle button dengan ikon/label yang berubah via CSS
    - _Requirements: 5.10, 5.11, 10.3, 10.5_

- [x] 6. NotificationModule dan ThemeModule
  - [x] 6.1 Implementasi `NotificationModule` di `js/script.js`
    - Implementasi `show(message, type, duration)`: buat elemen toast dengan class sesuai `type` (`success`/`error`/`warning`), append ke `#notification-container`, set timeout untuk auto-hide
    - Implementasi `hide()`: hapus elemen toast dari DOM
    - Implementasi `_createToastElement(message, type)`: return `HTMLElement` toast dengan class dan teks
    - Implementasi `init()`: pastikan `#notification-container` ada di DOM
    - _Requirements: 10.2, 10.6, 10.7, 10.8, 9.6_

  - [x] 6.2 Implementasi `ThemeModule` di `js/script.js`
    - Implementasi `initNoFlash()`: hanya untuk referensi — logika actual ada di inline script `<head>`
    - Implementasi `init()`: pasang event listener pada `#theme-toggle`, baca state awal dari DOM/storage, perbarui label tombol
    - Implementasi `toggle()`: panggil `_applyTheme(newTheme)`, simpan ke `StorageManager.set(KEYS.THEME, newTheme)`, jika `set()` return `false` panggil `NotificationModule.show(error)`
    - Implementasi `_applyTheme(theme)`: tambah/hapus class `dark-mode` pada `document.body` — sinkronkan juga dengan `document.documentElement`
    - Implementasi `getCurrent()`: return `'dark'` jika `document.body` memiliki class `dark-mode`, else `'light'`
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7_

  - [ ]* 6.3 Tulis property test untuk ThemeModule (Property 5: Theme Persistence Round-Trip)
    - **Property 5: Theme Persistence Round-Trip**
    - Gunakan `fc.constantFrom('light', 'dark')`: setelah `StorageManager.set('theme', t)`, `getTheme()` harus return `t`; toggle dua kali harus kembali ke state awal
    - Annotasi: `// Feature: todo-life-dashboard, Property 5: Theme Persistence Round-Trip`
    - Buat file `test/property/storagePersistence.prop.test.js` (gabung dengan P11)
    - **Validates: Requirements 8.2, 8.5, 8.6, 9.3**

  - [ ]* 6.4 Tulis unit tests untuk ThemeModule
    - Test: `initNoFlash()` / inline script menerapkan class `dark-mode` ke `documentElement` sebelum DOMContentLoaded
    - Test: toggle dari `light` → `dark` menambahkan class `dark-mode` ke body
    - Test: toggle dari `dark` → `light` menghapus class `dark-mode` dari body
    - Buat file `test/unit/themeModule.test.js`
    - _Requirements: 8.2, 8.6, 8.7_

- [x] 7. GreetingModule — Implementasi widget greeting
  - [x] 7.1 Implementasi logika jam, tanggal, dan salam di `GreetingModule`
    - Implementasi `_getGreeting(hour)`: return `'Good Morning'` (0–11), `'Good Afternoon'` (12–17), `'Good Evening'` (18–23)
    - Implementasi `_formatTime(date)`: return `'HH:MM'` dengan padding dua digit
    - Implementasi `_formatDate(date)`: return format `'Thursday, 8 October 2026'` menggunakan locale atau manual
    - Implementasi `_tick()`: buat `new Date()` dalam try-catch, update DOM `#clock` dan `#date`, jika gagal tampilkan `"Waktu tidak tersedia"` tanpa throw ke console
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.7, 2.8_

  - [x] 7.2 Implementasi `init()` dan interval clock di `GreetingModule`
    - Implementasi `init()`: panggil `_tick()` segera (requirement 2.7), lalu `setInterval(_tick, 1000)` simpan ke `_intervalId`, panggil `_renderNameInput()` dan `_renderGreeting()`
    - Implementasi `_renderGreeting()`: update `#greeting-text` dengan format `"[Salam], [Nama]!"` atau `"[Salam]!"` jika nama kosong
    - Pasang event listener pada `#save-name-btn` → `saveName()`, pada `#edit-name-btn` → tampilkan kembali `#name-form`
    - _Requirements: 2.6, 2.7, 3.4, 3.5_

  - [x] 7.3 Implementasi `saveName()` dan validasi custom name di `GreetingModule`
    - Implementasi `saveName(name)`: panggil `Validator.validateUsername(name)` → jika invalid tampilkan error di `#greeting-error` via `NotificationModule` → jika valid: `StorageManager.set(KEYS.USERNAME, name.trim())`, panggil `_renderGreeting()`, sembunyikan `#name-form`, tampilkan konfirmasi success
    - Implementasi `_renderNameInput()`: isi `#username-input` dengan nilai username dari storage
    - Tangani kasus IF `StorageManager.set()` return `false`: tampilkan error storage
    - _Requirements: 3.1, 3.2, 3.3, 3.6, 3.7, 3.8, 10.7_

  - [ ]* 7.4 Tulis property test untuk GreetingModule (Property 8: Greeting Time-of-Day Exhaustiveness)
    - **Property 8: Greeting Time-of-Day Exhaustiveness and Correctness**
    - Gunakan `fc.integer({ min: 0, max: 23 })`: verifikasi `_getGreeting(h)` return tepat satu dari tiga nilai, range mutually exclusive dan exhaustive
    - Annotasi: `// Feature: todo-life-dashboard, Property 8: Greeting Time-of-Day Exhaustiveness`
    - Buat file `test/property/greetingTimeOfDay.prop.test.js`
    - **Validates: Requirements 2.3, 2.4, 2.5**

  - [ ]* 7.5 Tulis property test untuk GreetingModule (Property 6: Username Persistence Round-Trip)
    - **Property 6: Username Persistence Round-Trip**
    - Gunakan `fc.string({ minLength: 1, maxLength: 50 })` filter non-whitespace-only: setelah `saveName(s)`, `StorageManager.getUsername()` harus return `s.trim()`
    - Annotasi: `// Feature: todo-life-dashboard, Property 6: Username Persistence Round-Trip`
    - Tambahkan ke file `test/property/storagePersistence.prop.test.js`
    - **Validates: Requirements 3.3, 3.4, 9.2**

  - [ ]* 7.6 Tulis unit tests untuk GreetingModule
    - Test: menampilkan username dari storage saat `init()`
    - Test: menampilkan salam default tanpa nama jika username kosong
    - Test: error ditampilkan saat input nama kosong atau hanya spasi
    - Test: `_tick()` menampilkan `"Waktu tidak tersedia"` tanpa throw jika `new Date()` gagal
    - Buat file `test/unit/greetingModule.test.js`
    - _Requirements: 2.8, 3.4, 3.8_

- [x] 8. Checkpoint — Validasi UI dasar dan Greeting
  - Pastikan `index.html` merender tanpa error di console
  - Pastikan light/dark mode berfungsi dan tidak ada flash
  - Pastikan greeting section menampilkan waktu, tanggal, salam, dan nama dengan benar
  - Tanyakan kepada user jika ada pertanyaan sebelum melanjutkan

- [x] 9. TimerModule — Implementasi Focus Timer
  - [x] 9.1 Implementasi state machine dan logika countdown `TimerModule`
    - Definisikan `DURATION = 25 * 60`, `_state = 'idle'`, `_remaining = 25 * 60`, `_intervalId = null`
    - Implementasi `_tick()`: decrement `_remaining` sebesar 1, panggil `_renderDisplay()`, jika `_remaining <= 0` panggil `_onComplete()`
    - Implementasi `_onComplete()`: clear interval, set `_state = 'idle'`, `_remaining = 0`, panggil `_renderDisplay()`, `_renderButtons()`, `_playSound()`, dan tampilkan notifikasi visual via `NotificationModule`
    - Implementasi `_formatTime(secs)`: return `'MM:SS'` dengan padding dua digit
    - _Requirements: 4.1, 4.6, 4.7_

  - [x] 9.2 Implementasi kontrol Start, Stop, Reset dan render di `TimerModule`
    - Implementasi `start()`: hanya jika `_state !== 'running'` → set `_state = 'running'` → `setInterval(_tick, 1000)` → `_renderButtons()`
    - Implementasi `stop()`: hanya jika `_state === 'running'` → clear interval → set `_state = 'stopped'` → `_renderButtons()`
    - Implementasi `reset()`: hanya jika `_state !== 'running'` → clear interval → set `_state = 'idle'`, `_remaining = DURATION` → `_renderDisplay()`, `_renderButtons()`
    - Implementasi `_renderDisplay()`: update `#timer-display` dengan `_formatTime(_remaining)`, update `#timer-status` label
    - Implementasi `_renderButtons()`: enable/disable `#timer-start`, `#timer-stop`, `#timer-reset` sesuai state machine
    - Implementasi `init()`: pasang event listeners pada ketiga tombol, panggil `_renderDisplay()`, `_renderButtons()`
    - _Requirements: 4.2, 4.3, 4.4, 4.5, 4.8, 4.9, 10.4_

  - [x] 9.3 Implementasi audio alert di `TimerModule`
    - Implementasi `_playSound()`: buat `AudioContext`, buat `OscillatorNode`, play selama minimal 1 detik
    - Wrap seluruhnya dalam try-catch — jika `AudioContext` tidak tersedia, fallback tanpa error
    - _Requirements: 4.6_

  - [ ]* 9.4 Tulis property test untuk TimerModule (Property 9: Timer Countdown Monotonicity)
    - **Property 9: Timer Countdown Monotonicity and Non-Negative Bound**
    - Gunakan `fc.integer({ min: 1, max: 1500 })` untuk `t` dan `n` (n ≤ t): verifikasi `_remaining === t - n` setelah n tick, `_remaining >= 0`, dan `_state === 'idle'` saat `_remaining === 0`
    - Annotasi: `// Feature: todo-life-dashboard, Property 9: Timer Countdown Monotonicity`
    - Buat file `test/property/timerCountdown.prop.test.js`
    - **Validates: Requirements 4.2, 4.6, 4.7**

  - [ ]* 9.5 Tulis unit tests untuk TimerModule
    - Test: timer berhenti otomatis saat mencapai 00:00 dan `_onComplete()` dipanggil
    - Test: tombol Start disabled saat `_state === 'running'`
    - Test: tombol Reset disabled saat `_state === 'running'`
    - Test: `reset()` mengembalikan `_remaining` ke 1500 detik (25:00) dan `_state` ke `'idle'`
    - Test: `stop()` mengaktifkan kembali tombol Start dan Reset
    - Buat file `test/unit/timerModule.test.js`
    - _Requirements: 4.1, 4.3, 4.5, 4.9_

- [x] 10. TodoModule — Implementasi CRUD To-Do List
  - [x] 10.1 Implementasi inisialisasi dan render To-Do List di `TodoModule`
    - Definisikan `_tasks = []`
    - Implementasi `init()`: muat tasks dari `StorageManager.getTasks()` ke `_tasks`, panggil `_renderList()`
    - Implementasi `_generateId()`: return `Date.now() + '_' + Math.random().toString(36).slice(2, 6)`
    - Implementasi `_renderList()`: clear `#task-list`, render setiap task via `_renderTask()`, append ke DOM
    - Implementasi `_renderTask(task)`: buat `<li>` dengan checkbox, teks task, tombol Edit, tombol Delete; terapkan style completed (strikethrough, reduced opacity) jika `task.completed`
    - Pasang event listener pada `#add-task-btn`
    - _Requirements: 5.9, 5.10, 5.11, 5.16, 5.17_

  - [x] 10.2 Implementasi `addTask()` dengan validasi duplikat di `TodoModule`
    - Implementasi `addTask(text)`: panggil `Validator.validateTaskText(text, _tasks)` → jika invalid tampilkan error di `#task-error` dan pertahankan teks input (Req 6.6) → jika valid: buat Task object baru, push ke `_tasks`, `_saveToStorage()`, `_renderList()`, kosongkan input, tampilkan konfirmasi success via `NotificationModule`
    - Implementasi `_saveToStorage()`: `StorageManager.set(KEYS.TASKS, _tasks)` → jika return `false` panggil `NotificationModule.show(error)`
    - Pasang event listener pada input `#task-input` (event `input`) untuk menyembunyikan error saat pengguna mengubah isi input (Req 6.5)
    - _Requirements: 5.2, 5.3, 5.4, 6.1, 6.2, 6.3, 6.5, 6.6, 10.2, 10.6_

  - [x] 10.3 Implementasi `toggleComplete()` dan `deleteTask()` di `TodoModule`
    - Implementasi `toggleComplete(id)`: temukan task by id, flip `completed`, `_saveToStorage()`, `_renderList()`
    - Implementasi `deleteTask(id)`: filter `_tasks` menghapus task dengan `id`, `_saveToStorage()`, `_renderList()`
    - Pasang event listener delete dan toggle pada setiap task element (via event delegation di `#task-list`)
    - _Requirements: 5.9, 5.10, 5.11, 5.12, 5.13, 5.14, 5.15_

  - [x] 10.4 Implementasi `editTask()` dengan inline edit mode di `TodoModule`
    - Implementasi `_activateEditMode(id)`: ganti tampilan teks task dengan `<input>` berisi teks saat ini + tombol "Save"
    - Implementasi `_deactivateEditMode(id)`: kembalikan tampilan ke teks normal
    - Implementasi `editTask(id, newText)`: panggil `Validator.validateTaskText(newText, _tasks.filter(t => t.id !== id))` → jika valid: update `task.text`, `_saveToStorage()`, `_renderList()` (deactivate edit mode)
    - Pasang event listener edit pada setiap task element
    - _Requirements: 5.5, 5.6, 5.7, 5.8_

  - [ ]* 10.5 Tulis property test untuk TodoModule (Property 3: Task Addition Round-Trip)
    - **Property 3: Task Addition Round-Trip**
    - Gunakan `fc.string({ minLength: 1, maxLength: 200 })` (non-duplicate, non-whitespace): setelah `addTask(text)`, `StorageManager.getTasks()` return array panjang +1 berisi task dengan `text === input.trim()`
    - Annotasi: `// Feature: todo-life-dashboard, Property 3: Task Addition Round-Trip`
    - Buat file `test/property/taskCrud.prop.test.js`
    - **Validates: Requirements 5.2, 5.4, 9.1**

  - [ ]* 10.6 Tulis property test untuk TodoModule (Property 4: Task Deletion Consistency)
    - **Property 4: Task Deletion Consistency**
    - Gunakan `fc.array(taskArb, { minLength: 1 })`, pilih random id dari list: setelah `deleteTask(id)`, `StorageManager.getTasks()` return array panjang n-1 tanpa task dengan id tersebut
    - Annotasi: `// Feature: todo-life-dashboard, Property 4: Task Deletion Consistency`
    - Tambahkan ke file `test/property/taskCrud.prop.test.js`
    - **Validates: Requirements 5.14, 5.15**

  - [ ]* 10.7 Tulis property test untuk TodoModule (Property 7: Storage Read-After-Write Consistency)
    - **Property 7: Storage Read-After-Write Consistency**
    - Gunakan `fc.commands([addCmd, deleteCmd, toggleCmd, editCmd])`: setelah setiap operasi, `TodoModule._tasks` harus deeply equal ke `StorageManager.getTasks()`
    - Annotasi: `// Feature: todo-life-dashboard, Property 7: Storage Read-After-Write Consistency`
    - Tambahkan ke file `test/property/storagePersistence.prop.test.js`
    - **Validates: Requirements 5.4, 5.8, 5.12, 5.15, 9.1**

- [x] 11. QuickLinksModule — Implementasi bookmark widget
  - [x] 11.1 Implementasi inisialisasi, render, dan `addLink()` di `QuickLinksModule`
    - Definisikan `_links = []`
    - Implementasi `init()`: muat links dari `StorageManager.getQuickLinks()`, panggil `_renderLinks()`
    - Implementasi `_generateId()`: sama seperti TodoModule
    - Implementasi `addLink(label, url)`: validasi label via `Validator.validateQuickLinkLabel()` dan url via `Validator.validateQuickLinkUrl()` → jika invalid tampilkan error di `#link-error` → jika valid: buat QuickLink object, push ke `_links`, `_saveToStorage()`, `_renderLinks()`, kosongkan form, tampilkan konfirmasi
    - Pasang event listener pada `#add-link-btn`
    - _Requirements: 7.1, 7.2, 7.4, 7.7, 7.8, 7.9, 10.2, 10.8_

  - [x] 11.2 Implementasi `deleteLink()` dan render di `QuickLinksModule`
    - Implementasi `_saveToStorage()`: `StorageManager.set(KEYS.QUICK_LINKS, _links)` → tangani error
    - Implementasi `deleteLink(id)`: filter `_links`, `_saveToStorage()`, `_renderLinks()`
    - Implementasi `_renderLinks()`: clear `#links-container`, render setiap link via `_renderLink()`
    - Implementasi `_renderLink(link)`: buat elemen link/card dengan label, `href` = url, `target="_blank"`, tombol Delete
    - Pasang event listener delete via event delegation
    - _Requirements: 7.3, 7.5, 7.6, 7.7_

  - [ ]* 11.3 Tulis property test untuk QuickLinksModule (Property 10: Quick Links Storage Round-Trip)
    - **Property 10: Quick Links Storage Round-Trip**
    - Gunakan `fc.string({ minLength: 1 })` untuk label dan `fc.webUrl()` untuk URL: setelah `addLink(label, url)`, `StorageManager.getQuickLinks()` return array panjang +1 berisi link dengan `label === label.trim()` dan `url === url`
    - Annotasi: `// Feature: todo-life-dashboard, Property 10: Quick Links Storage Round-Trip`
    - Buat file `test/property/quickLinksRoundTrip.prop.test.js`
    - **Validates: Requirements 7.2, 7.4, 9.4**

- [x] 12. Checkpoint — Validasi semua widget
  - Pastikan semua widget (Greeting, Timer, Todo, QuickLinks) berfungsi di browser
  - Pastikan data persist setelah page refresh
  - Pastikan light/dark mode toggle berfungsi dengan benar tanpa flash
  - Tanyakan kepada user jika ada pertanyaan sebelum melanjutkan

- [x] 13. App.init() — Wiring semua modul
  - [x] 13.1 Implementasi `App` object dan bootstrap semua modul
    - Buat objek `App` di `js/script.js`
    - Implementasi `App.init()`: daftarkan `document.addEventListener('DOMContentLoaded', callback)`
    - Di dalam callback: panggil `ThemeModule.init()`, `GreetingModule.init()`, `TimerModule.init()`, `TodoModule.init()`, `QuickLinksModule.init()`, `NotificationModule.init()` secara berurutan
    - Panggil `App.init()` di akhir file `js/script.js`
    - Pastikan `ThemeModule.initNoFlash()` referensi hanya dari inline `<head>` script, tidak dipanggil di `DOMContentLoaded`
    - _Requirements: 1.4, 1.5_

- [ ] 14. Integration Tests — Persistensi dan end-to-end
  - [ ]* 14.1 Tulis integration tests untuk persistensi data
    - Test: seluruh data task (text, completed status) persisten setelah simulasi page reload (re-init `StorageManager` + `TodoModule.init()`)
    - Test: quick links muncul kembali setelah reload
    - Test: theme diterapkan sebelum body render — tidak ada FOUC (verifikasi class ada sebelum DOMContentLoaded fire)
    - Test: username tersimpan dan ditampilkan kembali setelah reload
    - Buat file `test/integration/persistence.integration.test.js`
    - _Requirements: 5.16, 7.7, 8.6, 3.4, 9.1, 9.2, 9.3, 9.4_

- [x] 15. Final Checkpoint — Semua tests lulus
  - Jalankan seluruh test suite (unit, property, integration) dan pastikan semua lulus
  - Buka `index.html` di Chrome, Firefox, dan Edge — verifikasi tidak ada error di console
  - Verifikasi render selesai dalam < 3 detik via `file://` protocol
  - Tanyakan kepada user jika ada pertanyaan sebelum menyatakan implementasi selesai

---

## Notes

- Task yang dipostfix `*` adalah opsional dan dapat diskip untuk implementasi MVP yang lebih cepat
- Setiap task merujuk ke requirements spesifik untuk traceability
- Checkpoint memastikan validasi inkremental sebelum melanjutkan ke fase berikutnya
- **13 Correctness Properties** dari design.md harus dicakup oleh property-based tests menggunakan `fast-check`
- File test **tidak** termasuk dalam 3 file produksi (`index.html`, `css/style.css`, `js/script.js`)
- Property tests dijalankan di environment Node.js/Vitest/Jest terpisah
- Modul JS di `script.js` ditulis dengan pola yang memungkinkan import untuk testing (IIFE dengan conditional export atau ES module)
- Urutan implementasi: fondasi (Storage, Validator) → UI (HTML, CSS) → modul (Notification, Theme, Greeting, Timer, Todo, QuickLinks) → wiring (App) → tests

---

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["2.1", "1.3", "1.4"] },
    { "id": 2, "tasks": ["2.2", "2.3", "2.4", "2.5", "2.6", "4.1"] },
    { "id": 3, "tasks": ["4.2", "4.3", "4.4", "4.5", "4.6"] },
    { "id": 4, "tasks": ["5.1", "5.2"] },
    { "id": 5, "tasks": ["5.3", "6.1", "6.2"] },
    { "id": 6, "tasks": ["6.3", "6.4", "7.1"] },
    { "id": 7, "tasks": ["7.2", "7.3"] },
    { "id": 8, "tasks": ["7.4", "7.5", "7.6", "9.1"] },
    { "id": 9, "tasks": ["9.2", "9.3"] },
    { "id": 10, "tasks": ["9.4", "9.5", "10.1"] },
    { "id": 11, "tasks": ["10.2", "10.3"] },
    { "id": 12, "tasks": ["10.4", "10.5", "10.6"] },
    { "id": 13, "tasks": ["10.7", "11.1"] },
    { "id": 14, "tasks": ["11.2", "11.3"] },
    { "id": 15, "tasks": ["13.1"] },
    { "id": 16, "tasks": ["14.1"] }
  ]
}
```
