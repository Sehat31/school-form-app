// ============================================
// MAIN APPLICATION & GLOBAL VARIABLES
// ============================================
let allSekolahData = [];
let allPMData = [];
let allGuruData = [];
let currentDataTab = 'sekolah';
let sensitiveDataUnlocked = false;
let appPin = '2024'; // Fallback default jika tabel app_config belum dibuat

// ============================================
// INITIALIZATION (HANYA 1x DOMContentLoaded)
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
    lucide.createIcons();
    
    // 1. Load PIN dari database (dengan fallback)
    const pinLoaded = await loadAppPin();
    if (!pinLoaded) {
        console.warn('Menggunakan PIN fallback: 2024');
    }
    
    // 2. Load data awal
    loadSchoolDropdown();
    setActiveStatCard('sekolah');
    
    // 3. Cek status unlock dari session
    if (sessionStorage.getItem('sensitiveDataUnlocked') === 'true') {
        sensitiveDataUnlocked = true;
        updateSecurityBar();
    }
});

// ============================================
// 🔒 SECURITY & PIN FUNCTIONS
// ============================================
async function loadAppPin() {
    try {
        const { data, error } = await queryWithRetry(() => 
            db.from('app_config').select('config_value').eq('config_key', 'admin_pin').single()
        );
        if (error || !data) return false;
        appPin = data.config_value;
        return true;
    } catch (err) {
        console.error('Error load PIN:', err);
        return false;
    }
}

function checkPassword() {
    const input = document.getElementById('passwordInput');
    const error = document.getElementById('passwordError');
    const userPin = input.value.trim();
    
    if (!userPin) {
        error.textContent = 'PIN tidak boleh kosong!';
        error.style.display = 'flex';
        error.classList.add('show');
        return;
    }
    
    if (userPin === appPin) {
        sensitiveDataUnlocked = true;
        sessionStorage.setItem('sensitiveDataUnlocked', 'true');
        closePasswordModal();
        updateSecurityBar();
        filterData();
        loadUploadedFiles();
        showToast('✅ Akses diberikan! Data sensitif terbuka.', 'success');
    } else {
        error.textContent = 'PIN salah! Silakan coba lagi.';
        error.style.display = 'flex';
        error.classList.add('show');
        input.value = '';
        input.focus();
        
        // Shake animation
        input.style.animation = 'shake 0.4s';
        setTimeout(() => {
            input.style.animation = '';
            error.classList.remove('show');
        }, 2000);
    }
}

function maskNIK(nik) {
    if (!nik) return '••••••••••••••••';
    const str = String(nik);
    return str.length >= 4 ? '•'.repeat(str.length - 4) + str.slice(-4) : '•'.repeat(str.length);
}

function maskPhone(phone) {
    if (!phone) return '••••••••••';
    const str = String(phone);
    return str.length >= 4 ? '•'.repeat(str.length - 4) + str.slice(-4) : '•'.repeat(str.length);
}

function renderSensitiveData(value, type, id) {
    const masked = type === 'nik' ? maskNIK(value) : maskPhone(value);
    const icon = sensitiveDataUnlocked ? 'eye-off' : 'eye';
    const displayValue = sensitiveDataUnlocked ? value : masked;
    const revealedClass = sensitiveDataUnlocked ? 'revealed' : '';
    
    return `
        <span class="masked-data ${revealedClass}" data-id="${id}" data-type="${type}" data-original="${value}">
            <span class="data-value">${displayValue}</span>
            <button class="reveal-btn" onclick="toggleReveal(${id}, '${type}', event)" title="${sensitiveDataUnlocked ? 'Sembunyikan' : 'Lihat data'}">
                <i data-lucide="${icon}"></i>
            </button>
        </span>
    `;
}

function toggleReveal(id, type, event) {
    if (event) event.stopPropagation();
    sensitiveDataUnlocked ? lockAllData() : openPasswordModal('unlock');
}

function openPasswordModal(action) {
    const modal = document.getElementById('passwordModal');
    const input = document.getElementById('passwordInput');
    const error = document.getElementById('passwordError');
    const title = document.getElementById('passwordModalTitle');
    
    title.innerHTML = '<i data-lucide="shield"></i> Verifikasi Keamanan';
    input.value = '';
    error.style.display = 'none';
    error.classList.remove('show');
    modal.classList.add('show');
    
    setTimeout(() => {
        input.focus();
        lucide.createIcons();
    }, 100);
}

function closePasswordModal(event) {
    if (event && event.target !== event.currentTarget) return;
    document.getElementById('passwordModal').classList.remove('show');
}

function togglePasswordVisibility() {
    const input = document.getElementById('passwordInput');
    const icon = document.getElementById('passwordEyeIcon');
    if (input.type === 'password') {
        input.type = 'text';
        icon.setAttribute('data-lucide', 'eye-off');
    } else {
        input.type = 'password';
        icon.setAttribute('data-lucide', 'eye');
    }
    lucide.createIcons();
}

