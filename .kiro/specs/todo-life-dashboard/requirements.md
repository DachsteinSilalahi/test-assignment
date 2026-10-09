# Requirements Document

## Introduction

To-Do List Life Dashboard adalah aplikasi web dashboard personal yang dibangun dengan Vanilla HTML, CSS, dan JavaScript murni tanpa framework atau backend server. Aplikasi ini menyediakan tampilan terpadu yang menggabungkan greeting personal, focus timer Pomodoro, manajemen to-do list, dan quick links ke website favorit. Seluruh data disimpan secara lokal menggunakan Browser Local Storage sehingga tersedia tanpa koneksi internet dan persisten antar sesi browser. Aplikasi mendukung light/dark mode, nama pengguna kustom pada greeting, serta validasi pencegahan duplikasi task.

## Glossary

- **Dashboard**: Halaman utama aplikasi (`index.html`) yang menampilkan semua widget sekaligus.
- **Widget**: Komponen UI mandiri pada dashboard (Greeting, Focus Timer, To-Do List, Quick Links).
- **Task**: Item pekerjaan yang ditambahkan pengguna ke dalam To-Do List.
- **Focus_Timer**: Widget countdown 25 menit dengan kontrol Start, Stop, dan Reset.
- **Quick_Link**: Entri berupa label dan URL yang membuka website favorit di tab baru.
- **Local_Storage**: Mekanisme penyimpanan data berbasis browser (`window.localStorage`).
- **Theme**: Skema warna tampilan, bernilai `light` atau `dark`.
- **Greeting_Section**: Area di bagian atas dashboard yang menampilkan waktu, tanggal, salam, dan nama pengguna.
- **Storage_Manager**: Modul JavaScript yang mengelola seluruh operasi baca/tulis ke Local Storage.
- **Validator**: Modul JavaScript yang memvalidasi input pengguna sebelum diproses.
- **UI_Controller**: Modul JavaScript yang mengelola manipulasi DOM dan feedback visual.
- **Modern_Browser**: Chrome, Firefox, Edge, dan Safari versi terkini yang mendukung ES6+ dan Local Storage API.

---

## Requirements

### Requirement 1: Struktur File dan Kompatibilitas Browser

**User Story:** Sebagai pengguna, saya ingin aplikasi dapat dijalankan langsung di browser modern tanpa instalasi tambahan, sehingga saya dapat mengaksesnya dengan mudah.

#### Acceptance Criteria

1. THE Dashboard SHALL terdiri dari tepat satu file `index.html`, satu file `css/style.css`, dan satu file `js/script.js`.
2. THE Dashboard SHALL dapat dijalankan sepenuhnya di Modern_Browser tanpa memerlukan web server, backend, atau proses build.
3. THE Dashboard SHALL tidak menggunakan library JavaScript eksternal, CSS framework, atau dependensi pihak ketiga, baik melalui URL eksternal maupun file tambahan yang di-bundle di luar 3 file yang ditetapkan.
4. WHEN pengguna membuka `index.html` di Modern_Browser, THE Dashboard SHALL merender seluruh widget tanpa error atau warning di console.
5. WHEN pengguna membuka `index.html` di Modern_Browser melalui protokol `file://`, THE Dashboard SHALL menyelesaikan render seluruh widget dalam waktu tidak lebih dari 3 detik.
6. THE Dashboard SHALL kompatibel dengan 2 versi mayor terkini dari Chrome, Firefox, dan Edge; IF browser tidak memenuhi syarat tersebut, THEN THE Dashboard SHALL tetap merender konten dasar tanpa crash.

---

### Requirement 2: Greeting — Tampilan Waktu dan Tanggal Real-Time

**User Story:** Sebagai pengguna, saya ingin melihat waktu dan tanggal saat ini pada dashboard, sehingga saya dapat mengetahui konteks waktu tanpa membuka aplikasi lain.

#### Acceptance Criteria

