// ============================================
// EXCEL HANDLER - PENERJEMAH FILE EXCEL
// ============================================
let selectedFile = null;
let parsedPMData = [];
let parsedGuruData = [];

// Header Template yang WAJIB (Exact Match)
const EXPECTED_PM_HEADERS = [
    'NIK (16 Digit)',
    'NISN (10 Digit)',
    'NAMA LENGKAP (Sesuai Akta/KTP)',
    'TEMPAT LAHIR (Kota/Kabupaten)',
    'TANGGAL LAHIR (dd-mm-yyyy)',
    'JENIS KELAMIN (L/P)',
    'NAMA ORANG TUA/WALI (Ayah/Ibu/Wali)',
    'KELAS (Contoh: 1,7,10)',
    'KETERANGAN (Opsional)'
];

const EXPECTED_GURU_HEADERS = [
    'NIK (16 Digit)',
    'NAMA LENGKAP (Sesuai KTP)',
    'TEMPAT LAHIR (Kota/Kabupaten)',
    'TANGGAL LAHIR (dd-mm-yyyy)',
    'JENIS KELAMIN (L/P)',
    'JABATAN (Guru/Tendik)',
    'KETERANGAN (Opsional)'
];

// Konstanta Validasi
const MAX_ROWS_PER_SHEET = 500; // Maksimal 500 baris per sheet
const MIN_AGE_YEARS = 3;        // Usia minimal 3 tahun (TK)
const MAX_AGE_YEARS = 80;       // Usia maksimal 80 tahun (Guru senior)

/**
 * Download Template MBG Excel dengan Format Warna (ExcelJS)
 */
