// ============================================
// MAIN APPLICATION
// ============================================

let allSekolahData = [];
let allPMData = [];
let allGuruData = [];
let currentDataTab = 'sekolah';

// 🔒 SECURITY STATE
let sensitiveDataUnlocked = false;
const SENSITIVE_PASSWORD = '2024';

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();
    loadSchoolDropdown();
    
    if (sessionStorage.getItem('sensitiveDataUnlocked') === 'true') {
        sensitiveDataUnlocked = true;
        updateSecurityBar();
    }
});

// ============================================
// 🔒 SECURITY FUNCTIONS
// ============================================

function maskNIK(nik) {
    if (!nik) return '••••••••••••••••';
    const str = String(nik);
    if (str.length >= 4) {
        return '•'.repeat(str.length - 4) + str.slice(-4);
    }
    return '•'.repeat(str.length);
}

function maskPhone(phone) {
    if (!phone) return '••••••••••';
    const str = String(phone);
    if (str.length >= 4) {
        return '•'.repeat(str.length - 4) + str.slice(-4);
    }
    return '•'.repeat(str.length);
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
    
    if (sensitiveDataUnlocked) {
        lockAllData();
    } else {
        openPasswordModal('unlock');
    }
}

function openPasswordModal(action) {
    const modal = document.getElementById('passwordModal');
    const input = document.getElementById('passwordInput');
    const error = document.getElementById('passwordError');
    const title = document.getElementById('passwordModalTitle');
    
    if (action === 'unlock') {
        title.innerHTML = '<i data-lucide="shield"></i> Verifikasi Keamanan';
    }
    
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
    const modal = document.getElementById('passwordModal');
    modal.classList.remove('show');
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

function checkPassword() {
    const input = document.getElementById('passwordInput');
    const error = document.getElementById('passwordError');
    const password = input.value;
    
    if (password === SENSITIVE_PASSWORD) {
        sensitiveDataUnlocked = true;
        sessionStorage.setItem('sensitiveDataUnlocked', 'true');
        closePasswordModal();
        updateSecurityBar();
        filterData();
        showToast('Data sensitif berhasil dibuka!', 'success');
    } else {
        error.style.display = 'flex';
        error.classList.add('show');
        input.value = '';
        input.focus();
        
        setTimeout(() => {
            error.classList.remove('show');
        }, 2000);
    }
}

function lockAllData() {
    sensitiveDataUnlocked = false;
    sessionStorage.removeItem('sensitiveDataUnlocked');
    updateSecurityBar();
    filterData();
    showToast('Data sensitif dikunci kembali', 'success');
}

function updateSecurityBar() {
    const bar = document.getElementById('securityBar');
    const unlockBtn = document.getElementById('unlockBtn');
    const lockBtn = document.getElementById('lockBtn');
    
    if (!bar) return;
    
    if (sensitiveDataUnlocked) {
        bar.classList.add('unlocked');
        bar.querySelector('.security-info span').innerHTML = 
            'Data sensitif (NIK & No HP) <strong>TERBUKA</strong> - berhati-hatilah!';
        unlockBtn.style.display = 'none';
        lockBtn.style.display = 'inline-flex';
    } else {
        bar.classList.remove('unlocked');
        bar.querySelector('.security-info span').innerHTML = 
            'Data sensitif (NIK & No HP) <strong>disensor otomatis</strong> untuk keamanan';
        unlockBtn.style.display = 'inline-flex';
        lockBtn.style.display = 'none';
    }
    
    lucide.createIcons();
}

// ============================================
// NAVIGATION
// ============================================

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
    const navMenu = document.querySelector('.nav-menu');
    if (navMenu) navMenu.classList.toggle('open');
}

// ============================================
// EXAMPLE
// ============================================

function toggleExample() {
    const content = document.getElementById('example-content');
    const icon = document.getElementById('example-toggle-icon');
    if (content) content.classList.toggle('open');
    if (icon) icon.classList.toggle('open');
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
    if (value) {
        value = parseInt(value).toLocaleString('id-ID');
    }
    input.value = value;
}