function lockAllData() {
    sensitiveDataUnlocked = false;
    sessionStorage.removeItem('sensitiveDataUnlocked');
    updateSecurityBar();
    filterData();
    loadUploadedFiles();
    showToast('🔒 Data sensitif dikunci kembali', 'success');
}

function updateSecurityBar() {
    const bar = document.getElementById('securityBar');
    const unlockBtn = document.getElementById('unlockBtn');
    const lockBtn = document.getElementById('lockBtn');
    if (!bar) return;
    
    if (sensitiveDataUnlocked) {
        bar.classList.add('unlocked');
        bar.querySelector('.security-info span').innerHTML = 'Data sensitif (NIK & No HP) <strong>TERBUKA</strong> - berhati-hatilah!';
        unlockBtn.style.display = 'none';
        lockBtn.style.display = 'inline-flex';
    } else {
        bar.classList.remove('unlocked');
        bar.querySelector('.security-info span').innerHTML = 'Data sensitif (NIK & No HP) <strong>disensor otomatis</strong> untuk keamanan';
        unlockBtn.style.display = 'inline-flex';
        lockBtn.style.display = 'none';
    }
    lucide.createIcons();
}

// ============================================
// NAVIGATION & UI HELPERS
// ============================================
function setActiveStatCard(tab) {
    document.querySelectorAll('.stat-clickable').forEach(card => {
        card.classList.remove('active');
        if (card.dataset.tab === tab) card.classList.add('active');
    });
}

function showPage(pageName, event) {
    if (event) event.preventDefault();

    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const targetPage = document.getElementById(`page-${pageName}`);
    if (targetPage) targetPage.classList.add('active');

    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    const activeLink = document.querySelector(`.nav-link[data-page="${pageName}"]`);
    if (activeLink) activeLink.classList.add('active');

    if (pageName === 'data') {
        loadAllData();
        updateSecurityBar();
        setActiveStatCard(currentDataTab);
    }
    if (pageName === 'mbg') {
        loadSchoolDropdown();
        loadUploadedFiles();
    }

    const navMenu = document.querySelector('.nav-menu');
    if (navMenu) navMenu.classList.remove('open');

    lucide.createIcons();
    window.scrollTo(0, 0);
}

function toggleMobileMenu() {
    document.querySelector('.nav-menu')?.classList.toggle('open');
}

function toggleExample() {
    document.getElementById('example-content')?.classList.toggle('open');
    document.getElementById('example-toggle-icon')?.classList.toggle('open');
}

function fillExample() {
    document.getElementById('jenjang').value = 'SD';
    document.getElementById('nama_sekolah').value = 'SDN 1 Menteng';
    document.getElementById('nama_kepsek').value = 'Drs. H. Ahmad Dahlan, M.Pd';
    document.getElementById('npsn').value = '20100123';
    document.getElementById('alamat_sekolah').value = 'Jl. Menteng Raya No. 10, Jakarta Pusat 10310';
    document.getElementById('nama_pic').value = 'Budi Santoso, S.Pd';
    document.getElementById('nomor_hp').value = '081234567890';
    document.getElementById('spp_bulanan').value = '500.000';
    showToast('Form diisi dengan data contoh', 'success');
}

// ============================================
// FORM HANDLING - SEKOLAH
// ============================================
function formatCurrency(input) {
    let value = input.value.replace(/[^0-9]/g, '');
    input.value = value ? parseInt(value).toLocaleString('id-ID') : '';
}

