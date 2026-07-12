// ============================================
// DISTRIBUSI PORTAL SPPG
// ============================================

let allSekolahData = [];
let distribusiData = [];
let draggedElement = null;
let currentJalur = '';

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();
    loadData();
});

// Load semua data
async function loadData() {
    try {
        // Load semua sekolah
        const { data: sekolah, error: errSekolah } = await db
            .from('sekolah')
            .select('*')
            .order('nama_sekolah', { ascending: true });

        // Load data distribusi
        const { data: distribusi, error: errDistribusi } = await db
            .from('rute_distribusi')
            .select('*')
            .order('jalur', { ascending: true })
            .order('urutan', { ascending: true });

        if (errSekolah || errDistribusi) throw new Error('Gagal load data');

        allSekolahData = sekolah || [];
        distribusiData = distribusi || [];

        // Hitung PK/PB untuk setiap sekolah
        await calculatePKPB();

        renderDistribusi();
        calculateTotal();
    } catch (error) {
        console.error('Error loading data:', error);
        showToast('Gagal memuat data', 'error');
    }
}

// Hitung PK/PB dari data siswa dan guru
async function calculatePKPB() {
    for (const sekolah of allSekolahData) {
        // Hitung PK (Kelas 0-3: PAUD, TK, 1, 2, 3)
        const { data: pmPK, error: errPM } = await db
            .from('pm_mbg')
            .select('id')
            .eq('sekolah_id', sekolah.id)
            .in('kelas', ['PAUD', 'TK', '0', '1', '2', '3']);

        // Hitung PB (Kelas 4-13)
        const { data: pmPB, error: errPB } = await db
            .from('pm_mbg')
            .select('id')
            .eq('sekolah_id', sekolah.id)
            .in('kelas', ['4', '5', '6', '7', '8', '9', '10', '11', '12', '13']);

        // Hitung Guru & Tendik
        const { data: guru, error: errGuru } = await db
            .from('guru_tendik')
            .select('id')
            .eq('sekolah_id', sekolah.id);

        sekolah.pk_count = (pmPK && !errPM) ? pmPK.length : 0;
        sekolah.pb_count = ((pmPB && !errPB) ? pmPB.length : 0) + ((guru && !errGuru) ? guru.length : 0);
        sekolah.total_count = sekolah.pk_count + sekolah.pb_count;
    }
}

// Render distribusi
function renderDistribusi() {
    const listSelatan = document.getElementById('list-selatan');
    const listUtara = document.getElementById('list-utara');
    const listBelum = document.getElementById('list-belum');

    // Filter sekolah yang sudah ada di distribusi
    const sekolahDiDistribusi = distribusiData.map(d => d.sekolah_id);
    const sekolahBelum = allSekolahData.filter(s => !sekolahDiDistribusi.includes(s.id));

    // Render Jalur Selatan
    const dataSelatan = distribusiData.filter(d => d.jalur === 'Selatan');
    listSelatan.innerHTML = dataSelatan.map(item => {
        const sekolah = allSekolahData.find(s => s.id === item.sekolah_id);
        if (!sekolah) return '';
        return createSekolahItem(sekolah, item, 'Selatan');
    }).join('');

    // Render Jalur Utara
    const dataUtara = distribusiData.filter(d => d.jalur === 'Utara');
    listUtara.innerHTML = dataUtara.map(item => {
        const sekolah = allSekolahData.find(s => s.id === item.sekolah_id);
        if (!sekolah) return '';
        return createSekolahItem(sekolah, item, 'Utara');
    }).join('');

    // Render Sekolah Belum Masuk
    listBelum.innerHTML = sekolahBelum.map(sekolah => {
        return createSekolahItemBelum(sekolah);
    }).join('');

    // Update count
    document.getElementById('count-selatan').textContent = dataSelatan.length;
    document.getElementById('count-utara').textContent = dataUtara.length;

    lucide.createIcons();
}