1. THE Greeting_Section SHALL menampilkan waktu saat ini dalam format jam dan menit (HH:MM) berdasarkan zona waktu lokal perangkat pengguna.
2. THE Greeting_Section SHALL menampilkan tanggal saat ini dalam format yang mencakup nama hari, tanggal, nama bulan, dan tahun — contoh: "Thursday, 8 October 2026" — berdasarkan zona waktu lokal perangkat pengguna.
3. WHEN jam lokal pengguna berada di antara 00:00 dan 11:59, THE Greeting_Section SHALL menampilkan salam "Good Morning".
4. WHEN jam lokal pengguna berada di antara 12:00 dan 17:59, THE Greeting_Section SHALL menampilkan salam "Good Afternoon".
5. WHEN jam lokal pengguna berada di antara 18:00 dan 23:59, THE Greeting_Section SHALL menampilkan salam "Good Evening".
6. WHEN waktu berjalan, THE Greeting_Section SHALL memperbarui tampilan jam setiap 1 detik secara otomatis tanpa memerlukan interaksi pengguna, dengan selisih maksimal 1 detik terhadap waktu sistem yang sebenarnya.
7. WHEN halaman Dashboard pertama kali dimuat, THE Greeting_Section SHALL langsung menampilkan waktu, tanggal, dan salam yang akurat sebelum interval 1 detik pertama berlalu.
8. IF zona waktu lokal perangkat tidak dapat dibaca, THEN THE Greeting_Section SHALL menampilkan pesan fallback yang menginformasikan bahwa waktu tidak tersedia tanpa menyebabkan error di console.

---

### Requirement 3: Greeting — Custom Name

**User Story:** Sebagai pengguna, saya ingin memasukkan nama saya agar greeting terasa personal, sehingga dashboard terasa seperti milik saya sendiri.

#### Acceptance Criteria

1. THE Greeting_Section SHALL menyediakan input teks dengan batas maksimum 50 karakter dan tombol "Save Name" untuk memasukkan nama pengguna.
2. WHEN pengguna mengisi input nama dengan minimal 1 karakter non-spasi dan menekan tombol "Save Name", THE Greeting_Section SHALL menampilkan salam dalam format "[Salam], [Nama]!" di mana [Salam] adalah "Good Morning" (00:00–11:59), "Good Afternoon" (12:00–17:59), atau "Good Evening" (18:00–23:59) sesuai waktu lokal perangkat.
3. WHEN pengguna menekan tombol "Save Name" dengan input nama yang valid, THE Storage_Manager SHALL menyimpan nama ke Local Storage dengan key `username` dalam waktu kurang dari 300ms.
4. WHEN pengguna membuka atau merefresh Dashboard, THE Greeting_Section SHALL memuat nilai dari Local Storage dengan key `username` dan menampilkan salam dalam format "[Salam], [Nama]!" tanpa interaksi tambahan dari pengguna.
5. WHEN pengguna menekan tombol ubah nama, THE Greeting_Section SHALL menampilkan kembali input teks yang terisi dengan nama yang saat ini tersimpan sehingga pengguna dapat mengeditnya.
6. IF pengguna menekan tombol "Save Name" dengan input kosong atau hanya berisi karakter spasi, THEN THE Greeting_Section SHALL menampilkan pesan error yang menginformasikan bahwa nama tidak boleh kosong dan tidak menyimpan nilai apapun ke Local Storage.
7. IF panjang input nama melebihi 50 karakter, THEN THE Greeting_Section SHALL menampilkan pesan error yang menginformasikan batas karakter dan tidak menyimpan nilai tersebut ke Local Storage.
8. IF Local Storage dengan key `username` tidak ditemukan atau bernilai kosong saat Dashboard dibuka, THEN THE Greeting_Section SHALL menampilkan salam default tanpa nama dalam format "[Salam]!" tanpa mencoba menyimpan nilai apapun.

---

### Requirement 4: Focus Timer

**User Story:** Sebagai pengguna, saya ingin menggunakan timer fokus 25 menit, sehingga saya dapat bekerja dengan teknik Pomodoro untuk meningkatkan produktivitas.

