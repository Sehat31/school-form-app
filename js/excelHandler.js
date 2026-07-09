// ============================================
// EXCEL HANDLER
// ============================================

let selectedFile = null;
let parsedPMData = [];
let parsedGuruData = [];

/**
 * Download Template MBG Excel dengan Format Warna (ExcelJS)
 */
async function downloadMBGTemplate() {
    showToast('Sedang membuat template...', 'success');

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Portal SPP Gjatian';
    workbook.created = new Date();

    // ============================================
    // SHEET 1: PM (Penerima Manfaat) - HEADER BIRU
    // ============================================
    const wsPM = workbook.addWorksheet('PM (Penerima Manfaat)', {
        properties: { tabColor: { argb: 'FF2563EB' } }
    });

    const headersPM = [
        'NIK (16 Digit)', 'NISN (10 Digit)', 'NAMA LENGKAP (Sesuai Akta/KTP)', 
        'TEMPAT LAHIR (Kota/Kabupaten)', 'TANGGAL LAHIR (dd-mm-yyyy)', 
        'JENIS KELAMIN (L/P)', 'NAMA ORANG TUA/WALI (Ayah/Ibu/Wali)', 
        'KELAS (Contoh: 1,7,10)', 'KETERANGAN (Opsional)'
    ];
    
    const headerRowPM = wsPM.addRow(headersPM);
    
    headerRowPM.eachCell((cell) => {
        cell.fill = {
            type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' }
        };
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 };
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        cell.border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
    });
    
    headerRowPM.height = 30;

    const contohPM = [
        ['3201010101010001', '0012345678', 'Ahmad Fauzi', 'Jakarta', '01-01-2015', 'L', 'Budi Santoso', '1', 'Hapus baris ini'],
        ['3201010101010002', '0012345679', 'Siti Nurhaliza', 'Bandung', '15-03-2014', 'P', 'Ahmad Dahlan', '2', 'Hapus baris ini'],
    ];

    contohPM.forEach(data => {
        const row = wsPM.addRow(data);
        row.eachCell((cell) => {
            cell.font = { italic: true, color: { argb: 'FFDC2626' }, size: 11 };
            cell.alignment = { vertical: 'middle' };
            cell.border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
        });
    });

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

    const headersGuru = [
        'NIK (16 Digit)', 'NAMA LENGKAP (Sesuai KTP)', 'TEMPAT LAHIR (Kota/Kabupaten)', 
        'TANGGAL LAHIR (dd-mm-yyyy)', 'JENIS KELAMIN (L/P)', 'JABATAN (Guru/Tendik)', 
        'KETERANGAN (Opsional)'
    ];

    const headerRowGuru = wsGuru.addRow(headersGuru);

    headerRowGuru.eachCell((cell) => {
        cell.fill = {
            type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF10B981' }
        };
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 };
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        cell.border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
    });

    headerRowGuru.height = 30;

    const contohGuru = [
        ['3201010101010003', 'Drs. H. Ahmad Dahlan, M.Pd', 'Surabaya', '10-05-1975', 'L', 'Kepala Sekolah', 'Hapus baris ini'],
        ['3201010101010004', 'Siti Aminah, M.Pd', 'Bandung', '15-08-1985', 'P', 'Guru', 'Hapus baris ini'],
    ];

    contohGuru.forEach(data => {
        const row = wsGuru.addRow(data);
        row.eachCell((cell) => {
            cell.font = { italic: true, color: { argb: 'FFDC2626' }, size: 11 };
            cell.alignment = { vertical: 'middle' };
            cell.border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
        });
    });

    wsGuru.columns = [
        { width: 20 }, { width: 35 }, { width: 20 }, { width: 18 }, 
        { width: 15 }, { width: 20 }, { width: 20 }
    ];

    // ============================================
    // DOWNLOAD
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
 * Process MBG Excel file dengan validasi NIK LENGKAP
 */