// Create item sekolah untuk jalur
function createSekolahItem(sekolah, distribusi, jalur) {
    const pk = distribusi.porsi_kecil || sekolah.pk_count || 0;
    const pb = distribusi.porsi_besar || sekolah.pb_count || 0;
    const total = pk + pb;

    return `
        <div class="sekolah-item" draggable="true" ondragstart="drag(event)" data-id="${distribusi.id}" data-sekolah-id="${sekolah.id}">
            <div class="drag-handle">
                <i data-lucide="grip-vertical"></i>
            </div>
            <div class="sekolah-info">
                <strong>${sekolah.nama_sekolah}</strong>
                <small>${sekolah.jenjang} - ${sekolah.npsn}</small>
            </div>
            <div class="porsi-input">
                <input type="number" 
                       class="input-porsi input-pk" 
                       value="${pk}" 
                       min="0"
                       onchange="updatePorsi(${distribusi.id}, 'kecil', this.value)">
            </div>
            <div class="porsi-input">
                <input type="number" 
                       class="input-porsi input-pb" 
                       value="${pb}" 
                       min="0"
                       onchange="updatePorsi(${distribusi.id}, 'besar', this.value)">
            </div>
            <div class="total-porsi">
                ${total}
            </div>
        </div>
    `;
}

// Create item sekolah belum masuk distribusi
function createSekolahItemBelum(sekolah) {
    return `
        <div class="sekolah-item belum-item" draggable="true" ondragstart="drag(event)" data-sekolah-id="${sekolah.id}">
            <div class="drag-handle">
                <i data-lucide="grip-vertical"></i>
            </div>
            <div class="sekolah-info">
                <strong>${sekolah.nama_sekolah}</strong>
                <small>${sekolah.jenjang} - ${sekolah.npsn}</small>
            </div>
            <div class="porsi-info">
                <span class="porsi-badge pk">PK: ${sekolah.pk_count || 0}</span>
                <span class="porsi-badge pb">PB: ${sekolah.pb_count || 0}</span>
                <span class="porsi-badge total">Total: ${sekolah.total_count || 0}</span>
            </div>
            <div class="btn-tambah">
                <button class="btn btn-sm btn-primary" onclick="tambahKeDistribusi(${sekolah.id})">
                    <i data-lucide="plus"></i> Tambah
                </button>
            </div>
        </div>
    `;
}

// Drag and Drop Functions
function drag(event) {
    draggedElement = event.target.closest('.sekolah-item');
    if (draggedElement) {
        event.dataTransfer.setData('text/plain', draggedElement.dataset.sekolahId);
        draggedElement.classList.add('dragging');
    }
}

function allowDrop(event) {
    event.preventDefault();
}

async function drop(event, jalur) {
    event.preventDefault();
    
    const sekolahId = parseInt(event.dataTransfer.getData('text/plain'));
    
    if (draggedElement) {
        draggedElement.classList.remove('dragging');
    }

    // Cek apakah sekolah sudah ada di distribusi
    const existing = distribusiData.find(d => d.sekolah_id === sekolahId);
    
    if (existing) {
        // Update jalur
        await db
            .from('rute_distribusi')
            .update({ jalur: jalur })
            .eq('id', existing.id);
    } else {
        // Tambah baru
        const sekolah = allSekolahData.find(s => s.id === sekolahId);
        if (!sekolah) return;

        const { data: newData, error } = await db
            .from('rute_distribusi')
            .insert({
                sekolah_id: sekolahId,
                npsn: sekolah.npsn,
                nama_sekolah: sekolah.nama_sekolah,
                jalur: jalur,
                porsi_kecil: sekolah.pk_count || 0,
                porsi_besar: sekolah.pb_count || 0,
                urutan: distribusiData.filter(d => d.jalur === jalur).length
            })
            .select();

        if (error) {
            showToast('Gagal menambah sekolah', 'error');
            return;
        }

        distribusiData.push(newData[0]);
    }

    showToast(`Sekolah dipindahkan ke Jalur ${jalur}`, 'success');
    await loadData();
}

// Update porsi
async function updatePorsi(id, jenis, value) {
    try {
        const field = jenis === 'kecil' ? 'porsi_kecil' : 'porsi_besar';
        const { error } = await db
            .from('rute_distribusi')
            .update({ [field]: parseInt(value) || 0 })
            .eq('id', id);

        if (error) throw error;
        
        calculateTotal();
        showToast('Data berhasil diupdate', 'success');
    } catch (error) {
        console.error('Error update porsi:', error);
        showToast('Gagal update data', 'error');
    }
}