async function downloadMBGTemplate() {
    showToast('Sedang membuat template...', 'success');

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Portal SPPG Jatian';
    workbook.created = new Date();

    // ============================================
    // SHEET 1: PM (Penerima Manfaat) - HEADER BIRU
    // ============================================
    const wsPM = workbook.addWorksheet('PM (Penerima Manfaat)', {
        properties: { tabColor: { argb: 'FF2563EB' } }
    });

    const headerRowPM = wsPM.addRow(EXPECTED_PM_HEADERS);
    headerRowPM.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } };
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
        { width: 18 }, { width: 15 }, { width: 25 }, { width: 15 }, { width: 20 }
    ];

    // ============================================
    // SHEET 2: Guru & Tendik - HEADER HIJAU
    // ============================================
    const wsGuru = workbook.addWorksheet('Guru & Tendik', {
        properties: { tabColor: { argb: 'FF10B981' } }
    });

    const headerRowGuru = wsGuru.addRow(EXPECTED_GURU_HEADERS);
    headerRowGuru.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF10B981' } };
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
        showToast('✅ Template berhasil diunduh!', 'success');
    } catch (error) {
        console.error(error);
        showToast('❌ Gagal membuat template', 'error');
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
 * Validasi Header Excel
 */
function validateHeaders(actualHeaders, expectedHeaders, sheetName) {
    const missingOrWrong = expectedHeaders.filter(exp => !actualHeaders.includes(exp));
    if (missingOrWrong.length > 0) {
        return {
            valid: false,
            message: `Header tidak sesuai di sheet "${sheetName}"!\n\nKolom yang hilang/salah:\n• ${missingOrWrong.join('\n• ')}\n\n⚠️ JANGAN ubah nama header template. Download ulang template jika perlu.`
        };
    }
    return { valid: true };
}

/**
 * Validasi Kolom KELAS (Harus Angka 0-13)
 */
function validateKelas(kelasValue, rowIndex) {
    if (kelasValue === undefined || kelasValue === null || String(kelasValue).trim() === '' || String(kelasValue).trim() === '-') {
        return { valid: false, message: `Baris ${rowIndex}: Kolom KELAS kosong atau berisi "-"` };
    }
    
    const kelasStr = String(kelasValue).trim();
    const kelasNum = parseInt(kelasStr);
    
    if (isNaN(kelasNum)) {
        return { valid: false, message: `Baris ${rowIndex}: KELAS "${kelasStr}" bukan angka. Harus angka 0-13` };
    }
    
    if (kelasNum < 0 || kelasNum > 13) {
        return { valid: false, message: `Baris ${rowIndex}: KELAS "${kelasNum}" di luar range. Harus angka 0-13 (TK=0, SD=1-6, dst)` };
    }
    
    return { valid: true, value: kelasNum };
}

/**
 * Validasi Baris Contoh (Harus Dihapus Sebelum Upload)
 */
function validateExampleRows(row, rowIndex, sheetName) {
    const namaLengkap = String(row['NAMA LENGKAP (Sesuai Akta/KTP)'] || row['NAMA LENGKAP (Sesuai KTP)'] || '').toLowerCase().trim();
    const nik = String(row['NIK (16 Digit)'] || '').trim();
    
    // Daftar nama contoh yang ada di template
    const contohNames = [
        'ahmad fauzi',
        'siti nurhaliza',
        'drs. h. ahmad dahlan, m.pd',
        'siti aminah, m.pd'
    ];
    
    // Daftar NIK contoh yang ada di template
    const contohNIKs = [
        '3201010101010001',
        '3201010101010002',
        '3201010101010003',
        '3201010101010004'
    ];
    
    // Cek apakah nama ada di daftar contoh
    if (contohNames.some(name => namaLengkap.includes(name))) {
        return {
            valid: false,
            message: `Baris ${rowIndex}: Terdeteksi baris contoh dengan nama "${namaLengkap}". **WAJIB HAPUS BARIS CONTOH** sebelum upload!`
        };
    }
    
    // Cek apakah NIK ada di daftar contoh
    if (contohNIKs.includes(nik)) {
        return {
            valid: false,
            message: `Baris ${rowIndex}: Terdeteksi baris contoh dengan NIK ${nik}. **WAJIB HAPUS BARIS CONTOH** sebelum upload!`
        };
    }
    
    return { valid: true };
}

/**
 * Validasi NIK - WAJIB ISI
 */
function validateNIKWajib(nik, rowIndex) {
    const str = String(nik || '').trim();
    if (!str || str === '') {
        return { valid: false, message: `Baris ${rowIndex}: NIK tidak boleh kosong!` };
    }
    return { valid: true, value: str };
}

/**
 * Validasi NISN (10 digit angka, boleh kosong tapi jika ada harus valid)
 */
function validateNISN(nisn, rowIndex) {
    const str = String(nisn || '').trim();
    if (!str) {
        return { valid: true, value: '' }; // NISN boleh kosong
    }
    if (!/^\d{10}$/.test(str)) {
        return { valid: false, message: `Baris ${rowIndex}: NISN "${str}" tidak valid. Harus 10 digit angka` };
    }
    return { valid: true, value: str };
}

/**
 * Validasi Nama Lengkap - WAJIB ISI
 */
function validateNamaLengkap(nama, rowIndex, sheet) {
    const str = String(nama || '').trim();
    if (!str || str.length < 2) {
        return { valid: false, message: `Baris ${rowIndex}: Nama Lengkap di sheet ${sheet} kosong atau terlalu pendek (min. 2 karakter)` };
    }
    return { valid: true, value: str };
}

/**
 * Validasi Jenis Kelamin - WAJIB 'L' atau 'P'
 */
function validateJenisKelamin(jk, rowIndex) {
    const str = String(jk || '').trim().toUpperCase();
    if (!str) {
        return { valid: false, message: `Baris ${rowIndex}: Jenis Kelamin kosong. Harus 'L' atau 'P'` };
    }
    if (str !== 'L' && str !== 'P') {
        return { valid: false, message: `Baris ${rowIndex}: Jenis Kelamin "${str}" tidak valid. Harus 'L' (Laki-laki) atau 'P' (Perempuan)` };
    }
    return { valid: true, value: str };
}

/**
 * Validasi Tanggal Lahir
 */
function validateTanggalLahir(tanggal, rowIndex) {
    if (!tanggal) {
        return { valid: false, message: `Baris ${rowIndex}: Tanggal Lahir kosong` };
    }
    
    const date = parseTanggalLahirForValidation(tanggal);
    if (!date) {
        return { valid: false, message: `Baris ${rowIndex}: Format Tanggal Lahir tidak valid. Gunakan format dd-mm-yyyy` };
    }
    
    const today = new Date();
    const birthDate = new Date(date);
    
    // Cek tidak di masa depan
    if (birthDate > today) {
        return { valid: false, message: `Baris ${rowIndex}: Tanggal Lahir tidak boleh di masa depan` };
    }
    
    // Cek usia wajar
    const age = today.getFullYear() - birthDate.getFullYear();
    if (age < MIN_AGE_YEARS) {
        return { valid: false, message: `Baris ${rowIndex}: Usia terlalu muda (${age} tahun). Minimal ${MIN_AGE_YEARS} tahun` };
    }
    if (age > MAX_AGE_YEARS) {
        return { valid: false, message: `Baris ${rowIndex}: Usia terlalu tua (${age} tahun). Maksimal ${MAX_AGE_YEARS} tahun` };
    }
    
    return { valid: true, value: date };
}

/**
 * Parse Tanggal Lahir untuk Validasi
 */
function parseTanggalLahirForValidation(tanggal) {
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
            return null;
        }
        
        return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
    
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
        return str;
    }
    
    return null;
}

