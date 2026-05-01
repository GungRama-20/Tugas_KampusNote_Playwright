# 🧪 KampusNote - Automated Testing with Playwright

Repository ini berisi script pengujian otomatis untuk aplikasi web **KampusNote** menggunakan Playwright (`@playwright/test`). Pengujian difokuskan pada validasi UI, fungsionalitas utama, serta skenario autentikasi.

---

## 👨‍💻 Informasi Pengembang

* **Nama**: Anak Agung Rama Dwi Saputra
* **NIM**: 2301010021
* **Program Studi**: Sistem Informasi

---

## ⚙️ Prasyarat

Pastikan environment sudah terpasang:

* Node.js **v22.16.0**
* npm **v10.9.2**

---

## 🛠️ Setup Project

### 1. Install Playwright

```bash
npm init playwright@latest
```

---

## 📂 Struktur Proyek

```bash
KampusNote/
├── tests/
│   ├── UI_Fungsional.spec.js      # Pengujian UI & fitur utama
│   ├── Authentication.spec.js     # Pengujian autentikasi
├── playwright.config.js           # Konfigurasi Playwright
├── package.json
├── package-lock.json
└── README.md
```

---

## ▶️ Menjalankan Pengujian

### 1. Menjalankan test per file

```bash
npx playwright test UI_Fungsional.spec.js
npx playwright test Authentication.spec.js
```

### 2. Menampilkan laporan hasil test

```bash
npx playwright show-report
```

---

## 📊 Pemetaan Test Case (Traceability Matrix)

| Test Case | Bug ID | File                    | Deskripsi                             |
| --------- | ------ | ----------------------- | ------------------------------------- |
| TC05      | -      | ui-functional.spec.js   | Login berhasil & membuat catatan      |
| TC11      | Bug 05 | ui-functional.spec.js   | Validasi share note tanpa email valid |
| TC13      | Bug 08 | ui-functional.spec.js   | Fitur public note tidak berfungsi     |
| TC01      | Bug 01 | auth-validation.spec.js | Validasi email tidak sesuai format    |
| TC02      | Bug 02 | auth-validation.spec.js | Username menggunakan emoji            |
| TC03      | -      | auth-validation.spec.js | Pengujian edge case saat registrasi   |

---

## 🔐 Kredensial Pengujian

| Email                                           | Password    | Role  |
| ----------------------------------------------- | ----------- | ----- |
| [alice@kampus.ac.id](mailto:alice@kampus.ac.id) | password123 | User  |
| [admin@kampus.ac.id](mailto:admin@kampus.ac.id) | password123 | Admin |

---

## 📌 Catatan

* Pengujian ini mencakup skenario positif dan negatif.
* Beberapa test case digunakan untuk mengidentifikasi bug yang ditemukan saat pengujian manual.
* Disarankan menjalankan test dalam kondisi koneksi stabil untuk hasil optimal.

---