async function handleSubmit(event) {
    event.preventDefault();

    // 1. Validasi Nomor HP
    const nomorHpRaw = document.getElementById('nomor_hp').value.trim();
    const nomorHpClean = nomorHpRaw.replace(/[\s-]/g, '');
    const phonePattern = /^(08|62)\d{8,13}$/;
    
    if (!phonePattern.test(nomorHpClean)) {
        showToast(' Format Nomor HP tidak valid!\n\nContoh benar:\n• 081234567890\n• 6281234567890\n(Harus diawali 08 atau 62, total 10-15 angka)', 'error');
        return;
    }
    
    // 2. Validasi NPSN
    const npsn = document.getElementById('npsn').value.trim();
    if (!/^\d{8}$/.test(npsn)) {
        showToast('❌ NPSN harus tepat 8 digit angka!', 'error');
        return;
    }

    // 3. Validasi SPP
    const sppBulananRaw = document.getElementById('spp_bulanan').value.replace(/\./g, '');
    const sppBulanan = parseInt(sppBulananRaw);
    if (isNaN(sppBulanan) || sppBulanan < 0) {
        showToast('❌ SPP Bulanan harus angka positif (isi 0 jika gratis)!', 'error');
        return;
    }

    const btn = document.getElementById('submitBtn');
    btn.disabled = true;
    btn.innerHTML = '<i data-lucide="loader-2" class="spin"></i> Menyimpan...';
    lucide.createIcons();

    try {
        const formData = {
            jenjang: document.getElementById('jenjang').value,
            nama_sekolah: document.getElementById('nama_sekolah').value,
            nama_kepsek: document.getElementById('nama_kepsek').value,
            npsn: npsn,
            alamat_sekolah: document.getElementById('alamat_sekolah').value,
            nama_pic: document.getElementById('nama_pic').value,
            nomor_hp: nomorHpClean,
            spp_bulanan: sppBulanan
        };

        // Cek duplikasi NPSN dengan Retry
        const { data: existingSchools } = await queryWithRetry(() => 
            db.from('sekolah').select('npsn, nama_sekolah').eq('npsn', npsn)
        );

        if (existingSchools && existingSchools.length > 0) {
            showToast(`❌ NPSN Duplikat! NPSN "${npsn}" sudah digunakan oleh "${existingSchools[0].nama_sekolah}".`, 'error');
            btn.disabled = false;
            btn.innerHTML = '<i data-lucide="save"></i> Simpan & Lanjutkan ke MBG';
            lucide.createIcons();
            return;
        }

        // Insert data
        await insertSchool(formData);
        showToast('✅ Data Sekolah berhasil disimpan! Silakan upload Data MBG.', 'success');

        setTimeout(() => {
            showPage('mbg');
            const selectNpsn = document.getElementById('select_npsn_mbg');
            if (selectNpsn) {
                selectNpsn.value = formData.npsn;
                loadSchoolInfo();
            }
        }, 1000);

    } catch (error) {
        console.error(error);
        showToast('❌ Gagal menyimpan data: ' + error.message, 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i data-lucide="save"></i> Simpan & Lanjutkan ke MBG';
        lucide.createIcons();
    }
}

function resetForm() {
    document.getElementById('schoolForm')?.reset();
}

// ============================================
// MBG & DATABASE FUNCTIONS
// ============================================
async function loadSchoolDropdown() {
    const select = document.getElementById('select_npsn_mbg');
    if (!select) return;
    try {
        const schools = await getAllSchools();
        allSekolahData = schools;
        select.innerHTML = '<option value="">-- Pilih Sekolah --</option>';
        schools.forEach(school => {
            const option = document.createElement('option');
            option.value = school.npsn;
            option.textContent = `${school.npsn} - ${school.nama_sekolah}`;
            option.dataset.sekolahId = school.id;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Gagal load sekolah:', error);
    }
}

async function loadSchoolInfo() {
    const select = document.getElementById('select_npsn_mbg');
    const infoDisplay = document.getElementById('schoolInfoDisplay');
    if (!select || !select.value) {
        if (infoDisplay) infoDisplay.style.display = 'none';
        return;
    }

    try {
        const { data: schools } = await queryWithRetry(() => 
            db.from('sekolah').select('*').eq('npsn', select.value)
        );

        if (infoDisplay) {
            const school = schools?.[0];
            if (school) {
                document.getElementById('infoNamaSekolah').textContent = school.nama_sekolah || '-';
                document.getElementById('infoJenjang').textContent = school.jenjang || '-';
                document.getElementById('infoKepsek').textContent = school.nama_kepsek || '-';
            } else {
                const namaDariDropdown = select.options[select.selectedIndex].textContent.split(' - ')[1] || '-';
                document.getElementById('infoNamaSekolah').textContent = namaDariDropdown;
                document.getElementById('infoJenjang').textContent = '-';
                document.getElementById('infoKepsek').textContent = '-';
            }
            infoDisplay.style.display = 'block';
        }
    } catch (err) {
        console.error('Exception loadSchoolInfo:', err);
        if (infoDisplay) infoDisplay.style.display = 'none';
    }
}

async function loadUploadedFiles() {
    const container = document.getElementById('uploadedFilesList');
    if (!container) return;
    container.innerHTML = '<div class="loading-placeholder"><i data-lucide="loader-2" class="spin"></i><p>Memuat daftar file...</p></div>';
    lucide.createIcons();
    
    try {
        const files = await getUploadedFiles();
        if (files.length === 0) {
            container.innerHTML = '<div class="loading-placeholder"><i data-lucide="inbox"></i><p>Belum ada file yang diupload</p></div>';
            lucide.createIcons();
            return;
        }
        
        const schools = await getAllSchools();
        container.innerHTML = files.map(file => {
            let matchedSchool = null;
            if (file.metadata?.npsn) {
                matchedSchool = schools.find(s => s.npsn === file.metadata.npsn);
            }
            if (!matchedSchool) {
                const fileName = file.name.replace('.xlsx', '');
                const parts = fileName.split('_');
                for (const school of schools) {
                    const schoolNameNormalized = school.nama_sekolah.toLowerCase().replace(/[^a-z0-9]/g, '');
                    const fileNameNormalized = parts.slice(0, -2).join('').toLowerCase();
                    if (fileNameNormalized.includes(schoolNameNormalized) || schoolNameNormalized.includes(fileNameNormalized)) {
                        matchedSchool = school;
                        break;
                    }
                }
            }
            
            const schoolName = matchedSchool ? matchedSchool.nama_sekolah : 'Sekolah Tidak Dikenal';
            let uploadedDate = 'Tanggal tidak diketahui';
            if (file.metadata?.uploaded_at) {
                uploadedDate = new Date(file.metadata.uploaded_at).toLocaleDateString('id-ID');
            } else {
                const dateMatch = file.name.match(/(\d{4}-\d{2}-\d{2})/);
                if (dateMatch) uploadedDate = new Date(dateMatch[1]).toLocaleDateString('id-ID');
            }
            
            const displayName = `${schoolName} - ${uploadedDate}.xlsx`;
            const downloadBtn = sensitiveDataUnlocked ? `
                <a href="${getFileUrl('excels/' + file.name)}" target="_blank" class="btn-icon" title="Download">
                    <i data-lucide="download"></i>
                </a>` : `
                <button class="btn-icon" title="🔒 Buka sensor dulu" onclick="showUnlockWarning()">
                    <i data-lucide="lock"></i>
                </button>`;

            return `
                <div class="file-item">
                    <i data-lucide="file-spreadsheet"></i>
                    <div class="file-item-info">
                        <p class="file-item-name">${displayName}</p>
                        <p class="file-item-meta">${formatFileSize(file.metadata?.size || file.size || 0)}</p>
                        <p class="file-item-meta" style="font-size: 0.75rem; color: var(--text-light);">Sekolah: ${schoolName}</p>
                    </div>
                    <div class="file-item-actions">
                        ${downloadBtn}
                        <button class="btn-icon" title="Hapus" onclick="deleteUploadedFile('excels/${file.name}')">
                            <i data-lucide="trash-2"></i>
                        </button>
                    </div>
                </div>`;
        }).join('');
        lucide.createIcons();
    } catch (error) {
        console.error('Error loading files:', error);
        container.innerHTML = `<div class="loading-placeholder"><i data-lucide="alert-circle"></i><p>Gagal memuat file</p></div>`;
        lucide.createIcons();
    }
}

async function deleteUploadedFile(path) {
    if (!sensitiveDataUnlocked) { showUnlockWarning(); return; }
    if (!confirm('Yakin ingin menghapus file ini?')) return;
    try {
        await deleteFileFromStorage(path);
        showToast('File berhasil dihapus', 'success');
        loadUploadedFiles();
    } catch (error) {
        showToast('Gagal menghapus file', 'error');
    }
}

// ============================================
// DATA TABLE & RENDERING
// ============================================
function showDataTab(tab, event) {
    if (event) event.preventDefault();
    currentDataTab = tab;
    setActiveStatCard(tab);
    filterData();
}

async function loadAllData() {
    try {
        allSekolahData = await getAllSchools();
        allPMData = await getAllPM();
        allGuruData = await getAllGuru();
        updateStats();
        filterData();
    } catch (error) {
        console.error('Gagal load data:', error);
    }
}

function updateStats() {
    const elSekolah = document.getElementById('totalSekolah');
    const elPM = document.getElementById('totalPM');
    const elGuru = document.getElementById('totalGuru');
    if (elSekolah) elSekolah.textContent = allSekolahData.length;
    if (elPM) elPM.textContent = allPMData.length;
    if (elGuru) elGuru.textContent = allGuruData.length;
}

function filterData() {
    const searchInput = document.getElementById('searchInput');
    const search = searchInput ? searchInput.value.toLowerCase().trim() : '';
    let data = [], headers = [], renderFn;

    if (currentDataTab === 'sekolah') {
        headers = ['No', 'Jenjang', 'Nama Sekolah', 'Kepala Sekolah', 'NPSN', 'Alamat', 'Nama PIC', 'No. HP', 'SPP', 'Aksi'];
        data = allSekolahData.filter(d => {
            const searchFields = [d.nama_sekolah, d.nama_kepsek, d.npsn, d.alamat_sekolah, d.nama_pic, d.nomor_hp, d.jenjang, String(d.spp_bulanan)].map(f => String(f || '').toLowerCase());
            return searchFields.some(field => field.includes(search));
        });
        renderFn = renderSekolahTable;
    } else if (currentDataTab === 'pm') {
        headers = ['No', 'Sekolah', 'NIK', 'NISN', 'Nama', 'Tempat Lahir', 'Tgl Lahir', 'JK', 'Orang Tua', 'Kelas', 'Aksi'];
        data = allPMData.filter(d => {
            const searchFields = [d.nik, d.nisn, d.nama_lengkap, d.tempat_lahir, d.tanggal_lahir, d.jenis_kelamin, d.nama_orang_tua, d.kelas, d.sekolah?.nama_sekolah].map(f => String(f || '').toLowerCase());
            return searchFields.some(field => field.includes(search));
        });
        renderFn = renderPMTable;
    } else {
        headers = ['No', 'Sekolah', 'NIK', 'Nama', 'Tempat Lahir', 'Tgl Lahir', 'JK', 'Jabatan', 'Aksi'];
        data = allGuruData.filter(d => {
            const searchFields = [d.nik, d.nama_lengkap, d.tempat_lahir, d.tanggal_lahir, d.jenis_kelamin, d.jabatan, d.sekolah?.nama_sekolah].map(f => String(f || '').toLowerCase());
            return searchFields.some(field => field.includes(search));
        });
        renderFn = renderGuruTable;
    }
    renderTable(headers, data, renderFn);
}

function renderTable(headers, data, renderFn) {
    const thead = document.getElementById('dataTableHead');
    const tbody = document.getElementById('dataTableBody');
    if (!thead || !tbody) return;

    thead.innerHTML = '<tr>' + headers.map(h => `<th>${h}</th>`).join('') + '</tr>';

    if (!data || data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="${headers.length}" class="empty-state"><i data-lucide="inbox"></i><p>Belum ada data</p></td></tr>`;
        lucide.createIcons();
        return;
    }

    tbody.innerHTML = '';
    data.forEach((row, idx) => {
        const tr = document.createElement('tr');
        tr.innerHTML = renderFn(row, idx);
        tbody.appendChild(tr);
    });
    lucide.createIcons();
}

function renderSekolahTable(row, idx) {
    const nomorHP = renderSensitiveData(row.nomor_hp, 'phone', row.id);
    const deleteBtn = sensitiveDataUnlocked 
        ? `<button class="btn-icon delete" title="Hapus" onclick="deleteSekolah(${row.id})"><i data-lucide="trash-2"></i></button>`
        : `<button class="btn-icon delete" title=" Buka sensor dulu" onclick="showUnlockWarning()"><i data-lucide="lock"></i></button>`;
    
    return `
        <td>${idx + 1}</td>
        <td><span class="badge">${row.jenjang}</span></td>
        <td><strong>${row.nama_sekolah}</strong></td>
        <td>${row.nama_kepsek || '-'}</td>
        <td><code>${row.npsn}</code></td>
        <td>${row.alamat_sekolah}</td>
        <td>${row.nama_pic}</td>
        <td>${nomorHP}</td>
        <td>Rp ${parseInt(row.spp_bulanan).toLocaleString('id-ID')}</td>
        <td><div class="action-btns">${deleteBtn}</div></td>
    `;
}

function renderPMTable(row, idx) {
    const namaSekolah = row.sekolah?.nama_sekolah || '-';
    const nik = renderSensitiveData(row.nik, 'nik', row.id);
    const tglLahir = row.tanggal_lahir ? formatDate(row.tanggal_lahir) : '-';
    const deleteBtn = sensitiveDataUnlocked 
        ? `<button class="btn-icon delete" title="Hapus" onclick="deletePMData(${row.id})"><i data-lucide="trash-2"></i></button>`
        : `<button class="btn-icon delete" title="🔒 Buka sensor dulu" onclick="showUnlockWarning()"><i data-lucide="lock"></i></button>`;
    
    return `
        <td>${idx + 1}</td><td>${namaSekolah}</td><td>${nik}</td><td>${row.nisn || '-'}</td>
        <td>${row.nama_lengkap || '-'}</td><td>${row.tempat_lahir || '-'}</td><td>${tglLahir}</td>
        <td>${row.jenis_kelamin || '-'}</td><td>${row.nama_orang_tua || '-'}</td><td>${row.kelas || '-'}</td>
        <td><div class="action-btns">${deleteBtn}</div></td>
    `;
}

function renderGuruTable(row, idx) {
    const namaSekolah = row.sekolah?.nama_sekolah || '-';
    const nik = renderSensitiveData(row.nik, 'nik', row.id);
    const tglLahir = row.tanggal_lahir ? formatDate(row.tanggal_lahir) : '-';
    const deleteBtn = sensitiveDataUnlocked 
        ? `<button class="btn-icon delete" title="Hapus" onclick="deleteGuruData(${row.id})"><i data-lucide="trash-2"></i></button>`
        : `<button class="btn-icon delete" title="🔒 Buka sensor dulu" onclick="showUnlockWarning()"><i data-lucide="lock"></i></button>`;
    
    return `
        <td>${idx + 1}</td><td>${namaSekolah}</td><td>${nik}</td><td>${row.nama_lengkap || '-'}</td>
        <td>${row.tempat_lahir || '-'}</td><td>${tglLahir}</td><td>${row.jenis_kelamin || '-'}</td>
        <td>${row.jabatan || '-'}</td><td><div class="action-btns">${deleteBtn}</div></td>
    `;
}

function showUnlockWarning() {
    showToast('Masukkan PIN untuk mendapatkan akses ini!', 'error');
    openPasswordModal('unlock');
}

function formatDate(dateStr) {
    if (!dateStr) return '-';
    const parts = String(dateStr).split('-');
    return parts.length === 3 ? `${parts[2]}-${parts[1]}-${parts[0]}` : dateStr;
}

async function deleteSekolah(id) {
    if (!sensitiveDataUnlocked) { showUnlockWarning(); return; }
    if (!confirm('Yakin ingin menghapus data sekolah ini? Data MBG terkait juga akan terhapus!')) return;
    try {
        await deleteSchool(id);
        showToast('Data sekolah berhasil dihapus', 'success');
        allSekolahData = allSekolahData.filter(d => d.id !== id);
        updateStats();
        filterData();
    } catch (error) {
        showToast('Gagal menghapus data', 'error');
    }
}

async function deletePMData(id) {
    if (!sensitiveDataUnlocked) { showUnlockWarning(); return; }
    if (!confirm('Yakin ingin menghapus data ini?')) return;
    try {
        await deletePM(id);
        showToast('Data PM berhasil dihapus', 'success');
        allPMData = allPMData.filter(d => d.id !== id);
        updateStats();
        filterData();
    } catch (error) {
        showToast('Gagal menghapus data', 'error');
    }
}

async function deleteGuruData(id) {
    if (!sensitiveDataUnlocked) { showUnlockWarning(); return; }
    if (!confirm('Yakin ingin menghapus data ini?')) return;
    try {
        await deleteGuru(id);
        showToast('Data Guru berhasil dihapus', 'success');
        allGuruData = allGuruData.filter(d => d.id !== id);
        updateStats();
        filterData();
    } catch (error) {
        showToast('Gagal menghapus data', 'error');
    }
}

// ============================================
// UPLOAD MBG FILE
// ============================================
async function uploadMBGFile() {
    const selectNpsn = document.getElementById('select_npsn_mbg');
    const npsn = selectNpsn ? selectNpsn.value : '';

    if (!npsn) {
        showToast('❌ Pilih sekolah terlebih dahulu!', 'error');
        return;
    }

    if (!selectedFile || (parsedPMData.length === 0 && parsedGuruData.length === 0)) {
        showToast('❌ Tidak ada data untuk diupload', 'error');
        return;
    }

    const btn = document.getElementById('uploadBtn');
    btn.disabled = true;
    btn.innerHTML = '<i data-lucide="loader-2" class="spin"></i> Mengupload...';
    lucide.createIcons();

    try {
        const selectedOption = selectNpsn.options[selectNpsn.selectedIndex];
        const sekolahId = selectedOption.dataset.sekolahId;
        const sekolahName = selectedOption.textContent.split(' - ')[1] || 'Sekolah';

        const allNIKsToUpload = [];
        parsedPMData.forEach(r => {
            const nik = String(r['NIK (16 Digit)'] || r.NIK || '').trim();
            if (nik) allNIKsToUpload.push(nik);
        });
        parsedGuruData.forEach(r => {
            const nik = String(r['NIK (16 Digit)'] || r.NIK || '').trim();
            if (nik) allNIKsToUpload.push(nik);
        });

        if (allNIKsToUpload.length > 0) {
            const { data: existingPM, error: pmError } = await db
                .from('pm_mbg')
                .select('nik, sekolah_id')
                .in('nik', allNIKsToUpload);

            if (pmError) console.error('Error cek PM:', pmError);

            const { data: existingGuru, error: guruError } = await db
                .from('guru_tendik')
                .select('nik, sekolah_id')
                .in('nik', allNIKsToUpload);

            if (guruError) console.error('Error cek Guru:', guruError);

            const allExisting = [...(existingPM || []), ...(existingGuru || [])];
            const crossSchoolDuplicates = allExisting.filter(item => 
                String(item.sekolah_id) !== String(sekolahId)
            );

            if (crossSchoolDuplicates.length > 0) {
                const dupNIKs = crossSchoolDuplicates.map(d => d.nik).join(', ');
                showToast(`❌ NIK sudah ada di sekolah lain! NIK: ${dupNIKs}`, 'error');
                
                btn.disabled = false;
                btn.innerHTML = '<i data-lucide="cloud-upload"></i> Upload & Simpan ke Database';
                lucide.createIcons();
                return;
            }
        }

        const now = new Date();
        const timestamp = `${now.getHours().toString().padStart(2, '0')}-${now.getMinutes().toString().padStart(2, '0')}-${now.getSeconds().toString().padStart(2, '0')}`;
        const fileName = `${sekolahName.replace(/[^a-zA-Z0-9]/g, '_')}_${now.toISOString().split('T')[0]}_${timestamp}.xlsx`;
        await uploadFileToStorageWithMetadata(selectedFile, {
            npsn: npsn,
            sekolah_id: sekolahId,
            sekolah_nama: sekolahName,
            uploaded_at: new Date().toISOString()
        }, fileName);

        if (parsedPMData.length > 0) {
            const pmRecords = parsedPMData.map(r => {
                const namaLengkap = r['NAMA LENGKAP (Sesuai Akta/KTP)'] || r['NAMA LENGKAP'] || r['Nama Lengkap'] || r['nama_lengkap'] || r['nama'] || r['Nama'] || '';
                const tempatLahir = r['TEMPAT LAHIR (Kota/Kabupaten)'] || r['TEMPAT LAHIR'] || r['Tempat Lahir'] || r['tempat_lahir'] || r['tempat'] || r['Tempat'] || '';
                const tanggalLahirRaw = r['TANGGAL LAHIR (dd-mm-yyyy)'] || r['TANGGAL LAHIR'] || r['Tanggal Lahir'] || r['tanggal_lahir'] || r['tanggal'] || r['Tanggal'] || '';
                const jenisKelamin = r['JENIS KELAMIN (L/P)'] || r['JENIS KELAMIN'] || r['Jenis Kelamin'] || r['jenis_kelamin'] || r['jk'] || r['JK'] || r['kelamin'] || '';
                const namaOrangTua = r['NAMA ORANG TUA/WALI (Ayah/Ibu/Wali)'] || r['NAMA ORANG TUA/WALI'] || r['Nama Orang Tua/Wali'] || r['nama_orang_tua'] || r['orang_tua'] || r['Orang Tua'] || r['nama_ortu'] || r['Nama Orang Tua'] || '';
                const kelas = r['KELAS (Contoh: 1,7,10)'] || r['KELAS'] || r['Kelas'] || r['kelas'] || r['K'] || r['TINGKAT'] || '';

                return {
                    sekolah_id: parseInt(sekolahId),
                    npsn: npsn,
                    nik: String(r['NIK (16 Digit)'] || r['NIK'] || r.NIK || '').trim(),
                    nisn: String(r['NISN (10 Digit)'] || r['NISN'] || r.NISN || '').trim(),
                    nama_lengkap: namaLengkap.trim(),
                    tempat_lahir: tempatLahir.trim(),
                    tanggal_lahir: parseTanggalLahir(tanggalLahirRaw),
                    jenis_kelamin: jenisKelamin.trim().toUpperCase(),
                    nama_orang_tua: namaOrangTua.trim(),
                    kelas: kelas.trim(),
                    keterangan: r['Keterangan'] || r['KETERANGAN'] || ''
                };
            });
            
            console.log('PM Records to insert:', pmRecords);
            await insertBulkPM(pmRecords);
        }

        if (parsedGuruData.length > 0) {
            const guruRecords = parsedGuruData.map(r => {
                const namaLengkap = r['NAMA LENGKAP (Sesuai KTP)'] || r['NAMA LENGKAP'] || r['Nama Lengkap'] || r['nama_lengkap'] || r['nama'] || '';
                const tempatLahir = r['TEMPAT LAHIR (Kota/Kabupaten)'] || r['TEMPAT LAHIR'] || r['Tempat Lahir'] || r['tempat_lahir'] || '';
                const tanggalLahirRaw = r['TANGGAL LAHIR (dd-mm-yyyy)'] || r['TANGGAL LAHIR'] || r['Tanggal Lahir'] || r['tanggal_lahir'] || '';
                const jenisKelamin = r['JENIS KELAMIN (L/P)'] || r['JENIS KELAMIN'] || r['Jenis Kelamin'] || r['jenis_kelamin'] || r['jk'] || '';
                const jabatan = r['JABATAN (Guru/Tendik)'] || r['JABATAN'] || r['Jabatan'] || r['jabatan'] || r['posisi'] || '';

                return {
                    sekolah_id: parseInt(sekolahId),
                    npsn: npsn,
                    nik: String(r['NIK (16 Digit)'] || r['NIK'] || r.NIK || '').trim(),
                    nama_lengkap: namaLengkap.trim(),
                    tempat_lahir: tempatLahir.trim(),
                    tanggal_lahir: parseTanggalLahir(tanggalLahirRaw),
                    jenis_kelamin: jenisKelamin.trim().toUpperCase(),
                    jabatan: jabatan.trim(),
                    keterangan: r['Keterangan'] || r['KETERANGAN'] || ''
                };
            });
            
            console.log('Guru Records to insert:', guruRecords);
            await insertBulkGuru(guruRecords);
        }

        showToast(`✅ ${parsedPMData.length} PM + ${parsedGuruData.length} Guru/Tendik berhasil disimpan!`, 'success');
        removeFile();
        loadUploadedFiles();
    } catch (error) {
        console.error(error);
        showToast('❌ Gagal upload: ' + error.message, 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i data-lucide="cloud-upload"></i> Upload & Simpan ke Database';
        lucide.createIcons();
    }
}

// ============================================
// PARSE TANGGAL LAHIR
// ============================================
function parseTanggalLahir(tanggal) {
    if (!tanggal) return null;
    
    if (tanggal instanceof Date) {
        if (isNaN(tanggal.getTime())) return null;
        const year = tanggal.getFullYear();
        const month = String(tanggal.getMonth() + 1).padStart(2, '0');
        const day = String(tanggal.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    
    const str = String(tanggal).trim();
    const parts = str.split(/[-\/]/);
    
    if (parts.length === 3) {
        let p1 = parseInt(parts[0]);
        let p2 = parseInt(parts[1]);
        let p3 = parseInt(parts[2]);
        let day, month, year;
        
        if (parts[0].length === 4) {
            year = p1; month = p2; day = p3;
        } else if (parts[2].length === 4) {
            year = p3;
            if (p2 > 12) { month = p1; day = p2; } 
            else if (p1 > 12) { day = p1; month = p2; } 
            else { day = p1; month = p2; }
        } else {
            year = p3 > 30 ? 1900 + p3 : 2000 + p3;
            if (p2 > 12) { month = p1; day = p2; } 
            else if (p1 > 12) { day = p1; month = p2; } 
            else { day = p1; month = p2; }
        }
        
        if (month < 1 || month > 12 || day < 1 || day > 31) {
            console.warn('Tanggal tidak valid:', str);
            return null;
        }
        
        return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
    
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
        return str;
    }
    
    console.warn('Format tanggal tidak dikenali:', str);
    return null;
}

// ============================================
// EXPORT DATA (DILENGKAPI)
// ============================================
function exportCurrentData() {
    if (!sensitiveDataUnlocked) {
        showToast('Buka sensor data terlebih dahulu sebelum export!', 'error');
        openPasswordModal('unlock');
        return;
    }
    
    let exportData = [];
    let filename = '';

    if (currentDataTab === 'sekolah') {
        exportData = allSekolahData.map((d, i) => ({
            'No': i + 1, 'Jenjang': d.jenjang, 'Nama Sekolah': d.nama_sekolah,
            'Kepala Sekolah': d.nama_kepsek, 'NPSN': d.npsn, 'Alamat': d.alamat_sekolah,
            'Nama PIC': d.nama_pic, 'No HP': d.nomor_hp, 'SPP': d.spp_bulanan
        }));
        filename = 'Export_Data_Sekolah';
    } else if (currentDataTab === 'pm') {
        exportData = allPMData.map((d, i) => ({
            'No': i + 1, 'Sekolah': d.sekolah?.nama_sekolah, 'NIK': d.nik, 'NISN': d.nisn,
            'Nama': d.nama_lengkap, 'Tempat Lahir': d.tempat_lahir, 
            'Tanggal Lahir': d.tanggal_lahir, 'Jenis Kelamin': d.jenis_kelamin,
            'Orang Tua': d.nama_orang_tua, 'Kelas': d.kelas
        }));
        filename = 'Export_Data_PM';
    } else {
        exportData = allGuruData.map((d, i) => ({
            'No': i + 1, 'Sekolah': d.sekolah?.nama_sekolah, 'NIK': d.nik,
            'Nama': d.nama_lengkap, 'Tempat Lahir': d.tempat_lahir,
            'Tanggal Lahir': d.tanggal_lahir, 'Jenis Kelamin': d.jenis_kelamin,
            'Jabatan': d.jabatan
        }));
        filename = 'Export_Data_Guru';
    }

    if (exportData.length === 0) {
        showToast('Tidak ada data untuk diexport', 'error');
        return;
    }

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Data');
    XLSX.writeFile(wb, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
    showToast('Data berhasil diexport!', 'success');
}

// ============================================
// TOAST NOTIFICATION
// ============================================
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const icon = document.getElementById('toastIcon');
    const msg = document.getElementById('toastMessage');

    toast.className = `toast ${type}`;
    msg.textContent = message;
    
    const iconName = type === 'success' ? 'check-circle' : 'alert-triangle';
    icon.setAttribute('data-lucide', iconName);
    
    lucide.createIcons();
    toast.classList.add('show');

    if (window.toastTimeout) clearTimeout(window.toastTimeout);

    // SUKSES: Hilang otomatis setelah 3.5 detik
    if (type === 'success') {
        window.toastTimeout = setTimeout(() => toast.classList.remove('show'), 3500);
    } 
    // ERROR: TIDAK ada setTimeout. Tetap muncul sampai user klik tombol X.
}

function closeToast() {
    const toast = document.getElementById('toast');
    toast.classList.remove('show');
    if (window.toastTimeout) clearTimeout(window.toastTimeout);
}

// ============================================
// MODAL
// ============================================
function closeModal(event) {
    if (event && event.target !== event.currentTarget) return;
    const modal = document.getElementById('modal');
    if (modal) modal.classList.remove('show');
}

// ============================================
// HELPER: Format File Size
// ============================================
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}