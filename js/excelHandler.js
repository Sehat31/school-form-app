// ============================================
// EXCEL HANDLER
// ============================================

let selectedFile = null;
let parsedExcelData = [];

/**
 * Download Excel Template
 */
function downloadTemplate() {
    const headers = ['Jenjang', 'Nama Sekolah', 'NPSN', 'Alamat Sekolah', 'Nama PIC', 'Nomor HP PIC', 'SPP Bulanan'];
    
    const exampleData = [
        ['SD', 'SDN 1 Menteng', '20100123', 'Jl. Menteng Raya No. 10, Jakarta Pusat 10310', 'Budi Santoso, S.Pd', '081234567890', 500000],
        ['SMP', 'SMPN 5 Bandung', '20201234', 'Jl. Belitung No. 8, Bandung 40113', 'Siti Aminah, M.Pd', '089876543210', 750000],
        ['SMA', 'SMAN 3 Surabaya', '20501567', 'Jl. Genteng Kali No. 15, Surabaya 60275', 'Ahmad Fauzi', '081112223334', 1000000],
    ];

    const wsData = [headers, ...exampleData];
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Set column widths
    ws['!cols'] = [
        { wch: 10 },  // Jenjang
        { wch: 25 },  // Nama Sekolah
        { wch: 12 },  // NPSN
        { wch: 45 },  // Alamat
        { wch: 22 },  // Nama PIC
        { wch: 18 },  // Nomor HP
        { wch: 15 },  // SPP
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Data Sekolah');

    XLSX.writeFile(wb, 'Template_Data_Sekolah.xlsx');
    showToast('Template berhasil diunduh!', 'success');
}

/**
 * Handle file selection
 */
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) processFile(file);
}

/**
 * Handle drag & drop
 */
function handleDragOver(event) {
    event.preventDefault();
    event.currentTarget.classList.add('dragover');
}

function handleDragLeave(event) {
    event.currentTarget.classList.remove('dragover');
}

function handleDrop(event) {
    event.preventDefault();
    event.currentTarget.classList.remove('dragover');
    const file = event.dataTransfer.files[0];
    if (file) processFile(file);
}

/**
 * Process selected file
 */
function processFile(file) {
    // Validate file type
    const validTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel'
    ];
    const validExts = ['.xlsx', '.xls'];
    const ext = '.' + file.name.split('.').pop().toLowerCase();

    if (!validTypes.includes(file.type) && !validExts.includes(ext)) {
        showToast('Format file tidak didukung! Gunakan .xlsx atau .xls', 'error');
        return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
        showToast('Ukuran file terlalu besar! Maksimal 10MB', 'error');
        return;
    }

    selectedFile = file;

    // Show file info
    document.getElementById('fileName').textContent = file.name;
    document.getElementById('fileSize').textContent = formatFileSize(file.size);
    document.getElementById('filePreview').style.display = 'block';
    document.getElementById('uploadZone').style.display = 'none';

    // Parse Excel
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(firstSheet);

            parsedExcelData = jsonData;
            renderExcelPreview(jsonData);
            showToast(`${jsonData.length} baris data berhasil dibaca`, 'success');
        } catch (err) {
            showToast('Gagal membaca file Excel!', 'error');
            console.error(err);
        }
    };
    reader.readAsArrayBuffer(file);
}

/**
 * Render Excel preview table
 */
function renderExcelPreview(data) {
    const container = document.getElementById('excelPreviewTable');
    
    if (!data || data.length === 0) {
        container.innerHTML = '<p style="padding:16px;text-align:center;color:var(--text-light)">File kosong atau tidak ada data</p>';
        return;
    }

    const headers = Object.keys(data[0]);
    let html = '<table><thead><tr>';
    headers.forEach(h => { html += `<th>${h}</th>`; });
    html += '</tr></thead><tbody>';

    // Show max 20 rows preview
    const previewRows = data.slice(0, 20);
    previewRows.forEach(row => {
        html += '<tr>';
        headers.forEach(h => { html += `<td>${row[h] || ''}</td>`; });
        html += '</tr>';
    });

    html += '</tbody></table>';

    if (data.length > 20) {
        html += `<p style="padding:10px 16px;text-align:center;color:var(--text-light);font-size:0.825rem">
            Menampilkan 20 dari ${data.length} baris
        </p>`;
    }

    container.innerHTML = html;
}

/**
 * Remove selected file
 */
function removeFile() {
    selectedFile = null;
    parsedExcelData = [];
    document.getElementById('filePreview').style.display = 'none';
    document.getElementById('uploadZone').style.display = 'block';
    document.getElementById('fileInput').value = '';
}

/**
 * Format file size
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}