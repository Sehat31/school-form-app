// ============================================
// MAIN APPLICATION
// ============================================

let allSekolahData = [];
let allPMData = [];
let allGuruData = [];
let currentDataTab = 'sekolah';

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();
    loadSchoolDropdown();
});

// ============================================
// NAVIGATION
// ============================================

function showPage(pageName) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(`page-${pageName}`).classList.add('active');

    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    const activeLink = document.querySelector(`.nav-link[data-page="${pageName}"]`);
    if (activeLink) activeLink.classList.add('active');

    if (pageName === 'data') loadAllData();
    if (pageName === 'mbg') {
        loadSchoolDropdown();
        loadUploadedFiles();
    }

    document.querySelector('.nav-menu')?.classList.remove('open');
    lucide.createIcons();
}

function toggleMobileMenu() {
    document.querySelector('.nav-menu').classList.toggle('open');
}

// ============================================
// EXAMPLE
// ============================================

function toggleExample() {
    const content = document.getElementById('example-content');
    const icon = document.getElementById('example-toggle-icon');
    content.classList.toggle('open');
    icon.classList.toggle('open');
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

        await insertSchool(formData);
        showToast('Data Sekolah berhasil disimpan! Silakan upload Data MBG.', 'success');
        
        // Auto-switch ke halaman MBG
        setTimeout(() => {
            showPage('mbg');
            document.getElementById('select_npsn_mbg').value = formData.npsn;
            loadSchoolInfo();
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
    document.getElementById('schoolForm').reset();
}

// ============================================
// MBG FUNCTIONS
// ============================================

async function loadSchoolDropdown() {
    try {
        const schools = await getAllSchools();
        const select = document.getElementById('select_npsn_mbg');
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

function loadSchoolInfo() {
    const select = document.getElementById('select_npsn_mbg');
    const selectedOption = select.options[select.selectedIndex];
    const npsn = select.value;

    if (!npsn) {
        document.getElementById('schoolInfoDisplay').style.display = 'none';
        return;
    }

    const sekolahId = selectedOption.dataset.sekolahId;
    const namaSekolah = selectedOption.textContent.split(' - ')[1];
    const jenjang = allSekolahData.find(s => s.npsn === npsn)?.jenjang || '-';
    const kepsek = allSekolahData.find(s => s.npsn === npsn)?.nama_kepsek || '-';

    document.getElementById('infoNamaSekolah').textContent = namaSekolah;
    document.getElementById('infoJenjang').textContent = jenjang;
    document.getElementById('infoKepsek').textContent = kepsek;
    document.getElementById('schoolInfoDisplay').style.display = 'block';
}

async function uploadMBGFile() {
    const npsn = document.getElementById('select_npsn_mbg').value;
    
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
        const sekolahId = document.getElementById('select_npsn_mbg').selectedOptions[0].dataset.sekolahId;

        // Upload file to storage
        const fileResult = await uploadFileToStorage(selectedFile);

        // Insert PM data
        if (parsedPMData.length > 0) {
            const pmRecords = parsedPMData.map(r => ({
                sekolah_id: parseInt(sekolahId),
                npsn: npsn,
                nik: String(r['NIK (16 Digit)'] || r.NIK || ''),
                nisn: String(r['NISN (10 Digit)'] || r.NISN || ''),
                nama_lengkap: r['Nama Lengkap'] || '',
                tempat_lahir: r['Tempat Lahir'] || '',
                tanggal_lahir: parseTanggalLahir(r['Tanggal Lahir'] || ''),
                jenis_kelamin: r['Jenis Kelamin'] || '',
                nama_orang_tua: r['Nama Orang Tua/Wali'] || '',
                kelas: String(r['Kelas'] || ''),
                keterangan: r['Keterangan'] || ''
            }));
            await insertBulkPM(pmRecords);
        }

        // Insert Guru data
        if (parsedGuruData.length > 0) {
            const guruRecords = parsedGuruData.map(r => ({
                sekolah_id: parseInt(sekolahId),
                npsn: npsn,
                nik: String(r['NIK (16 Digit)'] || r.NIK || ''),
                nama_lengkap: r['Nama Lengkap'] || '',
                tempat_lahir: r['Tempat Lahir'] || '',
                tanggal_lahir: parseTanggalLahir(r['Tanggal Lahir'] || ''),
                jenis_kelamin: r['Jenis Kelamin'] || '',
                jabatan: r['Jabatan'] || '',
                keterangan: r['Keterangan'] || ''
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
    // Format: dd-mm-yyyy
    const parts = String(tanggal).split('-');
    if (parts.length === 3) {
        return `${parts[2]}-${parts[1]}-${parts[0]}`; // Convert to yyyy-mm-dd
    }
    return tanggal;
}

// ============================================
// UPLOADED FILES
// ============================================

async function loadUploadedFiles() {
    const container = document.getElementById('uploadedFilesList');
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

function showDataTab(tab) {
    currentDataTab = tab;
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    event.target.closest('.tab-btn').classList.add('active');
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
    document.getElementById('totalSekolah').textContent = allSekolahData.length;
    document.getElementById('totalPM').textContent = allPMData.length;
    document.getElementById('totalGuru').textContent = allGuruData.length;
}

function filterData() {
    const search = document.getElementById('searchInput').value.toLowerCase();
    
    let data = [];
    let headers = [];
    let renderFn;

    if (currentDataTab === 'sekolah') {
        headers = ['No', 'Jenjang', 'Nama Sekolah', 'Kepala Sekolah', 'NPSN', 'Alamat', 'Nama PIC', 'No. HP', 'SPP', 'Aksi'];
        data = allSekolahData.filter(d => 
            (d.nama_sekolah || '').toLowerCase().includes(search) ||
            (d.npsn || '').includes(search)
        );
        renderFn = renderSekolahTable;
    } else if (currentDataTab === 'pm') {
        headers = ['No', 'Sekolah', 'NIK', 'NISN', 'Nama', 'Kelas', 'Jenis Kelamin', 'Aksi'];
        data = allPMData.filter(d => 
            (d.nama_lengkap || '').toLowerCase().includes(search) ||
            (d.nisn || '').includes(search)
        );
        renderFn = renderPMTable;
    } else {
        headers = ['No', 'Sekolah', 'NIK', 'Nama', 'Jabatan', 'Jenis Kelamin', 'Aksi'];
        data = allGuruData.filter(d => 
            (d.nama_lengkap || '').toLowerCase().includes(search) ||
            (d.jabatan || '').toLowerCase().includes(search)
        );
        renderFn = renderGuruTable;
    }

    renderTable(headers, data, renderFn);
}

function renderTable(headers, data, renderFn) {
    const thead = document.getElementById('dataTableHead');
    const tbody = document.getElementById('dataTableBody');

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
    return `
        <td>${idx + 1}</td>
        <td><span class="badge">${row.jenjang}</span></td>
        <td><strong>${row.nama_sekolah}</strong></td>
        <td>${row.nama_kepsek || '-'}</td>
        <td><code>${row.npsn}</code></td>
        <td>${row.alamat_sekolah}</td>
        <td>${row.nama_pic}</td>
        <td>${row.nomor_hp}</td>
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
    return `
        <td>${idx + 1}</td>
        <td>${namaSekolah}</td>
        <td><code>${row.nik}</code></td>
        <td>${row.nisn}</td>
        <td>${row.nama_lengkap}</td>
        <td>${row.kelas}</td>
        <td>${row.jenis_kelamin}</td>
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
    return `
        <td>${idx + 1}</td>
        <td>${namaSekolah}</td>
        <td><code>${row.nik}</code></td>
        <td>${row.nama_lengkap}</td>
        <td>${row.jabatan}</td>
        <td>${row.jenis_kelamin}</td>
        <td>
            <div class="action-btns">
                <button class="btn-icon delete" title="Hapus" onclick="deleteGuruData(${row.id})">
                    <i data-lucide="trash-2"></i>
                </button>
            </div>
        </td>
    `;
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
            'Nama': d.nama_lengkap, 'Kelas': d.kelas, 'Jenis Kelamin': d.jenis_kelamin
        }));
        filename = 'Export_Data_PM';
    } else {
        exportData = allGuruData.map((d, i) => ({
            'No': i + 1, 'Sekolah': d.sekolah?.nama_sekolah, 'NIK': d.nik,
            'Nama': d.nama_lengkap, 'Jabatan': d.jabatan, 'Jenis Kelamin': d.jenis_kelamin
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

    toast.className = `toast ${type}`;
    msg.textContent = message;
    icon.setAttribute('data-lucide', type === 'success' ? 'check-circle' : 'alert-circle');
    lucide.createIcons();

    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3500);
}