async function handleSubmit(event) {
    event.preventDefault();

    const btn = document.getElementById('submitBtn');
    btn.disabled = true;
    btn.innerHTML = '<i data-lucide="loader-2" class="spin"></i> Menyimpan...';
    lucide.createIcons();

    try {
        const formData = {
            jenjang: document.getElementById('jenjang').value,
            nama_sekolah: document.getElementById('nama_sekolah').value,
            nama_kepsek: document.getElementById('nama_kepsek').value,
            npsn: document.getElementById('npsn').value,
            alamat_sekolah: document.getElementById('alamat_sekolah').value,
            nama_pic: document.getElementById('nama_pic').value,
            nomor_hp: document.getElementById('nomor_hp').value,
            spp_bulanan: document.getElementById('spp_bulanan').value.replace(/\./g, '')
        };

        // 🔍 CEK NPSN DUPlikat SEBELUM SIMPAN
        const npsn = formData.npsn;
        console.log('Mengecek NPSN:', npsn);
        
        const { data: existingSchools, error: checkError } = await db
            .from('sekolah')
            .select('npsn, nama_sekolah')
            .eq('npsn', npsn);

        if (checkError) {
            console.error('Error saat cek NPSN:', checkError);
        }

        // Jika ada data dengan NPSN yang sama
        if (existingSchools && existingSchools.length > 0) {
            const namaSekolahLama = existingSchools[0].nama_sekolah;
            
            // Tampilkan error dengan nama sekolah yang sudah pakai NPSN ini
            showToast(` NPSN Duplikat! NPSN "${npsn}" sudah digunakan oleh sekolah "${namaSekolahLama}". Silakan gunakan NPSN yang berbeda.`, 'error');
            
            btn.disabled = false;
            btn.innerHTML = '<i data-lucide="save"></i> Simpan & Lanjutkan ke MBG';
            lucide.createIcons();
            return; // Hentikan proses simpan
        }

        // Jika tidak ada duplikat, lanjutkan simpan
        await insertSchool(formData);
        showToast('Data Sekolah berhasil disimpan! Silakan upload Data MBG.', 'success');

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
        showToast('Gagal menyimpan data: ' + error.message, 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i data-lucide="save"></i> Simpan & Lanjutkan ke MBG';
        lucide.createIcons();
    }
}

function resetForm() {
    const form = document.getElementById('schoolForm');
    if (form) form.reset();
}

// ============================================
// MBG FUNCTIONS
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
    console.log('loadSchoolInfo dipanggil...');
    
    const select = document.getElementById('select_npsn_mbg');
    const infoDisplay = document.getElementById('schoolInfoDisplay');
    
    if (!select) {
        console.error('Dropdown sekolah tidak ditemukan di HTML!');
        return;
    }

    const npsn = select.value;

    // Jika tidak ada NPSN yang dipilih, sembunyikan info
    if (!npsn) {
        if (infoDisplay) infoDisplay.style.display = 'none';
        return;
    }

    // Cek apakah database client (db) sudah siap
    if (typeof db === 'undefined') {
        console.error('Database client (db) belum terinisialisasi! Cek file supabaseClient.js.');
        if (infoDisplay) infoDisplay.style.display = 'none';
        return;
    }

    try {
        console.log('Mengambil data sekolah untuk NPSN:', npsn);
        
        const { data: school, error } = await db
            .from('sekolah')
            .select('*')
            .eq('npsn', npsn)
            .single();

        if (error) {
            console.warn('Supabase mengembalikan error:', error.message);
        }

        if (infoDisplay) {
            if (school) {
                // Data ditemukan di database
                document.getElementById('infoNamaSekolah').textContent = school.nama_sekolah || '-';
                document.getElementById('infoJenjang').textContent = school.jenjang || '-';
                document.getElementById('infoKepsek').textContent = school.nama_kepsek || '-';
            } else {
                // Data tidak ditemukan di database, ambil dari teks dropdown
                const selectedOption = select.options[select.selectedIndex];
                const namaDariDropdown = selectedOption ? selectedOption.textContent.split(' - ')[1] : '-';
                
                document.getElementById('infoNamaSekolah').textContent = namaDariDropdown;
                document.getElementById('infoJenjang').textContent = '-';
                document.getElementById('infoKepsek').textContent = '-';
            }
            infoDisplay.style.display = 'block';
        }
    } catch (err) {
        console.error('Gagal memuat info sekolah:', err);
        if (infoDisplay) infoDisplay.style.display = 'none';
    }
}