/**
 * Process MBG Excel file dengan validasi LENGKAP
 */
function processMBGFile(file) {
    const validExts = ['.xlsx', '.xls'];
    const ext = '.' + file.name.split('.').pop().toLowerCase();

    if (!validExts.includes(ext)) {
        showToast('❌ Format file tidak didukung!\nGunakan file .xlsx atau .xls', 'error');
        return;
    }

    if (file.size === 0) {
        showToast('❌ File kosong (0 byte)!\nFile tidak valid', 'error');
        return;
    }

    if (file.size > 10 * 1024 * 1024) {
        showToast('❌ Ukuran file terlalu besar!\nMaksimal 10 MB', 'error');
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

            let pmSheetName = null;
            for (const name of workbook.SheetNames) {
                const lower = name.toLowerCase();
                if (lower.includes('pm') || lower.includes('penerima') || lower.includes('siswa')) {
                    pmSheetName = name; break;
                }
            }

            let guruSheetName = null;
            for (const name of workbook.SheetNames) {
                const lower = name.toLowerCase();
                if (lower.includes('guru') || lower.includes('tendik')) {
                    guruSheetName = name; break;
                }
            }

            let validationErrors = [];
            let allNIKsInFile = []; // Untuk cek duplikat antar sheet

            // --- PARSE & VALIDASI PM (SISWA) ---
            if (pmSheetName) {
                const pmSheet = workbook.Sheets[pmSheetName];
                const pmJson = XLSX.utils.sheet_to_json(pmSheet, { defval: "", dateNF: 'dd-mm-yyyy' });
                
                // Cek jumlah baris
                if (pmJson.length > MAX_ROWS_PER_SHEET) {
                    validationErrors.push(`❌ Sheet PM memiliki ${pmJson.length} baris. Maksimal ${MAX_ROWS_PER_SHEET} baris per sheet!`);
                }
                
                if (pmJson.length > 0) {
                    const actualHeaders = Object.keys(pmJson[0]);
                    const headerCheck = validateHeaders(actualHeaders, EXPECTED_PM_HEADERS, pmSheetName);
                    if (!headerCheck.valid) {
                        validationErrors.push(headerCheck.message);
                    } else {
                        let invalidNIKCount = 0;
                        let invalidNIKList = [];
                        let allNIKs = [];
                        let nisnList = []; // Untuk cek duplikat NISN

                        pmJson.forEach((row, index) => {
                            const rowIndex = index + 2;
                            
                            // Validasi Baris Contoh
                            const exampleCheck = validateExampleRows(row, rowIndex, pmSheetName);
                            if (!exampleCheck.valid) {
                                validationErrors.push(exampleCheck.message);
                            }
                            
                            // Validasi NIK - WAJIB
                            const nikCheck = validateNIKWajib(row['NIK (16 Digit)'], rowIndex);
                            if (!nikCheck.valid) {
                                validationErrors.push(nikCheck.message);
                            } else {
                                const nik = nikCheck.value;
                                allNIKs.push({ nik, sheet: 'PM', row: rowIndex });
                                allNIKsInFile.push({ nik, sheet: 'PM', row: rowIndex });
                                const result = validateNIK(nik);
                                if (!result.valid) {
                                    invalidNIKCount++;
                                    if (invalidNIKList.length < 5) {
                                        invalidNIKList.push(`Baris ${rowIndex}: ${nik} - ${result.message}`);
                                    }
                                }
                            }
                            
                            // Validasi NISN
                            const nisnCheck = validateNISN(row['NISN (10 Digit)'], rowIndex);
                            if (!nisnCheck.valid) {
                                validationErrors.push(nisnCheck.message);
                            } else if (nisnCheck.value) {
                                nisnList.push({ nisn: nisnCheck.value, row: rowIndex });
                            }
                            
                            // Validasi Nama Lengkap
                            const namaCheck = validateNamaLengkap(row['NAMA LENGKAP (Sesuai Akta/KTP)'], rowIndex, 'PM');
                            if (!namaCheck.valid) {
                                validationErrors.push(namaCheck.message);
                            }
                            
                            // Validasi Jenis Kelamin
                            const jkCheck = validateJenisKelamin(row['JENIS KELAMIN (L/P)'], rowIndex);
                            if (!jkCheck.valid) {
                                validationErrors.push(jkCheck.message);
                            }
                            
                            // Validasi Tanggal Lahir
                            const tglCheck = validateTanggalLahir(row['TANGGAL LAHIR (dd-mm-yyyy)'], rowIndex);
                            if (!tglCheck.valid) {
                                validationErrors.push(tglCheck.message);
                            }
                            
                            // Validasi KELAS
                            const kelasCheck = validateKelas(row['KELAS (Contoh: 1,7,10)'], rowIndex);
                            if (!kelasCheck.valid) {
                                validationErrors.push(kelasCheck.message);
                            } else {
                                row['KELAS (Contoh: 1,7,10)'] = String(kelasCheck.value);
                            }
                        });

                        // Cek Duplikat NIK dalam sheet PM
                        const nikCount = {};
                        allNIKs.forEach(item => { nikCount[item.nik] = (nikCount[item.nik] || 0) + 1; });
                        
                        const duplicateNIKList = [];
                        allNIKs.forEach(item => {
                            if (nikCount[item.nik] > 1) {
                                const isDuplicate = duplicateNIKList.find(d => d.nik === item.nik);
                                if (!isDuplicate) {
                                    duplicateNIKList.push({
                                        nik: item.nik,
                                        count: nikCount[item.nik],
                                        locations: allNIKs.filter(d => d.nik === item.nik).map(d => `Baris ${d.row}`)
                                    });
                                }
                            }
                        });

                        // Cek Duplikat NISN dalam sheet PM
                        const nisnCount = {};
                        nisnList.forEach(item => { nisnCount[item.nisn] = (nisnCount[item.nisn] || 0) + 1; });
                        
                        const duplicateNISNList = [];
                        nisnList.forEach(item => {
                            if (nisnCount[item.nisn] > 1) {
                                const isDuplicate = duplicateNISNList.find(d => d.nisn === item.nisn);
                                if (!isDuplicate) {
                                    duplicateNISNList.push({
                                        nisn: item.nisn,
                                        count: nisnCount[item.nisn],
                                        rows: nisnList.filter(d => d.nisn === item.nisn).map(d => d.row)
                                    });
                                }
                            }
                        });

                        if (invalidNIKCount > 0) {
                            validationErrors.push(`❌ ${invalidNIKCount} NIK tidak valid di sheet PM.\nContoh: ${invalidNIKList.slice(0, 2).join('\n')}`);
                        }
                        if (duplicateNIKList.length > 0) {
                            validationErrors.push(`❌ ${duplicateNIKList.length} NIK duplikat di sheet PM.\nContoh: ${duplicateNIKList.slice(0, 2).map(d => `${d.nik} (${d.count}x di baris ${d.locations.join(', ')})`).join('\n')}`);
                        }
                        if (duplicateNISNList.length > 0) {
                            validationErrors.push(`❌ ${duplicateNISNList.length} NISN duplikat di sheet PM.\nContoh: ${duplicateNISNList.slice(0, 2).map(d => `${d.nisn} (${d.count}x di baris ${d.rows.join(', ')})`).join('\n')}`);
                        }
                    }
                }
                parsedPMData = pmJson;
                renderPMPreview(pmJson);
            } else {
                parsedPMData = [];
            }

            // --- PARSE & VALIDASI GURU & TENDIK ---
            if (guruSheetName) {
                const guruSheet = workbook.Sheets[guruSheetName];
                const guruJson = XLSX.utils.sheet_to_json(guruSheet, { defval: "", dateNF: 'dd-mm-yyyy' });
                
                // Cek jumlah baris
                if (guruJson.length > MAX_ROWS_PER_SHEET) {
                    validationErrors.push(`❌ Sheet Guru memiliki ${guruJson.length} baris. Maksimal ${MAX_ROWS_PER_SHEET} baris per sheet!`);
                }
                
                if (guruJson.length > 0) {
                    const actualHeaders = Object.keys(guruJson[0]);
                    const headerCheck = validateHeaders(actualHeaders, EXPECTED_GURU_HEADERS, guruSheetName);
                    if (!headerCheck.valid) {
                        validationErrors.push(headerCheck.message);
                    } else {
                        let invalidNIKCount = 0;
                        let invalidNIKList = [];
                        let allNIKs = [];

                        guruJson.forEach((row, index) => {
                            const rowIndex = index + 2;
                            
                            // Validasi Baris Contoh
                            const exampleCheck = validateExampleRows(row, rowIndex, guruSheetName);
                            if (!exampleCheck.valid) {
                                validationErrors.push(exampleCheck.message);
                            }
                            
                            // Validasi NIK - WAJIB
                            const nikCheck = validateNIKWajib(row['NIK (16 Digit)'], rowIndex);
                            if (!nikCheck.valid) {
                                validationErrors.push(nikCheck.message);
                            } else {
                                const nik = nikCheck.value;
                                allNIKs.push({ nik, sheet: 'Guru', row: rowIndex });
                                allNIKsInFile.push({ nik, sheet: 'Guru', row: rowIndex });
                                const result = validateNIK(nik);
                                if (!result.valid) {
                                    invalidNIKCount++;
                                    if (invalidNIKList.length < 5) {
                                        invalidNIKList.push(`Baris ${rowIndex}: ${nik} - ${result.message}`);
                                    }
                                }
                            }
                            
                            // Validasi Nama Lengkap
                            const namaCheck = validateNamaLengkap(row['NAMA LENGKAP (Sesuai KTP)'], rowIndex, 'Guru');
                            if (!namaCheck.valid) {
                                validationErrors.push(namaCheck.message);
                            }
                            
                            // Validasi Jenis Kelamin
                            const jkCheck = validateJenisKelamin(row['JENIS KELAMIN (L/P)'], rowIndex);
                            if (!jkCheck.valid) {
                                validationErrors.push(jkCheck.message);
                            }
                            
                            // Validasi Tanggal Lahir
                            const tglCheck = validateTanggalLahir(row['TANGGAL LAHIR (dd-mm-yyyy)'], rowIndex);
                            if (!tglCheck.valid) {
                                validationErrors.push(tglCheck.message);
                            }
                        });

                        // Cek Duplikat NIK dalam sheet Guru
                        const nikCount = {};
                        allNIKs.forEach(item => { nikCount[item.nik] = (nikCount[item.nik] || 0) + 1; });
                        
                        const duplicateNIKList = [];
                        allNIKs.forEach(item => {
                            if (nikCount[item.nik] > 1) {
                                const isDuplicate = duplicateNIKList.find(d => d.nik === item.nik);
                                if (!isDuplicate) {
                                    duplicateNIKList.push({
                                        nik: item.nik,
                                        count: nikCount[item.nik],
                                        locations: allNIKs.filter(d => d.nik === item.nik).map(d => `Baris ${d.row}`)
                                    });
                                }
                            }
                        });

                        if (invalidNIKCount > 0) {
                            validationErrors.push(` ${invalidNIKCount} NIK tidak valid di sheet Guru.\nContoh: ${invalidNIKList.slice(0, 2).join('\n')}`);
                        }
                        if (duplicateNIKList.length > 0) {
                            validationErrors.push(`❌ ${duplicateNIKList.length} NIK duplikat di sheet Guru.\nContoh: ${duplicateNIKList.slice(0, 2).map(d => `${d.nik} (${d.count}x di baris ${d.locations.join(', ')})`).join('\n')}`);
                        }
                    }
                }
                parsedGuruData = guruJson;
                renderGuruPreview(guruJson);
            } else {
                parsedGuruData = [];
            }

            // --- CEK DUPLIKAT NIK ANTAR SHEET (PM vs Guru) ---
            const nikBySheet = {};
            allNIKsInFile.forEach(item => {
                if (!nikBySheet[item.nik]) nikBySheet[item.nik] = [];
                nikBySheet[item.nik].push(item);
            });
            
            const crossSheetDuplicates = [];
            Object.keys(nikBySheet).forEach(nik => {
                const sheets = nikBySheet[nik].map(item => item.sheet);
                const uniqueSheets = [...new Set(sheets)];
                if (uniqueSheets.length > 1) {
                    crossSheetDuplicates.push({
                        nik: nik,
                        locations: nikBySheet[nik].map(item => `${item.sheet} Baris ${item.row}`)
                    });
                }
            });
            
            if (crossSheetDuplicates.length > 0) {
                validationErrors.push(`❌ ${crossSheetDuplicates.length} NIK ditemukan di 2 sheet (PM & Guru).\nContoh: ${crossSheetDuplicates.slice(0, 2).map(d => `${d.nik} di ${d.locations.join(' & ')}`).join('\n')}`);
            }

            // --- HASIL VALIDASI AKHIR ---
            if (validationErrors.length > 0) {
                let toastMessage = '️ UPLOAD DITOLAK!\n\nFile tidak valid. Mohon perbaiki:\n\n';
                toastMessage += validationErrors.slice(0, 4).join('\n\n');
                
                if (validationErrors.length > 4) {
                    toastMessage += `\n\n...dan ${validationErrors.length - 4} error lainnya.`;
                }
                
                toastMessage += '\n\n Baca terlebih dahulu Papan "PERHATIAN" yang tersedia pada halaman ini. Pastikan header tidak diubah, baris contoh sudah dihapus, dan seluruh data memenuhi ketentuan validasi.';
                
                showToast(toastMessage, 'error');
                
                parsedPMData = [];
                parsedGuruData = [];
                selectedFile = null;
                removeFile();
                return;
            } else {
                const totalRows = parsedPMData.length + parsedGuruData.length;
                if (totalRows === 0) {
                    showToast(' File kosong!\nPastikan sheet berisi data (hapus baris contoh jika perlu)', 'error');
                    removeFile();
                } else {
                    showToast(`✅ File valid!\n${parsedPMData.length} Siswa + ${parsedGuruData.length} Guru siap diupload`, 'success');
                }
            }

        } catch (err) {
            console.error('Error parsing Excel:', err);
            showToast('❌ Gagal membaca file\n' + err.message, 'error');
            removeFile();
        }
    };
    reader.readAsArrayBuffer(file);
}

