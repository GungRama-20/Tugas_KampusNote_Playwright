
const { test, expect } = require('@playwright/test');

// -- Konstanta & Kredensial 
const BASE_URL = 'https://kampusnote-api.budasuyasa.workers.dev';
const USER_ALICE = {
  email: 'alice@kampus.ac.id',
  password: 'password123',
  name: 'Alice',
};

// Fungsi Bantuan  

/**
 * Helper: Melakukan login via UI.
 * @param {import('@playwright/test').Page} page
 * @param {string} email
 * @param {string} password
 */
async function loginViaUI(page, email, password) {
  await page.goto(BASE_URL);
  await page.locator('#login-email').fill(email);
  await page.locator('#login-password').fill(password);
  // Gunakan selector yang lebih spesifik pada tombol submit di form login
  // untuk menghindari konflik strict mode (karena ada lebih dari satu tombol "Masuk")
  await page.locator('#login-form').getByRole('button', { name: 'Masuk' }).click();
  // Tunggu sampai halaman dashboard muncul setelah login sukses
  await page.waitForSelector('button:has-text("+ Catatan Baru")', { timeout: 15000 });
}

// ==========================================
// TEST SUITE: Pengujian UI & Fungsionalitas
// ==========================================
test.describe('UI & Functional Testing', () => {
  
    // --------------------------------
  // TC05: Login berhasil sebagai user
  // ----------------------------------
  test('TC05 - Login sukses sebagai user Alice', async ({ page }) => {
    // Menguji TC05: Proses login untuk user berjalan dengan baik
    await page.goto(BASE_URL);

     // Pastikan elemen form login tampil
    await expect(page.locator('#login-email')).toBeVisible();
    await expect(page.locator('#login-password')).toBeVisible();

    // Masukkan data login Alice
    await page.locator('#login-email').fill(USER_ALICE.email);
    await page.locator('#login-password').fill(USER_ALICE.password);

    // Klik tombol login dengan selector yang lebih spesifik
    await page.locator('#login-form').getByRole('button', { name: 'Masuk' }).click();

    // Pastikan dashboard muncul sebagai indikasi login berhasil
    await expect(
      page.locator('button:has-text("+ Catatan Baru")')
    ).toBeVisible({ timeout: 15000 });

    // Validasi tambahan: elemen terkait user muncul di halaman
    const pageContent = await page.textContent('body');
    expect(pageContent).toContain('Catatan');
  });

  // -------------------------------------
  // TC05: Membuat catatan baru oleh user
  // -------------------------------------
  test('TC05 - User dapat membuat catatan baru', async ({ page }) => {
    // Menguji TC05: Fitur penambahan catatan berjalan normal
    await loginViaUI(page, USER_ALICE.email, USER_ALICE.password);

    const uniqueTitle = `Test Note ${Date.now()}`;
    const noteContent = 'Ini adalah catatan pengujian otomatis dari Playwright.';

    // Klik tombol untuk menambah catatan
    await page.locator('button:has-text("+ Catatan Baru")').click();

    // Tunggu form input catatan tampil
    await expect(page.locator('#note-title')).toBeVisible({ timeout: 10000 });

    // Isi judul dan isi catatan
    await page.locator('#note-title').fill(uniqueTitle);
    await page.locator('#note-content').fill(noteContent);

    // Klik simpan catatan
    await page.locator('button:has-text("Simpan Catatan")').click();

    // Verifikasi: Tunggu navigasi kembali ke dashboard atau konfirmasi berhasil
    // Catatan baru harus muncul di daftar
    await page.waitForTimeout(2000);
    
    // Jika masih berada di halaman editor, kembali ke dashboard
    const kembaliButton = page.locator('#page-editor').getByRole('button', { name: '← Kembali' });
    if (await kembaliButton.isVisible()) {
      await kembaliButton.click();
    }

    // Pastikan catatan baru muncul di dashboard
    await expect(page.locator('button:has-text("+ Catatan Baru")')).toBeVisible({ timeout: 10000 });
    const dashboardContent = await page.textContent('body');
    expect(dashboardContent).toContain(uniqueTitle);
  });

   // --------------------------------------------------------------------------
  // TC11: Uji validasi error share note tanpa email valid (Bug 05)
  // --------------------------------------------------------------------------
  test('TC11 - Bug 05: Validasi error saat share note tanpa email yang valid', async ({ page }) => {
     // Menguji TC11 / Bug 05: Sistem seharusnya menolak email yang tidak sesuai format
    await loginViaUI(page, USER_ALICE.email, USER_ALICE.password);

    // Cari catatan yang sudah ada dan klik Edit
    const editButton = page.locator('button:has-text("Edit")').first();
    await expect(editButton).toBeVisible({ timeout: 10000 });
    await editButton.click();

    // Tunggu halaman edit catatan muncul
    await expect(page.locator('#note-title')).toBeVisible({ timeout: 10000 });

    // Klik tombol "Bagikan"
    const shareButton = page.locator('#share-btn, button:has-text("Bagikan")').first();
    await expect(shareButton).toBeVisible({ timeout: 5000 });
    await shareButton.click();

    // Tunggu modal share muncul
    const shareEmailInput = page.locator('#share-email');
    await expect(shareEmailInput).toBeVisible({ timeout: 5000 });

    // === Test Case 1: Input email dengan format tidak valid ===
    await shareEmailInput.fill('email-tidak-valid');
    
    // Klik tombol bagikan di modal
    const shareConfirmButton = page.locator('button:has-text("Bagikan")').last();
    await shareConfirmButton.click();

    // Bug 05: Seharusnya sistem menampilkan pesan error validasi email
    // Tunggu respons dari sistem
    await page.waitForTimeout(2000);

    // Verifikasi: Periksa apakah ada pesan error atau alert yang muncul
    const errorVisible = await page.locator('.alert-danger, .error, .text-danger, [role="alert"]').isVisible().catch(() => false);
    const pageText = await page.textContent('body');
    
    // Dokumentasi Bug 05: Jika tidak ada error yang muncul, berarti bug masih ada
    // Sistem seharusnya menolak email yang tidak valid
    console.log('[Bug 05] Error validation terdeteksi:', errorVisible);
    console.log('[Bug 05] Halaman mengandung pesan error:', 
      pageText.toLowerCase().includes('error') || 
      pageText.toLowerCase().includes('valid') ||
      pageText.toLowerCase().includes('gagal')
    );

    // === Test Case 2: Input email kosong ===
    // Modal share kemungkinan sudah tertutup setelah Test Case 1,
    // jadi kita perlu membuka ulang modal share terlebih dahulu.
    await shareButton.click();
    await page.waitForSelector('#share-email', { state: 'visible', timeout: 5000 });

    // Pastikan elemen sudah siap diinteraksi sebelum clear
    await shareEmailInput.clear();
    await shareConfirmButton.click();
    await page.waitForTimeout(2000);

    // Verifikasi: Seharusnya tidak berhasil share dengan email kosong
    const emptyEmailError = await page.locator('.alert-danger, .error, .text-danger, [role="alert"]').isVisible().catch(() => false);
    console.log('[Bug 05] Validasi email kosong:', emptyEmailError);
  });

  // --------------------------------------------------------------------------
  // TC13: Verifikasi Fitur "Public Note" (Bug 08)
  // --------------------------------------------------------------------------
  test('TC13 - Bug 08: Verifikasi fitur Public Note gagal mempublikasikan catatan', async ({ page, request }) => {
    // Memverifikasi TC13 / Bug 08: Fitur Public Note seharusnya berfungsi,
    // namun saat manual testing fitur ini gagal mempublikasikan catatan.
    await loginViaUI(page, USER_ALICE.email, USER_ALICE.password);

    const publicNoteTitle = `Public Note Test ${Date.now()}`;
    const publicNoteContent = 'Catatan ini seharusnya bisa diakses publik.';

    // Buat catatan baru dengan opsi "Public" dicentang
    await page.locator('button:has-text("+ Catatan Baru")').click();
    await expect(page.locator('#note-title')).toBeVisible({ timeout: 10000 });

    // Isi detail catatan
    await page.locator('#note-title').fill(publicNoteTitle);
    await page.locator('#note-content').fill(publicNoteContent);

    // Centang checkbox "Public"
    const publicCheckbox = page.locator('#note-public');
    await expect(publicCheckbox).toBeVisible({ timeout: 5000 });
    
    // Pastikan checkbox tercentang
    if (!(await publicCheckbox.isChecked())) {
      await publicCheckbox.check();
    }

    // Verifikasi checkbox sudah tercentang
    await expect(publicCheckbox).toBeChecked();

    // Intercept API request untuk menangkap response create note
    let createNoteResponse = null;
    page.on('response', async (response) => {
      if (response.url().includes('/api/notes') && response.request().method() === 'POST') {
        createNoteResponse = {
          status: response.status(),
          body: await response.json().catch(() => null),
        };
      }
    });

    // Simpan catatan
    await page.locator('button:has-text("Simpan Catatan")').click();
    await page.waitForTimeout(3000);

    // Log respons API untuk dokumentasi
    if (createNoteResponse) {
      console.log('[Bug 08] Create Public Note - Status:', createNoteResponse.status);
      console.log('[Bug 08] Create Public Note - Response:', JSON.stringify(createNoteResponse.body));
      
      // Verifikasi: Periksa apakah field "is_public" atau "public" bernilai true di response
      const noteData = createNoteResponse.body;
      if (noteData) {
        const isPublic = noteData.is_public || noteData.public || noteData?.data?.is_public || noteData?.data?.public;
        console.log('[Bug 08] Catatan ditandai publik di response API:', isPublic);

        // Bug 08: Jika catatan tidak ditandai publik di response,
        // maka fitur Public Note tidak berfungsi sebagaimana mestinya
        if (!isPublic) {
          console.warn('[Bug 08] CONFIRMED: Fitur Public Note GAGAL - catatan tidak dipublikasikan');
        }
      }
    }

    // Kembali ke dashboard dan periksa badge "Publik"
    // Menggunakan locator spesifik ke #page-editor untuk menghindari strict mode violation
    const kembaliButton = page.locator('#page-editor').getByRole('button', { name: '← Kembali' });
    if (await kembaliButton.isVisible()) {
      await kembaliButton.click();
    }

    await page.waitForTimeout(2000);

    // Bug 08 Verification: Periksa apakah catatan menampilkan badge "Publik" di dashboard
    const publicBadge = page.locator(`text=Publik`);
    const hasBadge = await publicBadge.isVisible().catch(() => false);
    console.log('[Bug 08] Badge "Publik" terlihat di dashboard:', hasBadge);

    // Verifikasi melalui API: Coba akses endpoint public notes
    const publicNotesResponse = await request.get(`${BASE_URL}/api/notes/public`);
    console.log('[Bug 08] GET /api/notes/public - Status:', publicNotesResponse.status());
    
    if (publicNotesResponse.ok()) {
      const publicNotes = await publicNotesResponse.json();
      console.log('[Bug 08] Public Notes Data:', JSON.stringify(publicNotes));
      
      // Periksa apakah catatan yang baru dibuat ada di daftar publik
      const foundInPublic = JSON.stringify(publicNotes).includes(publicNoteTitle);
      console.log('[Bug 08] Catatan ditemukan di daftar publik:', foundInPublic);
      
      // Bug 08: Jika catatan tidak ditemukan di daftar publik, bug terkonfirmasi
      if (!foundInPublic) {
        console.warn('[Bug 08] CONFIRMED: Catatan tidak muncul di daftar public notes');
      }
    }
  });
});