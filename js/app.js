// ============================================
// MAIN APPLICATION
// ============================================

let allData = [];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();
});

// ============================================
// NAVIGATION
// ============================================

function showPage(pageName) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    // Show target page
    document.getElementById(`page-${pageName}`).classList.add('active');

    // Update nav links
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    const activeLink = document.querySelector(`.nav-link[data-page="${pageName}"]`);
    if (activeLink) activeLink.classList.add('active');

    // Load data if needed
    if (pageName === 'data') loadData();
    if (pageName === 'upload') loadUploadedFiles();

    // Close mobile menu
    document.querySelector('.nav-menu')?.classList.remove('open');

    lucide.createIcons();
}

function toggleMobileMenu() {
    document.querySelector('.nav-menu').classList.toggle('open');
}

function scrollToSection(sectionId) {
    setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
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
    document.getElementById('npsn').value = '20100123';
    document.getElementById('alamat_sekolah').value = 'Jl. Menteng Raya No. 10, Jakarta Pusat 10310';
    document.getElementById('nama_pic').value = 'Budi Santoso, S.Pd';
    document.getElementById('nomor_hp').value = '081234567890';
    document.getElementById('spp_bulanan').value = '500.000';
    showToast('Form diisi dengan data contoh', 'success');
}

// ============================================
// FORM HANDLING
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
            nama_kepsek: document.getElementById('nama_kepsek').value, // <--- TAMBAHKAN INI
            npsn: document.getElementById('npsn').value,
            alamat_sekolah: document.getElementById('alamat_sekolah').value,
            nama_pic: document.getElementById('nama_pic').value,
            nomor_hp: document.getElementById('nomor_hp').value,
            spp_bulanan: document.getElementById('spp_bulanan').value.replace(/\./g, '')
        };

        await insertSchool(formData);
        showToast('Data berhasil disimpan!', 'success');
        resetForm();
    } catch (error) {
        console.error(error);
        showToast('Gagal menyimpan data: ' + error.message, 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i data-lucide="save"></i> Simpan Data';
        lucide.createIcons();
    }
}

function resetForm() {
    document.getElementById('schoolForm').reset();
}
        // Setelah sukses simpan sekolah, scroll ke bagian Upload MBG
        showToast('Data Sekolah berhasil disimpan! Silakan upload Data MBG.', 'success');
        setTimeout(() => {
            showPage('upload'); // Pindah ke tab Upload
            scrollToSection('mbg-upload-section'); // Scroll ke area MBG
            // Otomatis isi NPSN di dropdown MBG (akan kita buat di step berikutnya)
            document.getElementById('select_npsn_mbg').value = formData.npsn;
        }, 1000);

// ============================================
// UPLOAD FILE
// ============================================

async function uploadFile() {
    if (!selectedFile || parsedExcelData.length === 0) {
        showToast('Tidak ada data untuk diupload', 'error');
        return;
    }

    const btn = document.getElementById('uploadBtn');
    btn.disabled = true;
    btn.innerHTML = '<i data-lucide="loader-2" class="spin"></i> Mengupload...';
    lucide.createIcons();

    try {
        // Upload file to storage
        const fileResult = await uploadFileToStorage(selectedFile);
        console.log('File uploaded:', fileResult);

        // Insert data to database
        await insertBulkSchools(parsedExcelData);

        showToast(`${parsedExcelData.length} data berhasil diupload dan disimpan!`, 'success');
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
            container.innerHTML = `
                <div class="loading-placeholder">
                    <i data-lucide="inbox"></i>
                    <p>Belum ada file yang diupload</p>
                </div>`;
            lucide.createIcons();
            return;
        }

        container.innerHTML = files.map(file => `
            <div class="file-item">
                <i data-lucide="file-spreadsheet"></i>
                <div class="file-item-info">
                    <p class="file-item-name">${file.name}</p>
                    <p class="file-item-meta">
                        ${formatFileSize(file.metadata?.size || 0)} • 
                        ${new Date(file.created_at).toLocaleDateString('id-ID', { 
                            day: 'numeric', month: 'long', year: 'numeric',
                            hour: '2-digit', minute: '2-digit'
                        })}
                    </p>
                </div>
                <div class="file-item-actions">
                    <a href="${getFileUrl('excels/' + file.name)}" target="_blank" 
                       class="btn-icon" title="Download">
                        <i data-lucide="download"></i>
                    </a>
                    <button class="btn-icon" title="Hapus" 
                            onclick="deleteUploadedFile('excels/${file.name}', this)">
                        <i data-lucide="trash-2"></i>
                    </button>
                </div>
            </div>
        `).join('');

        lucide.createIcons();
    } catch (error) {
        container.innerHTML = `
            <div class="loading-placeholder">
                <i data-lucide="alert-circle"></i>
                <p>Gagal memuat file: ${error.message}</p>
            </div>`;
        lucide.createIcons();
    }
}