// Tambah sekolah ke distribusi
async function tambahKeDistribusi(sekolahId) {
    const sekolah = allSekolahData.find(s => s.id === sekolahId);
    if (!sekolah) return;

    const jalur = prompt(`Pilih jalur untuk ${sekolah.nama_sekolah}:\n1. Selatan\n2. Utara\n\nKetik 1 atau 2:`);
    
    if (!jalur || (jalur !== '1' && jalur !== '2')) {
        showToast('Pilihan tidak valid', 'error');
        return;
    }

    const jalurName = jalur === '1' ? 'Selatan' : 'Utara';

    const { data: newData, error } = await db
        .from('rute_distribusi')
        .insert({
            sekolah_id: sekolahId,
            npsn: sekolah.npsn,
            nama_sekolah: sekolah.nama_sekolah,
            jalur: jalurName,
            porsi_kecil: sekolah.pk_count || 0,
            porsi_besar: sekolah.pb_count || 0,
            urutan: distribusiData.filter(d => d.jalur === jalurName).length
        })
        .select();

    if (error) {
        showToast('Gagal menambah sekolah', 'error');
        return;
    }

    distribusiData.push(newData[0]);
    showToast(`${sekolah.nama_sekolah} ditambahkan ke Jalur ${jalurName}`, 'success');
    await loadData();
}

// Hitung total
function calculateTotal() {
    let totalSelatanPK = 0, totalSelatanPB = 0;
    let totalUtaraPK = 0, totalUtaraPB = 0;

    document.querySelectorAll('#list-selatan .input-pk').forEach(input => {
        totalSelatanPK += parseInt(input.value) || 0;
    });
    document.querySelectorAll('#list-selatan .input-pb').forEach(input => {
        totalSelatanPB += parseInt(input.value) || 0;
    });
    document.querySelectorAll('#list-utara .input-pk').forEach(input => {
        totalUtaraPK += parseInt(input.value) || 0;
    });
    document.querySelectorAll('#list-utara .input-pb').forEach(input => {
        totalUtaraPB += parseInt(input.value) || 0;
    });

    document.getElementById('total-selatan-pk').textContent = totalSelatanPK;
    document.getElementById('total-selatan-pb').textContent = totalSelatanPB;
    document.getElementById('total-selatan').textContent = totalSelatanPK + totalSelatanPB;
    
    document.getElementById('total-utara-pk').textContent = totalUtaraPK;
    document.getElementById('total-utara-pb').textContent = totalUtaraPB;
    document.getElementById('total-utara').textContent = totalUtaraPK + totalUtaraPB;

    document.getElementById('grand-total-pk').textContent = totalSelatanPK + totalUtaraPK;
    document.getElementById('grand-total-pb').textContent = totalSelatanPB + totalUtaraPB;
    document.getElementById('grand-total').textContent = totalSelatanPK + totalSelatanPB + totalUtaraPK + totalUtaraPB;
}

// Modal Functions
function showAddSekolahModal(jalur) {
    currentJalur = jalur;
    const modal = document.getElementById('addSekolahModal');
    const select = document.getElementById('selectSekolah');
    
    loadSekolahOptions(select, jalur);
    
    modal.classList.add('show');
    lucide.createIcons();
}

function closeAddSekolahModal(event) {
    if (event && event.target !== event.currentTarget) return;
    const modal = document.getElementById('addSekolahModal');
    modal.classList.remove('show');
}

async function loadSekolahOptions(select, jalur) {
    try {
        const { data: semuaSekolah } = await db
            .from('sekolah')
            .select('id, npsn, nama_sekolah');

        const { data: sudahAda } = await db
            .from('rute_distribusi')
            .select('sekolah_id')
            .eq('jalur', jalur);

        const sudahAdaIds = sudahAda ? sudahAda.map(d => d.sekolah_id) : [];
        const tersedia = semuaSekolah.filter(s => !sudahAdaIds.includes(s.id));

        select.innerHTML = '<option value="">-- Pilih Sekolah --</option>';
        tersedia.forEach(sekolah => {
            const option = document.createElement('option');
            option.value = sekolah.id;
            option.textContent = `${sekolah.npsn} - ${sekolah.nama_sekolah}`;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading sekolah:', error);
    }
}

async function confirmAddSekolah() {
    const select = document.getElementById('selectSekolah');
    const sekolahId = parseInt(select.value);
    
    if (!sekolahId) {
        showToast('Pilih sekolah terlebih dahulu', 'error');
        return;
    }

    await tambahKeDistribusi(sekolahId, currentJalur);
    closeAddSekolahModal();
}

// Toast notification
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const icon = document.getElementById('toastIcon');
    const msg = document.getElementById('toastMessage');

    toast.className = `toast ${type}`;
    msg.textContent = message;
    icon.setAttribute('data-lucide', type === 'success' ? 'check-circle' : 'alert-circle');
    lucide.createIcons();

    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}
