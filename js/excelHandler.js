// ============================================
// EXCEL HANDLER
// ============================================

let selectedFile = null;
let parsedPMData = [];
let parsedGuruData = [];

/**
 * Download Template MBG Excel dengan Format Warna (Menggunakan ExcelJS)
 */
async function downloadMBGTemplate() {
    showToast('Sedang membuat template...', 'success');

    // Inisialisasi Workbook ExcelJS
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Portal SPP Gjatian';
    workbook.created = new Date();

    // ============================================
    // SHEET 1: PM (Penerima Manfaat) - HEADER BIRU
    // ============================================
    const wsPM = workbook.addWorksheet('PM (Penerima Manfaat)', {
        properties: { tabColor: { argb: 'FF2563EB' } }
    });

    // Header PM
    const headersPM = [
        'NIK (16 Digit)', 'NISN (10 Digit)', 'NAMA LENGKAP (Sesuai Akta/KTP)', 
        'TEMPAT LAHIR (Kota/Kabupaten)', 'TANGGAL LAHIR (dd-mm-yyyy)', 
        'JENIS KELAMIN (L/P)', 'NAMA ORANG TUA/WALI (Ayah/Ibu/Wali)', 
        'KELAS (Contoh: 1,7,10)', 'KETERANGAN (Opsional)'
    ];
    
    // Tambah Header
    const headerRowPM = wsPM.addRow(headersPM);
    
    // Style Header PM (BIRU)
    headerRowPM.eachCell((cell) => {
        cell.fill = {
            type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } // Biru
        };
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 }; // Putih & Bold
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        cell.border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
    });
    
    // Tinggi baris header
    headerRowPM.height = 30;

    // Data Contoh PM (MERAH & MIRING)
    const contohPM = [
        ['3201010101010001', '0012345678', 'Ahmad Fauzi', 'Jakarta', '01-01-2015', 'L', 'Budi Santoso', '1', 'Hapus baris ini'],
        ['3201010101010002', '0012345679', 'Siti Nurhaliza', 'Bandung', '15-03-2014', 'P', 'Ahmad Dahlan', '2', 'Hapus baris ini'],
    ];

    contohPM.forEach(data => {
        const row = wsPM.addRow(data);
        row.eachCell((cell) => {
            cell.font = { italic: true, color: { argb: 'FFDC2626' }, size: 11 }; // Merah & Miring
            cell.alignment = { vertical: 'middle' };
            cell.border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
        });
    });

    // Lebar Kolom PM
    wsPM.columns = [
        { width: 20 }, { width: 15 }, { width: 30 }, { width: 20 }, 
        { width: 18 }, { width: 15 }, { width: 25 }, { width: 12 }, { width: 20 }
    ];


    // ============================================
    // SHEET 2: Guru & Tendik - HEADER HIJAU
    // ============================================
    const wsGuru = workbook.addWorksheet('Guru & Tendik', {
        properties: { tabColor: { argb: 'FF10B981' } }
    });

    // Header Guru
    const headersGuru = [
        'NIK (16 Digit)', 'NAMA LENGKAP (Sesuai KTP)', 'TEMPAT LAHIR (Kota/Kabupaten)', 
        'TANGGAL LAHIR (dd-mm-yyyy)', 'JENIS KELAMIN (L/P)', 'JABATAN (Guru/Tendik)', 
        'KETERANGAN (Opsional)'
    ];

    // Tambah Header
    const headerRowGuru = wsGuru.addRow(headersGuru);

    // Style Header Guru (HIJAU)
    headerRowGuru.eachCell((cell) => {
        cell.fill = {
            type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF10B981' } // Hijau
        };
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 }; // Putih & Bold
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        cell.border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
    });

    // Tinggi baris header
    headerRowGuru.height = 30;

    // Data Contoh Guru (MERAH & MIRING)
    const contohGuru = [
        ['3201010101010003', 'Drs. H. Ahmad Dahlan, M.Pd', 'Surabaya', '10-05-1975', 'L', 'Kepala Sekolah', 'Hapus baris ini'],
        ['3201010101010004', 'Siti Aminah, M.Pd', 'Bandung', '15-08-1985', 'P', 'Guru', 'Hapus baris ini'],
    ];

    contohGuru.forEach(data => {
        const row = wsGuru.addRow(data);
        row.eachCell((cell) => {
            cell.font = { italic: true, color: { argb: 'FFDC2626' }, size: 11 }; // Merah & Miring
            cell.alignment = { vertical: 'middle' };
            cell.border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
        });
    });

    // Lebar Kolom Guru
    wsGuru.columns = [
        { width: 20 }, { width: 35 }, { width: 20 }, { width: 18 }, 
        { width: 15 }, { width: 20 }, { width: 20 }
    ];

    // ============================================
    // PROSES DOWNLOAD
    // ============================================
    try {
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Template_Data_MBG.xlsx';
        a.click();
        window.URL.revokeObjectURL(url);
        showToast('Template Berwarna berhasil diunduh!', 'success');
    } catch (error) {
        console.error(error);
        showToast('Gagal membuat template', 'error');
    }
}

/**
 * Handle file selection
 */
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) processMBGFile(file);
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
    if (file) processMBGFile(file);
}