/**
 * Render PM Preview - DIPERBAIKI (hapus syntax error h = >)
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
    // DIPERBAIKI: h => bukan h = >
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
 * Render Guru Preview - DIPERBAIKI (hapus syntax error h = >)
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
    // DIPERBAIKI: h => bukan h = >
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
 * Validasi Format NIK Indonesia - LENGKAP
 */
function validateNIK(nik) {
    const str = String(nik).trim();

    if (!/^\d{16}$/.test(str)) {
        return { valid: false, message: "Harus 16 digit angka", gender: '-' };
    }
    if (/^(.)\1{15}$/.test(str)) {
        return { valid: false, message: "Digit tidak boleh sama semua", gender: '-' };
    }
    const pola2Digit = str.substring(0, 2);
    if (str === pola2Digit.repeat(8)) {
        return { valid: false, message: "Pola berulang terdeteksi", gender: '-' };
    }
    if (/^1234567890123456$/.test(str) || /^9876543210987654$/.test(str)) {
        return { valid: false, message: "NIK berurutan (bukan NIK asli)", gender: '-' };
    }

    let dd = parseInt(str.substring(6, 8));
    const mm = parseInt(str.substring(8, 10));
    const yy = parseInt(str.substring(10, 12));

    let isFemale = false;
    if (dd > 40) {
        dd -= 40;
        isFemale = true;
    }

    if (mm < 1 || mm > 12) {
        return { valid: false, message: `Bulan tidak valid (${mm})`, gender: '-' };
    }

    const date = new Date(1900 + yy, mm - 1, dd);
    if (date.getFullYear() % 100 !== yy || date.getMonth() + 1 !== mm || date.getDate() !== dd) {
        return { valid: false, message: `Tanggal tidak valid`, gender: '-' };
    }

    const count9 = (str.match(/9/g) || []).length;
    if (count9 >= 12) {
        return { valid: false, message: "Terlalu banyak angka 9", gender: '-' };
    }

    const count0 = (str.match(/0/g) || []).length;
    if (count0 >= 12) {
        return { valid: false, message: "Terlalu banyak angka 0", gender: '-' };
    }

    return { valid: true, message: "Valid", gender: isFemale ? 'P' : 'L' };
}