async function deleteUploadedFile(path, btn) {
    if (!confirm('Yakin ingin menghapus file ini?')) return;

    try {
        await deleteFileFromStorage(path);
        showToast('File berhasil dihapus', 'success');
        loadUploadedFiles();
    } catch (error) {
        showToast('Gagal menghapus file: ' + error.message, 'error');
    }
}

// ============================================
// DATA TABLE
// ============================================

async function loadData() {
    const tbody = document.getElementById('dataTableBody');
    tbody.innerHTML = '<tr><td colspan="9" class="loading-placeholder"><i data-lucide="loader-2" class="spin"></i><p>Memuat data...</p></td></tr>';
    lucide.createIcons();

    try {
        allData = await getAllSchools();
        renderDataTable(allData);
        updateStats(allData);
    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="9" class="empty-state"><i data-lucide="alert-circle"></i><p>Gagal memuat data: ${error.message}</p></td></tr>`;
        lucide.createIcons();
    }
}

function renderDataTable(data) {
    const tbody = document.getElementById('dataTableBody');

    if (!data || data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="empty-state"><i data-lucide="inbox"></i><p>Belum ada data</p></td></tr>';
        lucide.createIcons();
        return;
    }

    tbody.innerHTML = data.map((row, idx) => `
        <tr>
            <td>${idx + 1}</td>
            <td><span class="badge">${row.jenjang}</span></td>
            <td><strong>${row.nama_sekolah}</strong></td>
            <td><code>${row.npsn}</code></td>
            <td>${row.alamat_sekolah}</td>
            <td>${row.nama_pic}</td>
            <td>${row.nomor_hp}</td>
            <td>Rp ${parseInt(row.spp_bulanan).toLocaleString('id-ID')}</td>
            <td>
                <div class="action-btns">
                    <button class="btn-icon edit" title="Edit" onclick="editData(${row.id})">
                        <i data-lucide="pencil"></i>
                    </button>
                    <button class="btn-icon delete" title="Hapus" onclick="deleteData(${row.id})">
                        <i data-lucide="trash-2"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');

    lucide.createIcons();
}

function updateStats(data) {
    document.getElementById('totalSekolah').textContent = data.length;

    const jenjangSet = new Set(data.map(d => d.jenjang));
    document.getElementById('totalJenjang').textContent = jenjangSet.size;

    if (data.length > 0) {
        const totalSPP = data.reduce((sum, d) => sum + (parseInt(d.spp_bulanan) || 0), 0);
        const avg = Math.round(totalSPP / data.length);
        document.getElementById('avgSPP').textContent = 'Rp ' + avg.toLocaleString('id-ID');
    }
}

function filterData() {
    const search = document.getElementById('searchInput').value.toLowerCase();
    const jenjang = document.getElementById('filterJenjang').value;

    let filtered = allData;

    if (jenjang) {
        filtered = filtered.filter(d => d.jenjang === jenjang);
    }

    if (search) {
        filtered = filtered.filter(d =>
            (d.nama_sekolah || '').toLowerCase().includes(search) ||
            (d.npsn || '').includes(search) ||
            (d.nama_pic || '').toLowerCase().includes(search) ||
            (d.alamat_sekolah || '').toLowerCase().includes(search)
        );
    }

    renderDataTable(filtered);
}

// ============================================
// EDIT / DELETE
// ============================================

function editData(id) {
    const row = allData.find(d => d.id === id);
    if (!row) return;

    document.getElementById('modalTitle').textContent = 'Edit Data Sekolah';
    document.getElementById('modalBody').innerHTML = `
        <form id="editForm" onsubmit="saveEdit(event, ${id})">
            <div class="form-grid">
                <div class="form-group">
                    <label>Jenjang</label>
                    <select id="edit_jenjang" required>
                        <option value="TK" ${row.jenjang === 'TK' ? 'selected' : ''}>TK</option>
                        <option value="SD" ${row.jenjang === 'SD' ? 'selected' : ''}>SD</option>
                        <option value="SMP" ${row.jenjang === 'SMP' ? 'selected' : ''}>SMP</option>
                        <option value="SMA" ${row.jenjang === 'SMA' ? 'selected' : ''}>SMA</option>
                        <option value="SMK" ${row.jenjang === 'SMK' ? 'selected' : ''}>SMK</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Nama Sekolah</label>
                    <input type="text" id="edit_nama_sekolah" value="${row.nama_sekolah}" required>
                </div>
                <div class="form-group">
                    <label>NPSN</label>
                    <input type="text" id="edit_npsn" value="${row.npsn}" maxlength="8" required>
                </div>
                <div class="form-group">
                    <label>SPP Bulanan</label>
                    <input type="number" id="edit_spp" value="${row.spp_bulanan}" required>
                </div>
                <div class="form-group">
                    <label>Nama PIC</label>
                    <input type="text" id="edit_nama_pic" value="${row.nama_pic}" required>
                </div>
                <div class="form-group">
                    <label>Nomor HP</label>
                    <input type="text" id="edit_nomor_hp" value="${row.nomor_hp}" required>
                </div>
                <div class="form-group full-width">
                    <label>Alamat</label>
                    <textarea id="edit_alamat" rows="2" required>${row.alamat_sekolah}</textarea>
                </div>
            </div>
            <div class="form-actions">
                <button type="button" class="btn btn-outline" onclick="closeModal()">Batal</button>
                <button type="submit" class="btn btn-primary"><i data-lucide="save"></i> Simpan</button>
            </div>
        </form>
    `;

    document.getElementById('modal').classList.add('show');
    lucide.createIcons();
}

async function saveEdit(event, id) {
    event.preventDefault();

    try {
        await updateSchool(id, {
            jenjang: document.getElementById('edit_jenjang').value,
            nama_sekolah: document.getElementById('edit_nama_sekolah').value,
            npsn: document.getElementById('edit_npsn').value,
            alamat_sekolah: document.getElementById('edit_alamat').value,
            nama_pic: document.getElementById('edit_nama_pic').value,
            nomor_hp: document.getElementById('edit_nomor_hp').value,
            spp_bulanan: document.getElementById('edit_spp').value
        });

        showToast('Data berhasil diperbarui!', 'success');
        closeModal();
        loadData();
    } catch (error) {
        showToast('Gagal memperbarui data: ' + error.message, 'error');
    }
}

async function deleteData(id) {
    if (!confirm('Yakin ingin menghapus data ini?')) return;

    try {
        await deleteSchool(id);
        showToast('Data berhasil dihapus', 'success');
        loadData();
    } catch (error) {
        showToast('Gagal menghapus data: ' + error.message, 'error');
    }
}

function closeModal(event) {
    if (event && event.target !== event.currentTarget) return;
    document.getElementById('modal').classList.remove('show');
}

// ============================================
// EXPORT DATA
// ============================================

function exportData() {
    if (!allData || allData.length === 0) {
        showToast('Tidak ada data untuk diexport', 'error');
        return;
    }

    const exportData = allData.map((d, i) => ({
        'No': i + 1,
        'Jenjang': d.jenjang,
        'Nama Sekolah': d.nama_sekolah,
        'NPSN': d.npsn,
        'Alamat Sekolah': d.alamat_sekolah,
        'Nama PIC': d.nama_pic,
        'Nomor HP PIC': d.nomor_hp,
        'SPP Bulanan': d.spp_bulanan
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Data Sekolah');
    XLSX.writeFile(wb, `Export_Data_Sekolah_${new Date().toISOString().split('T')[0]}.xlsx`);

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