#### Acceptance Criteria

1. THE Focus_Timer SHALL menampilkan durasi awal 25:00 (25 menit, 0 detik) saat pertama kali dimuat atau setelah Reset.
2. WHEN pengguna menekan tombol Start, THE Focus_Timer SHALL mulai menghitung mundur dari waktu yang ditampilkan dengan interval tepat 1 detik.
3. WHILE Focus_Timer sedang berjalan, THE Focus_Timer SHALL menonaktifkan tombol Start dan tombol Reset agar tidak dapat ditekan.
4. WHEN pengguna menekan tombol Stop, THE Focus_Timer SHALL menghentikan hitungan mundur dan mempertahankan waktu saat itu hingga pengguna menekan Start atau Reset.
5. WHEN pengguna menekan tombol Reset, THE Focus_Timer SHALL menghentikan hitungan mundur dan mengembalikan tampilan ke 25:00 dalam waktu kurang dari 200 milidetik.
6. WHEN hitungan mundur Focus_Timer mencapai 00:00, THE Focus_Timer SHALL berhenti secara otomatis, memperbarui tampilan menjadi 00:00, dan menampilkan notifikasi visual pada layar serta notifikasi audio berupa 1 kali bunyi selama minimal 1 detik.
7. WHILE Focus_Timer sedang berjalan, THE Focus_Timer SHALL memperbarui tampilan setiap 1 detik dengan format MM:SS, di mana MM adalah menit dua digit (00–25) dan SS adalah detik dua digit (00–59).
8. IF Focus_Timer sedang berjalan dan tab browser atau jendela aplikasi kehilangan fokus, THEN THE Focus_Timer SHALL tetap melanjutkan hitungan mundur tanpa gangguan pada interval 1 detik.
9. WHEN pengguna menekan tombol Stop saat Focus_Timer sedang berjalan, THE Focus_Timer SHALL mengaktifkan kembali tombol Start dan tombol Reset agar dapat ditekan.

---

### Requirement 5: To-Do List — Operasi CRUD

**User Story:** Sebagai pengguna, saya ingin mengelola daftar tugas saya, sehingga saya dapat melacak pekerjaan yang perlu diselesaikan.

#### Acceptance Criteria