async function uploadMBGFile() {
    const selectNpsn = document.getElementById('select_npsn_mbg');
    const npsn = selectNpsn ? selectNpsn.value : '';

    if (!npsn) {
        showToast('Pilih sekolah terlebih dahulu!', 'error');
        return;
    }

    if (!selectedFile || (parsedPMData.length === 0 && parsedGuruData.length === 0)) {
        showToast('Tidak ada data untuk diupload', 'error');
        return;
    }

    const btn = document.getElementById('uploadBtn');
    btn.disabled = true;
    btn.innerHTML = '<i data-lucide="loader-2" class="spin"></i> Mengupload...';
    lucide.createIcons();

    try {
        const selectedOption = selectNpsn.options[selectNpsn.selectedIndex];
        const sekolahId = selectedOption.dataset.sekolahId;

        await uploadFileToStorage(selectedFile);

        if (parsedPMData.length > 0) {
            const pmRecords = parsedPMData.map(r => ({
                sekolah_id: parseInt(sekolahId),
                npsn: npsn,
                nik: String(r['NIK (16 Digit)'] || r.NIK || r['NIK'] || ''),
                nisn: String(r['NISN (10 Digit)'] || r.NISN || r['NISN'] || ''),
                nama_lengkap: r['Nama Lengkap'] || r['NAMA LENGKAP'] || '',
                tempat_lahir: r['Tempat Lahir'] || r['TEMPAT LAHIR'] || '',
                tanggal_lahir: parseTanggalLahir(r['Tanggal Lahir'] || r['TANGGAL LAHIR'] || ''),
                jenis_kelamin: r['Jenis Kelamin'] || r['JENIS KELAMIN'] || '',
                nama_orang_tua: r['Nama Orang Tua/Wali'] || r['NAMA ORANG TUA/WALI'] || '',
                kelas: String(r['Kelas'] || r['KELAS'] || ''),
                keterangan: r['Keterangan'] || r['KETERANGAN'] || ''
            }));
            await insertBulkPM(pmRecords);
        }

        if (parsedGuruData.length > 0) {
            const guruRecords = parsedGuruData.map(r => ({
                sekolah_id: parseInt(sekolahId),
                npsn: npsn,
                nik: String(r['NIK (16 Digit)'] || r.NIK || r['NIK'] || ''),
                nama_lengkap: r['Nama Lengkap'] || r['NAMA LENGKAP'] || '',
                tempat_lahir: r['Tempat Lahir'] || r['TEMPAT LAHIR'] || '',
                tanggal_lahir: parseTanggalLahir(r['Tanggal Lahir'] || r['TANGGAL LAHIR'] || ''),
                jenis_kelamin: r['Jenis Kelamin'] || r['JENIS KELAMIN'] || '',
                jabatan: r['Jabatan'] || r['JABATAN'] || '',
                keterangan: r['Keterangan'] || r['KETERANGAN'] || ''
            }));
            await insertBulkGuru(guruRecords);
        }

        showToast(`${parsedPMData.length} PM + ${parsedGuruData.length} Guru/Tendik berhasil disimpan!`, 'success');
        removeFile();
        loadUploadedFiles();
    } catch (error) {
        console.error(error);
        showToast('Gagal upload: ' + error.message, 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i data-lucide="cloud-upload"></i> Upload & Simpan ke Database';
        lucide.createIcons();
    }
}

function parseTanggalLahir(tanggal) {
    if (!tanggal) return null;
    
    if (tanggal instanceof Date) {
        const year = tanggal.getFullYear();
        const month = String(tanggal.getMonth() + 1).padStart(2, '0');
        const day = String(tanggal.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    
    const parts = String(tanggal).split('-');
    if (parts.length === 3) {
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    
    const parts2 = String(tanggal).split('/');
    if (parts2.length === 3) {
        return `${parts2[2]}-${parts2[1]}-${parts2[0]}`;
    }
    
    return tanggal;
}

// ============================================
// UPLOADED FILES
// ============================================

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

        container.innerHTML = files.map(file => `
            <div class="file-item">
                <i data-lucide="file-spreadsheet"></i>
                <div class="file-item-info">
                    <p class="file-item-name">${file.name}</p>
                    <p class="file-item-meta">${formatFileSize(file.metadata?.size || 0)}</p>
                </div>
                <div class="file-item-actions">
                    <a href="${getFileUrl('excels/' + file.name)}" target="_blank" class="btn-icon" title="Download">
                        <i data-lucide="download"></i>
                    </a>
                    <button class="btn-icon" title="Hapus" onclick="deleteUploadedFile('excels/${file.name}')">
                        <i data-lucide="trash-2"></i>
                    </button>
                </div>
            </div>
        `).join('');

        lucide.createIcons();
    } catch (error) {
        container.innerHTML = `<div class="loading-placeholder"><i data-lucide="alert-circle"></i><p>Gagal memuat file</p></div>`;
        lucide.createIcons();
    }
}

async function deleteUploadedFile(path) {
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
// DATA TABLE
// ============================================

function showDataTab(tab, event) {
    if (event) event.preventDefault();
    currentDataTab = tab;
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    if (event && event.target) {
        const tabBtn = event.target.closest('.tab-btn');
        if (tabBtn) tabBtn.classList.add('active');
    }
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

    let data = [];
    let headers = [];
    let renderFn;

    if (currentDataTab === 'sekolah') {
        headers = ['No', 'Jenjang', 'Nama Sekolah', 'Kepala Sekolah', 'NPSN', 'Alamat', 'Nama PIC', 'No. HP', 'SPP', 'Aksi'];
        data = allSekolahData.filter(d => {
            const searchFields = [
                d.nama_sekolah,
                d.nama_kepsek,
                d.npsn,
                d.alamat_sekolah,
                d.nama_pic,
                d.nomor_hp,
                d.jenjang,
                String(d.spp_bulanan)
            ].map(f => String(f || '').toLowerCase());
            
            return searchFields.some(field => field.includes(search));
        });
        renderFn = renderSekolahTable;
    } else if (currentDataTab === 'pm') {
        headers = ['No', 'Sekolah', 'NIK', 'NISN', 'Nama', 'Tempat Lahir', 'Tgl Lahir', 'JK', 'Orang Tua', 'Kelas', 'Aksi'];
        data = allPMData.filter(d => {
            const searchFields = [
                d.nik,
                d.nisn,
                d.nama_lengkap,
                d.tempat_lahir,
                d.tanggal_lahir,
                d.jenis_kelamin,
                d.nama_orang_tua,
                d.kelas,
                d.sekolah?.nama_sekolah
            ].map(f => String(f || '').toLowerCase());
            
            return searchFields.some(field => field.includes(search));
        });
        renderFn = renderPMTable;
    } else {
        headers = ['No', 'Sekolah', 'NIK', 'Nama', 'Tempat Lahir', 'Tgl Lahir', 'JK', 'Jabatan', 'Aksi'];
        data = allGuruData.filter(d => {
            const searchFields = [
                d.nik,
                d.nama_lengkap,
                d.tempat_lahir,
                d.tanggal_lahir,
                d.jenis_kelamin,
                d.jabatan,
                d.sekolah?.nama_sekolah
            ].map(f => String(f || '').toLowerCase());
            
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
        tbody.innerHTML = '<tr><td colspan="' + headers.length + '" class="empty-state"><i data-lucide="inbox"></i><p>Belum ada data</p></td></tr>';
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
        <td>
            <div class="action-btns">
                <button class="btn-icon delete" title="Hapus" onclick="deleteSekolah(${row.id})">
                    <i data-lucide="trash-2"></i>
                </button>
            </div>
        </td>
    `;
}

function renderPMTable(row, idx) {
    const namaSekolah = row.sekolah?.nama_sekolah || '-';
    const nik = renderSensitiveData(row.nik, 'nik', row.id);
    const tglLahir = row.tanggal_lahir ? formatDate(row.tanggal_lahir) : '-';
    
    return `
        <td>${idx + 1}</td>
        <td>${namaSekolah}</td>
        <td>${nik}</td>
        <td>${row.nisn || '-'}</td>
        <td>${row.nama_lengkap}</td>
        <td>${row.tempat_lahir || '-'}</td>
        <td>${tglLahir}</td>
        <td>${row.jenis_kelamin || '-'}</td>
        <td>${row.nama_orang_tua || '-'}</td>
        <td>${row.kelas || '-'}</td>
        <td>
            <div class="action-btns">
                <button class="btn-icon delete" title="Hapus" onclick="deletePMData(${row.id})">
                    <i data-lucide="trash-2"></i>
                </button>
            </div>
        </td>
    `;
}

function renderGuruTable(row, idx) {
    const namaSekolah = row.sekolah?.nama_sekolah || '-';
    const nik = renderSensitiveData(row.nik, 'nik', row.id);
    const tglLahir = row.tanggal_lahir ? formatDate(row.tanggal_lahir) : '-';
    
    return `
        <td>${idx + 1}</td>
        <td>${namaSekolah}</td>
        <td>${nik}</td>
        <td>${row.nama_lengkap}</td>
        <td>${row.tempat_lahir || '-'}</td>
        <td>${tglLahir}</td>
        <td>${row.jenis_kelamin || '-'}</td>
        <td>${row.jabatan || '-'}</td>
        <td>
            <div class="action-btns">
                <button class="btn-icon delete" title="Hapus" onclick="deleteGuruData(${row.id})">
                    <i data-lucide="trash-2"></i>
                </button>
            </div>
        </td>
    `;
}

function formatDate(dateStr) {
    if (!dateStr) return '-';
    const parts = String(dateStr).split('-');
    if (parts.length === 3) {
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return dateStr;
}

async function deleteSekolah(id) {
    if (!confirm('Yakin ingin menghapus data sekolah ini? Data MBG terkait juga akan terhapus!')) return;
    try {
        await deleteSchool(id);
        showToast('Data sekolah berhasil dihapus', 'success');
        loadAllData();
    } catch (error) {
        showToast('Gagal menghapus data', 'error');
    }
}

async function deletePMData(id) {
    if (!confirm('Yakin ingin menghapus data ini?')) return;
    try {
        await deletePM(id);
        showToast('Data PM berhasil dihapus', 'success');
        loadAllData();
    } catch (error) {
        showToast('Gagal menghapus data', 'error');
    }
}

async function deleteGuruData(id) {
    if (!confirm('Yakin ingin menghapus data ini?')) return;
    try {
        await deleteGuru(id);
        showToast('Data Guru berhasil dihapus', 'success');
        loadAllData();
    } catch (error) {
        showToast('Gagal menghapus data', 'error');
    }
}

// ============================================
// EXPORT DATA
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
// TUTORIAL FAQ
// ============================================

function toggleFaq(btn) {
    const answer = btn.nextElementSibling;
    btn.classList.toggle('open');
    answer.classList.toggle('open');
}

// ============================================
// TOAST NOTIFICATION
// ============================================

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const icon = document.getElementById('toastIcon');
    const msg = document.getElementById('toastMessage');

    if (!toast || !icon || !msg) return;

    toast.className = `toast ${type}`;
    msg.textContent = message;
    icon.setAttribute('data-lucide', type === 'success' ? 'check-circle' : 'alert-circle');
    lucide.createIcons();

    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3500);
}

// ============================================
// MODAL
// ============================================

function closeModal(event) {
    if (event && event.target !== event.currentTarget) return;
    const modal = document.getElementById('modal');
    if (modal) modal.classList.remove('show');
}
