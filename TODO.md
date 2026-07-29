# TODO: Division Progress with Checkboxes on Detail Project Page

## Task
Di public detail-proyek.html, tampilkan progress per divisi (Sipil, Arsitektur, MEP, Interior, Persiapan, SMKK3) dengan checkbox yang bisa dicentang/dicentang untuk menjumlahkan progress. Inputan progress akan ditampilkan per divisi dan terhitung otomatis.

## Steps

### Step 1: Update HTML (detail-proyek.html)
- [x] Ubah rendering progress tasks menjadi progress bars per divisi
- [x] Tambahkan tombol "Update Progress" (visible untuk role authorized)
- [x] Tambahkan container untuk modal update progress (SweetAlert2)

### Step 2: Update src/js/detail-proyek.js
- [x] Import tambahan: `updateProject`, `uploadImageFile`, `listenToProjectById`
- [x] Ganti rendering `#proj-tasks` dengan division progress bars (divSipil, divArs, divMep, divInt, divPersiapan, divSmkk3)
- [x] Tambahkan fungsi `updateProgressSystem(id)` - modal SweetAlert2 untuk update
- [x] Tambahkan fungsi `updateSwalTotal()` - kalkulasi jumlah progress dari divisi yang di-check
- [x] Tambahkan fungsi `onWeekChange(id)` - handler perubahan minggu
- [x] Tambahkan fungsi `enableEditProgress()` - enable/disable edit mode
- [x] Tambahkan fungsi photo upload & preview
- [x] Tambahkan auth check untuk menampilkan tombol update
- [x] Gunakan `listenToProjectById` untuk real-time update

### Step 3: Update detail-proyek.js (root)
- [x] Sinkronisasi perubahan yang sama dari src/js/detail-proyek.js

### Step 4: Testing
- [ ] Verifikasi progress bar per divisi muncul sesuai data project
- [ ] Verifikasi checkbox berfungsi menjumlahkan progress
- [ ] Verifikasi update tersimpan ke Firebase
- [ ] Verifikasi real-time update dari listener

---

# DONE: Theme Cashflow Page & Fix Cancel Button

## Task
Theme cashflow monitoring page to match the main dashboard dark/light mode styling and fix the "Batal" (Cancel) button in the transaction dialog.

## Changes

### 1. CSS (`cashflow/frontend/css/cashflow.css`)
- Added CSS custom properties for all themed elements
- Added `.dark-mode` class with complete dark palette
- All color references replaced with `var()` CSS variables

### 2. HTML (`cashflow/frontend/cashflow.html`)
- Added theme toggle button with moon/sun icon in topbar
- Added smooth transition styles for all themed elements

### 3. JavaScript (`cashflow/frontend/js/cashflow.js`)
- Added `initTheme()` function for dark/light mode toggle
- Theme preference persisted in localStorage
- Auto-detects system color scheme preference
- Added `cancelBtn` event listener to properly close dialog

## Status
- [x] Dark/light theme variables and `.dark-mode` class added to CSS
- [x] Theme toggle button in topbar
- [x] Theme persistence in localStorage
- [x] Cancel button properly closes dialog without saving

---

# DONE: Real-Time Listener for Dashboard Projects

## Task
Implement real-time listener pada `dashboard.js` menggunakan `listenToProjects()` dari `firebase-service.js` agar UI dashboard otomatis merespons perubahan data proyek di Firestore.

## Steps
- [x] Tambah variabel `unsubscribeProjects` untuk cleanup listener
- [x] Modifikasi `loadProjectsData()`: setelah initial fetch, pasang real-time listener via `listenToProjects()`
- [x] Dalam callback listener: filter proyek berdasarkan role, update `currentProjects`, render ulang cards, stats, charts, activity feed, dan detail proyek
- [x] Tambah event `beforeunload` untuk cleanup listener saat navigasi keluar
- [x] TODO.md ini diperbarui sebagai dokumentasi