1. THE Dashboard SHALL menyediakan input teks dan tombol "Add Task" untuk menambahkan task baru, dengan input teks menerima maksimal 200 karakter.
2. WHEN pengguna mengisi input task dengan teks yang tidak kosong dan tidak hanya terdiri dari spasi, lalu menekan tombol "Add Task", THE Dashboard SHALL menambahkan task baru ke daftar dengan status belum selesai dan mengosongkan isi input teks.
3. IF pengguna menekan tombol "Add Task" dengan input teks kosong atau hanya terdiri dari spasi, THEN THE Dashboard SHALL menampilkan pesan error yang mengindikasikan bahwa teks task tidak boleh kosong dan tidak menambahkan task ke daftar.
4. WHEN task baru berhasil ditambahkan, THE Storage_Manager SHALL menyimpan seluruh daftar task ke Local Storage dengan key `tasks`.
5. THE Dashboard SHALL menampilkan setiap task dengan tombol atau mekanisme untuk mengaktifkan mode edit pada teks task tersebut.
6. WHEN pengguna mengaktifkan mode edit sebuah task, THE Dashboard SHALL menggantikan tampilan teks task dengan input teks yang berisi teks task saat ini dan tombol "Save".
7. WHEN pengguna menekan tombol "Save" pada task yang sedang diedit, THE Dashboard SHALL memperbarui teks task tersebut dengan teks baru yang telah dimasukkan dan menutup mode edit.
8. WHEN pengguna menekan tombol "Save" pada task yang sedang diedit, THE Storage_Manager SHALL menyimpan seluruh daftar task yang telah diperbarui ke Local Storage dengan key `tasks`.
9. THE Dashboard SHALL menampilkan setiap task dengan checkbox atau tombol toggle untuk mengubah status selesai task tersebut.
10. WHEN pengguna mengubah status sebuah task menjadi selesai, THE Dashboard SHALL menampilkan task tersebut dengan teks yang dicoret (strikethrough) dan opacity yang lebih rendah dari task yang belum selesai.
11. WHEN pengguna mengubah status sebuah task menjadi belum selesai, THE Dashboard SHALL menghapus tampilan teks dicoret dan mengembalikan opacity task tersebut ke nilai yang sama dengan task belum selesai lainnya.
12. WHEN pengguna mengubah status selesai sebuah task, THE Storage_Manager SHALL menyimpan seluruh daftar task yang telah diperbarui ke Local Storage dengan key `tasks`.
13. THE Dashboard SHALL menampilkan setiap task dengan tombol "Delete".
14. WHEN pengguna menekan tombol "Delete" pada sebuah task, THE Dashboard SHALL menghapus task tersebut dari daftar secara langsung tanpa konfirmasi tambahan.
15. WHEN pengguna menekan tombol "Delete" pada sebuah task, THE Storage_Manager SHALL memperbarui Local Storage dengan key `tasks` untuk mencerminkan daftar task setelah penghapusan.
16. WHEN pengguna merefresh atau membuka kembali Dashboard dan Local Storage dengan key `tasks` berisi data task yang valid, THE Dashboard SHALL memuat seluruh task dari Local Storage dan menampilkannya beserta status selesai masing-masing task.
17. IF Local Storage dengan key `tasks` kosong atau tidak ada saat Dashboard dimuat, THEN THE Dashboard SHALL menampilkan daftar task kosong tanpa pesan error.

---

### Requirement 6: To-Do List — Prevent Duplicate Tasks

**User Story:** Sebagai pengguna, saya ingin dicegah dari menambahkan task yang sudah ada, sehingga daftar saya tetap bersih dan tidak redundan.

#### Acceptance Criteria

1. WHEN pengguna menekan tombol "Add Task", THE Validator SHALL membandingkan input task baru (setelah trimming spasi di awal dan akhir, diubah ke lowercase) dengan teks setiap task yang ada di daftar (juga setelah trimming dan diubah ke lowercase).
2. IF task baru identik dengan task yang sudah ada setelah normalisasi, THEN THE Validator SHALL menolak penambahan task baru dan THE UI_Controller SHALL menampilkan pesan peringatan yang mengindikasikan bahwa task tersebut sudah ada dalam daftar.
3. IF task duplikat terdeteksi, THEN THE Dashboard SHALL tidak menghapus atau mengubah task yang sudah ada, dan jumlah task dalam daftar SHALL tetap sama seperti sebelum percobaan penambahan.
4. IF input task baru kosong atau hanya berisi spasi, THEN THE Validator SHALL menolak penambahan dan THE UI_Controller SHALL menampilkan pesan error yang mengindikasikan bahwa input tidak boleh kosong.
5. WHEN pesan peringatan duplikat ditampilkan, THE UI_Controller SHALL menyembunyikan pesan tersebut ketika pengguna berhasil menambahkan task yang valid atau ketika kolom input dikosongkan oleh pengguna.
6. IF task baru identik dengan task yang sudah ada setelah normalisasi, THEN THE UI_Controller SHALL mempertahankan teks input yang diketik pengguna di kolom input sehingga pengguna dapat mengubahnya tanpa harus mengetik ulang.
7. WHEN pengguna menekan tombol "Add Task" dan input task baru tidak duplikat dan tidak kosong, THE Validator SHALL menerima penambahan dalam waktu tidak lebih dari 500 milidetik sejak tombol ditekan, terlepas dari jumlah task yang sudah ada dalam daftar hingga maksimum 1.000 task.

---

### Requirement 7: Quick Links

**User Story:** Sebagai pengguna, saya ingin menyimpan tautan ke website favorit saya di dashboard, sehingga saya dapat mengaksesnya dengan cepat.