/**
 * Process MBG Excel file - supports multiple sheet name formats
 */
function processMBGFile(file) {
    // Validate file type
    const validExts = ['.xlsx', '.xls'];
    const ext = '.' + file.name.split('.').pop().toLowerCase();

    if (!validExts.includes(ext)) {
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
            const workbook = XLSX.read(data, { type: 'array', cellDates: true });

            console.log('Sheet names:', workbook.SheetNames);

            // Find PM sheet (flexible matching)
            let pmSheetName = null;
            for (const name of workbook.SheetNames) {
                const lower = name.toLowerCase();
                if (lower.includes('pm') || lower.includes('penerima') || lower.includes('siswa')) {
                    pmSheetName = name;
                    break;
                }
            }

            // Find Guru sheet (flexible matching)
            let guruSheetName = null;
            for (const name of workbook.SheetNames) {
                const lower = name.toLowerCase();
                if (lower.includes('guru') || lower.includes('tendik')) {
                    guruSheetName = name;
                    break;
                }
            }

            // Parse PM sheet
            if (pmSheetName) {
                const pmSheet = workbook.Sheets[pmSheetName];
                const pmJson = XLSX.utils.sheet_to_json(pmSheet, { raw: false, dateNF: 'dd-mm-yyyy' });
                parsedPMData = pmJson;
                renderPMPreview(pmJson);
                console.log('PM data:', pmJson.length, 'rows');
            } else {
                console.warn('PM sheet not found');
                parsedPMData = [];
            }

            // Parse Guru sheet
            if (guruSheetName) {
                const guruSheet = workbook.Sheets[guruSheetName];
                const guruJson = XLSX.utils.sheet_to_json(guruSheet, { raw: false, dateNF: 'dd-mm-yyyy' });
                parsedGuruData = guruJson;
                renderGuruPreview(guruJson);
                console.log('Guru data:', guruJson.length, 'rows');
            } else {
                console.warn('Guru sheet not found');
                parsedGuruData = [];
            }

            const totalRows = parsedPMData.length + parsedGuruData.length;
            if (totalRows === 0) {
                showToast('File tidak berisi data. Pastikan sheet bernama "PM" dan "Guru & Tendik"', 'error');
            } else {
                showToast(`File berhasil dibaca: ${parsedPMData.length} PM + ${parsedGuruData.length} Guru/Tendik`, 'success');
            }
        } catch (err) {
            console.error('Error parsing Excel:', err);
            showToast('Gagal membaca file Excel: ' + err.message, 'error');
        }
    };
    reader.readAsArrayBuffer(file);
}

/**
 * Render PM Preview
 */
function renderPMPreview(data) {
    const container = document.getElementById('pmPreview');
    const tableContainer = document.getElementById('pmPreviewTable');
    const countEl = document.getElementById('pmCount');

    if (!data || data.length === 0) {
        container.style.display = 'none';
        return;
    }

    container.style.display = 'block';
    countEl.textContent = data.length;

    const headers = Object.keys(data[0]);
    let html = '<table><thead><tr>';
    headers.forEach(h => { html += `<th>${h}</th>`; });
    html += '</tr></thead><tbody>';

    const previewRows = data.slice(0, 10);
    previewRows.forEach(row => {
        html += '<tr>';
        headers.forEach(h => { html += `<td>${row[h] || ''}</td>`; });
        html += '</tr>';
    });

    html += '</tbody></table>';
    if (data.length > 10) {
        html += `<p style="padding:10px;text-align:center;color:var(--text-light);font-size:0.825rem">Menampilkan 10 dari ${data.length} baris</p>`;
    }

    tableContainer.innerHTML = html;
}

/**
 * Render Guru Preview
 */
function renderGuruPreview(data) {
    const container = document.getElementById('guruPreview');
    const tableContainer = document.getElementById('guruPreviewTable');
    const countEl = document.getElementById('guruCount');

    if (!data || data.length === 0) {
        container.style.display = 'none';
        return;
    }

    container.style.display = 'block';
    countEl.textContent = data.length;

    const headers = Object.keys(data[0]);
    let html = '<table><thead><tr>';
    headers.forEach(h => { html += `<th>${h}</th>`; });
    html += '</tr></thead><tbody>';

    const previewRows = data.slice(0, 10);
    previewRows.forEach(row => {
        html += '<tr>';
        headers.forEach(h => { html += `<td>${row[h] || ''}</td>`; });
        html += '</tr>';
    });

    html += '</tbody></table>';
    if (data.length > 10) {
        html += `<p style="padding:10px;text-align:center;color:var(--text-light);font-size:0.825rem">Menampilkan 10 dari ${data.length} baris</p>`;
    }

    tableContainer.innerHTML = html;
}

/**
 * Remove selected file
 */
function removeFile() {
    selectedFile = null;
    parsedPMData = [];
    parsedGuruData = [];
    document.getElementById('filePreview').style.display = 'none';
    document.getElementById('uploadZone').style.display = 'block';
    document.getElementById('fileInput').value = '';
    document.getElementById('pmPreview').style.display = 'none';
    document.getElementById('guruPreview').style.display = 'none';
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