function processMBGFile(file) {
    const validExts = ['.xlsx', '.xls'];
    const ext = '.' + file.name.split('.').pop().toLowerCase();

    if (!validExts.includes(ext)) {
        showToast('Format file tidak didukung! Gunakan .xlsx atau .xls', 'error');
        return;
    }

    if (file.size > 10 * 1024 * 1024) {
        showToast('Ukuran file terlalu besar! Maksimal 10MB', 'error');
        return;
    }

    selectedFile = file;

    document.getElementById('fileName').textContent = file.name;
    document.getElementById('fileSize').textContent = formatFileSize(file.size);
    document.getElementById('filePreview').style.display = 'block';
    document.getElementById('uploadZone').style.display = 'none';

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array', cellDates: true });

            console.log('Sheet names:', workbook.SheetNames);

            let pmSheetName = null;
            for (const name of workbook.SheetNames) {
                const lower = name.toLowerCase();
                if (lower.includes('pm') || lower.includes('penerima') || lower.includes('siswa')) {
                    pmSheetName = name;
                    break;
                }
            }

            let guruSheetName = null;
            for (const name of workbook.SheetNames) {
                const lower = name.toLowerCase();
                if (lower.includes('guru') || lower.includes('tendik')) {
                    guruSheetName = name;
                    break;
                }
            }

            let invalidNIKCount = 0;
            let invalidNIKList = [];

            // --- PARSE PM (SISWA) ---
            if (pmSheetName) {
                const pmSheet = workbook.Sheets[pmSheetName];
                const pmJson = XLSX.utils.sheet_to_json(pmSheet, { raw: false, dateNF: 'dd-mm-yyyy' });
                
                // VALIDASI NIK PM
                pmJson.forEach((row, index) => {
                    const nik = row['NIK (16 Digit)'] || row['NIK'] || '';
                    const result = validateNIK(nik);
                    if (!result.valid) {
                        invalidNIKCount++;
                        if (invalidNIKList.length < 10) {
                            invalidNIKList.push(`Baris ${index + 2} (PM): NIK "${nik}" - ${result.message}`);
                        }
                    }
                });
                
                parsedPMData = pmJson;
                renderPMPreview(pmJson);
                console.log('PM data:', pmJson.length, 'rows');
            } else {
                console.warn('PM sheet not found');
                parsedPMData = [];
            }

            // --- PARSE GURU & TENDIK ---
            if (guruSheetName) {
                const guruSheet = workbook.Sheets[guruSheetName];
                const guruJson = XLSX.utils.sheet_to_json(guruSheet, { raw: false, dateNF: 'dd-mm-yyyy' });
                
                // VALIDASI NIK GURU
                guruJson.forEach((row, index) => {
                    const nik = row['NIK (16 Digit)'] || row['NIK'] || '';
                    const result = validateNIK(nik);
                    if (!result.valid) {
                        invalidNIKCount++;
                        if (invalidNIKList.length < 10) {
                            invalidNIKList.push(`Baris ${index + 2} (Guru): NIK "${nik}" - ${result.message}`);
                        }
                    }
                });

                parsedGuruData = guruJson;
                renderGuruPreview(guruJson);
                console.log('Guru data:', guruJson.length, 'rows');
            } else {
                console.warn('Guru sheet not found');
                parsedGuruData = [];
            }

            // --- HASIL VALIDASI ---
            if (invalidNIKCount > 0) {
                let errorMsg = `⚠️ DITEMUKAN ${invalidNIKCount} NIK TIDAK VALID!\n\n`;
                errorMsg += invalidNIKList.join('\n');
                if (invalidNIKCount > 10) errorMsg += `\n...dan ${invalidNIKCount - 10} NIK lainnya.`;
                errorMsg += `\n\nSilakan perbaiki file Excel dan upload ulang.`;
                
                showToast(errorMsg, 'error');
                console.warn('NIK tidak valid:', invalidNIKList);
                
                // Tampilkan alert tambahan untuk memastikan user melihat
                setTimeout(() => {
                    alert(`⚠️ PERINGATAN!\n\nDitemukan ${invalidNIKCount} NIK tidak valid.\n\nSilakan perbaiki file Excel Anda sebelum melanjutkan upload.`);
                }, 500);
            } else {
                const totalRows = parsedPMData.length + parsedGuruData.length;
                showToast(`✅ File valid! ${parsedPMData.length} PM + ${parsedGuruData.length} Guru siap diupload.`, 'success');
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

/**
 * Validasi Format NIK Indonesia - LENGKAP DENGAN DETEKSI POLA ANEH
 * @param {string|number} nik - Nomor NIK yang akan divalidasi
 * @returns {object} - { valid: boolean, message: string, gender: string }
 */
function validateNIK(nik) {
    const str = String(nik).trim();

    // 1. Harus tepat 16 digit angka
    if (!/^\d{16}$/.test(str)) {
        return { valid: false, message: "Harus tepat 16 digit angka (bukan huruf/spasi)", gender: '-' };
    }

    // 2. Tidak boleh semua digit sama (0000000000000000, 1111111111111111, dst)
    if (/^(.)\1{15}$/.test(str)) {
        return { valid: false, message: "Semua digit tidak boleh sama (contoh: 0000000000000000)", gender: '-' };
    }

    // 3. Deteksi pola berulang (9090909090909090, 1212121212121212, dst)
    const pola2Digit = str.substring(0, 2);
    if (str === pola2Digit.repeat(8)) {
        return { valid: false, message: `NIK pola berulang terdeteksi (${str}) - kemungkinan NIK palsu`, gender: '-' };
    }

    // 4. Deteksi NIK berurutan (1234567890123456, 9876543210987654, dst)
    if (/^1234567890123456$/.test(str) || /^9876543210987654$/.test(str)) {
        return { valid: false, message: "NIK berurutan terdeteksi - bukan NIK asli", gender: '-' };
    }

    // 5. Ekstrak Tanggal Lahir (Digit ke-7 sampai 12: DD MM YY)
    let dd = parseInt(str.substring(6, 8));
    const mm = parseInt(str.substring(8, 10));
    const yy = parseInt(str.substring(10, 12));

    // Aturan NIK Perempuan: Tanggal lahir + 40
    let isFemale = false;
    if (dd > 40) {
        dd -= 40;
        isFemale = true;
    }

    // 6. Validasi Bulan (1-12)
    if (mm < 1 || mm > 12) {
        return { valid: false, message: `Bulan tidak valid (${mm}) - harus 01-12`, gender: '-' };
    }

    // 7. Validasi Tanggal (Cek apakah tanggal benar-benar ada)
    const date = new Date(1900 + yy, mm - 1, dd);
    if (date.getFullYear() % 100 !== yy || date.getMonth() + 1 !== mm || date.getDate() !== dd) {
        return { valid: false, message: `Tanggal lahir tidak valid (${dd}-${mm}-${yy})`, gender: '-' };
    }

    // 8. Deteksi NIK dengan banyak angka 9 (9999999999999999 sudah dicek di step 2, tapi cek pola lain)
    const count9 = (str.match(/9/g) || []).length;
    if (count9 >= 12) {
        return { valid: false, message: `NIK mengandung terlalu banyak angka 9 (${count9}x) - kemungkinan NIK palsu`, gender: '-' };
    }

    // 9. Deteksi NIK dengan banyak angka 0
    const count0 = (str.match(/0/g) || []).length;
    if (count0 >= 12) {
        return { valid: false, message: `NIK mengandung terlalu banyak angka 0 (${count0}x) - kemungkinan NIK palsu`, gender: '-' };
    }

    // Jika lolos semua
    return { 
        valid: true, 
        message: "Valid", 
        gender: isFemale ? 'P' : 'L' 
    };
}