#### Acceptance Criteria

1. THE Dashboard SHALL menyediakan form dengan input label (maksimal 50 karakter) dan input URL serta tombol "Add Link" untuk menambahkan Quick_Link baru.
2. WHEN pengguna mengisi label dengan minimal 1 karakter non-spasi dan URL yang dimulai dengan `http://` atau `https://`, lalu menekan tombol "Add Link", THE Dashboard SHALL menampilkan Quick_Link baru sebagai tombol atau kartu yang dapat diklik.
3. WHEN pengguna mengklik sebuah Quick_Link, THE Dashboard SHALL membuka URL yang terkait di tab browser baru menggunakan atribut `target="_blank"`.
4. WHEN Quick_Link baru berhasil ditambahkan, THE Storage_Manager SHALL menyimpan seluruh daftar Quick_Link ke Local Storage dengan key `quickLinks`.
5. THE Dashboard SHALL menampilkan setiap Quick_Link dengan tombol "Delete" untuk menghapusnya.
6. WHEN pengguna menghapus sebuah Quick_Link, THE Storage_Manager SHALL memperbarui Local Storage dengan key `quickLinks` untuk mencerminkan daftar setelah penghapusan.
7. WHEN pengguna merefresh atau membuka kembali Dashboard, THE Dashboard SHALL memuat seluruh Quick_Link dari Local Storage dan menampilkannya.
8. IF pengguna menekan tombol "Add Link" dengan input label kosong atau hanya berisi spasi, THEN THE Validator SHALL menolak penambahan dan THE UI_Controller SHALL menampilkan pesan error yang menginformasikan bahwa label tidak boleh kosong.
9. IF pengguna menekan tombol "Add Link" dengan URL yang tidak dimulai dengan `http://` atau `https://`, THEN THE Validator SHALL menolak penambahan dan THE UI_Controller SHALL menampilkan pesan error yang menginformasikan format URL yang valid.

---

### Requirement 8: Light / Dark Mode

**User Story:** Sebagai pengguna, saya ingin dapat beralih antara tampilan terang dan gelap, sehingga saya dapat menyesuaikan kenyamanan visual sesuai kondisi pencahayaan.

#### Acceptance Criteria

1. THE Dashboard SHALL menyediakan satu tombol toggle yang dapat diklik untuk beralih antara Light Mode dan Dark Mode, dengan label atau ikon yang mencerminkan mode aktif saat ini.
2. WHEN pengguna menekan tombol toggle tema, THE UI_Controller SHALL menambahkan class `dark-mode` pada elemen `<body>` jika sebelumnya tidak ada, atau menghapus class `dark-mode` jika sebelumnya sudah ada, dalam waktu kurang dari 100ms sejak klik.
3. WHILE class `dark-mode` aktif pada `<body>`, THE Dashboard SHALL menerapkan skema warna gelap pada seluruh elemen antarmuka sehingga tidak ada elemen teks atau latar belakang yang menggunakan warna dari skema terang.
4. WHILE class `dark-mode` tidak aktif pada `<body>`, THE Dashboard SHALL menerapkan skema warna terang pada seluruh elemen antarmuka sehingga tidak ada elemen teks atau latar belakang yang menggunakan warna dari skema gelap.
5. WHEN pengguna mengubah tema, THE Storage_Manager SHALL menyimpan nilai `"dark"` atau `"light"` ke Local Storage dengan key `theme` sebelum perubahan tampilan diterapkan.
6. WHEN pengguna membuka atau merefresh Dashboard, THE UI_Controller SHALL membaca nilai key `theme` dari Local Storage dan menerapkan tema yang tersimpan sebelum render pertama elemen konten, sehingga tidak terjadi flash tampilan mode yang berbeda dari pilihan tersimpan.
7. IF nilai key `theme` di Local Storage tidak ditemukan atau bukan `"dark"` atau `"light"`, THEN THE UI_Controller SHALL menerapkan Light Mode sebagai default dan menyimpan nilai `"light"` ke Local Storage dengan key `theme`.

---

### Requirement 9: Persistensi Local Storage

**User Story:** Sebagai pengguna, saya ingin data saya tetap ada setelah saya menutup dan membuka kembali browser, sehingga saya tidak perlu memasukkan ulang informasi setiap kali.

#### Acceptance Criteria

1. THE Storage_Manager SHALL menyimpan tasks ke Local Storage menggunakan key `tasks` dalam format JSON yang merepresentasikan array of task objects, setiap kali terjadi perubahan pada data tasks.
2. THE Storage_Manager SHALL menyimpan nama pengguna ke Local Storage menggunakan key `username` dalam format string dengan panjang maksimum 100 karakter, setiap kali nilai username diperbarui.
3. THE Storage_Manager SHALL menyimpan pilihan tema ke Local Storage menggunakan key `theme` dalam format string dengan nilai yang hanya boleh berupa `light` atau `dark`, setiap kali pengguna mengubah pilihan tema.
4. THE Storage_Manager SHALL menyimpan quick links ke Local Storage menggunakan key `quickLinks` dalam format JSON yang merepresentasikan array of quick link objects, setiap kali terjadi perubahan pada data quick links.
5. WHEN Local Storage tidak memiliki data untuk key tertentu, THE Storage_Manager SHALL menggunakan nilai default: tasks berupa array kosong (`[]`), username berupa string kosong (`""`), theme berupa `light`, quickLinks berupa array kosong (`[]`).
6. IF operasi tulis ke Local Storage gagal, THEN THE UI_Controller SHALL menampilkan pesan error yang menjelaskan bahwa data tidak dapat disimpan dan perubahan tidak akan tersimpan setelah browser ditutup.
7. WHEN Storage_Manager membaca data dari Local Storage, THE Storage_Manager SHALL memvalidasi bahwa nilai yang dibaca sesuai dengan tipe data yang diharapkan untuk setiap key, dan apabila validasi gagal maka SHALL menggunakan nilai default yang sesuai.

---

### Requirement 10: UI/UX dan Feedback Pengguna

**User Story:** Sebagai pengguna, saya ingin antarmuka yang bersih, responsif, dan memberikan feedback yang jelas untuk setiap aksi, sehingga pengalaman menggunakan dashboard terasa nyaman dan intuitif.

#### Acceptance Criteria

1. THE Dashboard SHALL menampilkan layout yang responsif dan dapat digunakan pada lebar layar mulai dari 320px hingga 1920px.
2. WHEN pengguna melakukan aksi (menambah task, menghapus task, menyimpan nama, menambah link, dsb.), THE UI_Controller SHALL menampilkan feedback visual yang dapat diamati pengguna — seperti notifikasi teks, perubahan warna, atau animasi — dalam waktu kurang dari 200ms.
3. THE Dashboard SHALL menggunakan warna, tipografi, dan spacing yang konsisten antar seluruh widget.
4. WHILE Focus_Timer sedang berjalan, THE Dashboard SHALL menampilkan indikator status yang membedakan tampilan timer dari kondisi berhenti — misalnya perubahan warna atau label status "Running" / "Stopped".
5. THE Dashboard SHALL memastikan seluruh elemen interaktif (tombol, input, checkbox) memiliki ukuran target klik minimal 44x44 piksel.
6. WHEN pengguna berhasil menambahkan task, THE UI_Controller SHALL menampilkan pesan konfirmasi yang terlihat selama minimal 2 detik kemudian menghilang secara otomatis.
7. WHEN pengguna berhasil menyimpan nama, THE UI_Controller SHALL memperbarui teks greeting secara langsung dan menampilkan konfirmasi visual yang terlihat selama minimal 2 detik.
8. WHEN pengguna berhasil menambahkan Quick_Link, THE UI_Controller SHALL menampilkan Quick_Link baru di daftar secara langsung dan menampilkan konfirmasi visual yang terlihat selama minimal 2 detik.
