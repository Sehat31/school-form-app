// ============================================
// DISTRIBUSI PORTAL SPPG
// ============================================
let allSekolahData = [];
let distribusiData = [];
let draggedElement = null;
let currentJalur = '';
let distribusiUnlocked = false;
const DISTRIBUSI_PASSWORD = '2024';

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();
    updateSecurityUI();
    loadData();
});

// ============================================
// SECURITY
// ============================================
function updateSecurityUI() {
    const notice = document.getElementById('securityNotice');
    const btnS = document.getElementById('btnTambahSelatan');
    const btnU = document.getElementById('btnTambahUtara');
    if (distribusiUnlocked) {
        notice.innerHTML = '<i data-lucide="unlock"></i><span>Mode Edit Aktif - <button onclick="lockDistribusi()" class="btn-link">Kunci</button></span>';
        notice.style.background = '#d1fae5';
        notice.style.borderColor = '#10b981';
        notice.style.color = '#065f46';
        if (btnS) btnS.style.display = 'inline-flex';
        if (btnU) btnU.style.display = 'inline-flex';
    } else {
        notice.innerHTML = '<i data-lucide="lock"></i><span>Mode Baca Saja - <button onclick="unlockDistribusi()" class="btn-link">Klik untuk Edit</button></span>';
        notice.style.background = '#fef3c7';
        notice.style.borderColor = '#f59e0b';
        notice.style.color = '#92400e';
        if (btnS) btnS.style.display = 'none';
        if (btnU) btnU.style.display = 'none';
    }
    lucide.createIcons();
}

function unlockDistribusi() {
    document.getElementById('passwordModal').classList.add('show');
    document.getElementById('passwordInput').value = '';
    setTimeout(() => document.getElementById('passwordInput').focus(), 100);
    lucide.createIcons();
}

function lockDistribusi() {
    distribusiUnlocked = false;
    updateSecurityUI();
    renderDistribusi();
    showToast('Rute distribusi dikunci', 'success');
}

function verifyPassword() {
    const password = document.getElementById('passwordInput').value;
    if (password === DISTRIBUSI_PASSWORD) {
        distribusiUnlocked = true;
        closePasswordModal();
        updateSecurityUI();
        renderDistribusi();
        showToast('Mode edit diaktifkan', 'success');
    } else {
        showToast('Password salah!', 'error');
    }
}

function closePasswordModal(event) {
    if (event && event.target !== event.currentTarget) return;
    document.getElementById('passwordModal').classList.remove('show');
}

// ============================================
// LOAD DATA
// ============================================
async function loadData() {
    try {
        const { data: sekolah, error: err1 } = await db.from('sekolah').select('*').order('nama_sekolah', { ascending: true });
        const { data: distribusi, error: err2 } = await db.from('rute_distribusi').select('*').order('jalur').order('urutan');
        if (err1 || err2) throw new Error('Gagal load data');
        allSekolahData = sekolah || [];
        distribusiData = distribusi || [];
        await calculatePKPB();
        renderDistribusi();
        calculateTotal();
    } catch (error) {
        console.error('Error loading data:', error);
        showToast('Gagal memuat data', 'error');
    }
}

async function calculatePKPB() {
    for (const sekolah of allSekolahData) {
        const { data: pmPK } = await db.from('pm_mbg').select('id').eq('sekolah_id', sekolah.id).in('kelas', ['PAUD','TK','0','1','2','3']);
        const { data: pmPB } = await db.from('pm_mbg').select('id').eq('sekolah_id', sekolah.id).in('kelas', ['4','5','6','7','8','9','10','11','12']);
        const { data: guru } = await db.from('guru_tendik').select('id').eq('sekolah_id', sekolah.id);
        sekolah.siswa_kelas_0_3 = pmPK ? pmPK.length : 0;
        sekolah.siswa_kelas_4_12 = pmPB ? pmPB.length : 0;
        sekolah.guru_tendik_count = guru ? guru.length : 0;
        sekolah.pk_count = sekolah.siswa_kelas_0_3;
        sekolah.pb_count = sekolah.siswa_kelas_4_12 + sekolah.guru_tendik_count;
        sekolah.total_count = sekolah.pk_count + sekolah.pb_count;
    }
}

// ============================================
// RENDER
// ============================================
function renderDistribusi() {
    const listSelatan = document.getElementById('list-selatan');
    const listUtara = document.getElementById('list-utara');
    const listBelum = document.getElementById('list-belum');
    const sekolahDiRute = distribusiData.map(d => d.sekolah_id);

    const dataSelatan = distribusiData.filter(d => d.jalur === 'Selatan');
    listSelatan.innerHTML = dataSelatan.length > 0
        ? dataSelatan.map(item => { const s = allSekolahData.find(x => x.id === item.sekolah_id); return s ? createSekolahItem(s, item) : ''; }).join('')
        : '<div class="loading-placeholder"><p>Belum ada sekolah</p></div>';

    const dataUtara = distribusiData.filter(d => d.jalur === 'Utara');
    listUtara.innerHTML = dataUtara.length > 0
        ? dataUtara.map(item => { const s = allSekolahData.find(x => x.id === item.sekolah_id); return s ? createSekolahItem(s, item) : ''; }).join('')
        : '<div class="loading-placeholder"><p>Belum ada sekolah</p></div>';

    listBelum.innerHTML = allSekolahData.map(sekolah => {
        const sudahDiRute = sekolahDiRute.includes(sekolah.id);
        const jalur = sudahDiRute ? distribusiData.find(d => d.sekolah_id === sekolah.id)?.jalur : null;
        return createSekolahItemBelum(sekolah, sudahDiRute, jalur);
    }).join('');

    document.getElementById('count-selatan').textContent = dataSelatan.length;
    document.getElementById('count-utara').textContent = dataUtara.length;
    lucide.createIcons();
}

function createSekolahItem(sekolah, distribusi) {
    const pk = distribusi.porsi_kecil || 0;
    const pb = distribusi.porsi_besar || 0;
    const total = pk + pb;
    return `
        <div class="sekolah-item" data-id="${distribusi.id}" data-sekolah-id="${sekolah.id}">
            <div class="drag-handle"><i data-lucide="check-circle"></i></div>
            <div class="sekolah-info">
                <strong>${sekolah.nama_sekolah}</strong>
                <small>${sekolah.jenjang} - ${sekolah.npsn}</small>
            </div>
            <div class="porsi-input">
                <input type="number" class="input-porsi input-pk" value="${pk}" min="0" ${!distribusiUnlocked ? 'readonly' : ''} onchange="updatePorsi(${distribusi.id},'kecil',this.value)">
            </div>
            <div class="porsi-input">
                <input type="number" class="input-porsi input-pb" value="${pb}" min="0" ${!distribusiUnlocked ? 'readonly' : ''} onchange="updatePorsi(${distribusi.id},'besar',this.value)">
            </div>
            <div class="total-porsi">${total}</div>
            ${distribusiUnlocked ? `<button class="btn-hapus" onclick="hapusDariDistribusi(${distribusi.id},'${sekolah.nama_sekolah}')" title="Hapus"><i data-lucide="trash-2"></i></button>` : '<div style="width:35px"></div>'}
        </div>`;
}

function createSekolahItemBelum(sekolah, sudahDiRute, jalur) {
    const k03 = sekolah.siswa_kelas_0_3 || 0;
    const k412 = sekolah.siswa_kelas_4_12 || 0;
    const guru = sekolah.guru_tendik_count || 0;
    let cls = 'sekolah-item belum-item';
    let badge = '';
    let actions = '';

    if (sudahDiRute) {
        cls += ` already-in-route ${jalur === 'Selatan' ? 'jalur-selatan' : 'jalur-utara'}`;
        const c = jalur === 'Selatan' ? '#f59e0b' : '#3b82f6';
        badge = `<span class="status-badge" style="background:${c}20;color:${c};border:1px solid ${c};">✓ Jalur ${jalur}</span>`;
    } else {
        badge = '<span class="status-badge pending">⏳ Belum Masuk Rute</span>';
    }

    if (distribusiUnlocked && !sudahDiRute) {
        actions = `<div class="jalur-buttons">
            <button class="btn-jalur btn-selatan" onclick="tambahKeJalur(${sekolah.id},'Selatan')"><i data-lucide="arrow-right"></i><span>Selatan</span></button>
            <button class="btn-jalur btn-utara" onclick="tambahKeJalur(${sekolah.id},'Utara')"><i data-lucide="arrow-right"></i><span>Utara</span></button>
        </div>`;
    } else {
        actions = '<div style="width:100px"></div>';
    }

    return `
        <div class="${cls}" data-sekolah-id="${sekolah.id}" ${!sudahDiRute && distribusiUnlocked ? `draggable="true" ondragstart="drag(event)"` : ''}>
            <div class="drag-handle" style="${sudahDiRute ? 'opacity:0.4' : ''}"><i data-lucide="${sudahDiRute ? 'check-circle' : 'school'}"></i></div>
            <div class="sekolah-info">
                <strong>${sekolah.nama_sekolah}</strong>
                <small>${sekolah.jenjang} - ${sekolah.npsn}</small>
                ${badge}
            </div>
            <div class="porsi-info">
                <span class="porsi-badge pk">Kelas 0-3: ${k03}</span>
                <span class="porsi-badge pb">Kelas 4-12: ${k412}</span>
                <span class="porsi-badge guru">Guru: ${guru}</span>
            </div>
            ${actions}
        </div>`;
}

// ============================================
// DRAG & DROP
// ============================================
function drag(event) {
    if (!distribusiUnlocked) { event.preventDefault(); return; }
    draggedElement = event.target.closest('.sekolah-item');
    if (draggedElement) {
        event.dataTransfer.setData('text/plain', draggedElement.dataset.sekolahId);
        draggedElement.classList.add('dragging');
    }
}

function allowDrop(event) {
    if (distribusiUnlocked) event.preventDefault();
}

async function drop(event, jalur) {
    if (!distribusiUnlocked) return;
    event.preventDefault();
    const sekolahId = parseInt(event.dataTransfer.getData('text/plain'));
    if (draggedElement) draggedElement.classList.remove('dragging');
    await tambahKeJalur(sekolahId, jalur);
}

// ============================================
// CRUD OPERATIONS
// ============================================
async function tambahKeJalur(sekolahId, jalur) {
    if (!distribusiUnlocked) { showToast('Buka kunci terlebih dahulu', 'error'); unlockDistribusi(); return; }
    const existing = distribusiData.find(d => d.sekolah_id === sekolahId);
    if (existing) { showToast(`❌ Sekolah sudah terdaftar di Jalur ${existing.jalur}!`, 'error'); return; }
    const sekolah = allSekolahData.find(s => s.id === sekolahId);
    if (!sekolah) return;

    const pk = sekolah.siswa_kelas_0_3 || 0;
    const pb = (sekolah.siswa_kelas_4_12 || 0) + (sekolah.guru_tendik_count || 0);
    const { data: newData, error } = await db.from('rute_distribusi').insert({
        sekolah_id: sekolahId, npsn: sekolah.npsn, nama_sekolah: sekolah.nama_sekolah,
        jalur: jalur, porsi_kecil: pk, porsi_besar: pb,
        urutan: distribusiData.filter(d => d.jalur === jalur).length
    }).select();

    if (error) { showToast('Gagal menambah sekolah', 'error'); return; }
    distribusiData.push(newData[0]);
    showToast(`✅ ${sekolah.nama_sekolah} ditambahkan ke Jalur ${jalur}`, 'success');
    await loadData();
}

async function updatePorsi(id, jenis, value) {
    if (!distribusiUnlocked) { showToast('Buka kunci untuk mengedit', 'error'); unlockDistribusi(); return; }
    try {
        const field = jenis === 'kecil' ? 'porsi_kecil' : 'porsi_besar';
        const { error } = await db.from('rute_distribusi').update({ [field]: parseInt(value) || 0 }).eq('id', id);
        if (error) throw error;
        calculateTotal();
        showToast('Data berhasil diupdate', 'success');
    } catch (error) {
        console.error('Error update porsi:', error);
        showToast('Gagal update data', 'error');
    }
}

async function hapusDariDistribusi(distribusiId, namaSekolah) {
    if (!distribusiUnlocked) { showToast('Buka kunci untuk menghapus', 'error'); unlockDistribusi(); return; }
    if (!confirm(`Hapus ${namaSekolah} dari distribusi?`)) return;
    try {
        const { error } = await db.from('rute_distribusi').delete().eq('id', distribusiId);
        if (error) throw error;
        distribusiData = distribusiData.filter(d => d.id !== distribusiId);
        showToast(`${namaSekolah} dihapus dari distribusi`, 'success');
        await loadData();
    } catch (error) {
        console.error('Error hapus:', error);
        showToast('Gagal menghapus', 'error');
    }
}

// ============================================
// CALCULATE TOTAL
// ============================================
function calculateTotal() {
    let sPK = 0, sPB = 0, uPK = 0, uPB = 0;
    document.querySelectorAll('#list-selatan .input-pk').forEach(i => sPK += parseInt(i.value) || 0);
    document.querySelectorAll('#list-selatan .input-pb').forEach(i => sPB += parseInt(i.value) || 0);
    document.querySelectorAll('#list-utara .input-pk').forEach(i => uPK += parseInt(i.value) || 0);
    document.querySelectorAll('#list-utara .input-pb').forEach(i => uPB += parseInt(i.value) || 0);
    document.getElementById('total-selatan-pk').textContent = sPK;
    document.getElementById('total-selatan-pb').textContent = sPB;
    document.getElementById('total-selatan').textContent = sPK + sPB;
    document.getElementById('total-utara-pk').textContent = uPK;
    document.getElementById('total-utara-pb').textContent = uPB;
    document.getElementById('total-utara').textContent = uPK + uPB;
    document.getElementById('grand-total-pk').textContent = sPK + uPK;
    document.getElementById('grand-total-pb').textContent = sPB + uPB;
    document.getElementById('grand-total').textContent = sPK + sPB + uPK + uPB;
}

// ============================================
// ADD SEKOLAH MODAL
// ============================================
function showAddSekolahModal(jalur) {
    if (!distribusiUnlocked) { showToast('Buka kunci terlebih dahulu', 'error'); unlockDistribusi(); return; }
    currentJalur = jalur;
    const select = document.getElementById('selectSekolah');
    const sudahAda = distribusiData.map(d => d.sekolah_id);
    const tersedia = allSekolahData.filter(s => !sudahAda.includes(s.id));
    select.innerHTML = '<option value="">-- Pilih Sekolah --</option>' + tersedia.map(s => `<option value="${s.id}">${s.npsn} - ${s.nama_sekolah}</option>`).join('');
    document.getElementById('addSekolahModal').classList.add('show');
    lucide.createIcons();
}

function closeAddSekolahModal(event) {
    if (event && event.target !== event.currentTarget) return;
    document.getElementById('addSekolahModal').classList.remove('show');
}

async function confirmAddSekolah() {
    const sekolahId = parseInt(document.getElementById('selectSekolah').value);
    if (!sekolahId) { showToast('Pilih sekolah terlebih dahulu', 'error'); return; }
    await tambahKeJalur(sekolahId, currentJalur);
    closeAddSekolahModal();
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
    icon.setAttribute('data-lucide', type === 'success' ? 'check-circle' : 'alert-triangle');
    lucide.createIcons();
    toast.classList.add('show');
    if (window.toastTimeout) clearTimeout(window.toastTimeout);
    if (type === 'success') {
        window.toastTimeout = setTimeout(() => toast.classList.remove('show'), 3500);
    }
}

function closeToast() {
    document.getElementById('toast').classList.remove('show');
    if (window.toastTimeout) clearTimeout(window.toastTimeout);
}

// ============================================
// EXPORT FUNCTIONS
// ============================================
async function exportToPNG() {
    try {
        const canvas = await html2canvas(document.getElementById('exportContent'), { scale: 2, backgroundColor: '#ffffff' });
        const link = document.createElement('a');
        link.download = `Distribusi_SPPG_${new Date().toISOString().split('T')[0]}.png`;
        link.href = canvas.toDataURL();
        link.click();
        showToast('File PNG berhasil diunduh', 'success');
    } catch (error) {
        console.error(error);
        showToast('Gagal export PNG', 'error');
    }
}

function exportToExcel() {
    try {
        const data = [];
        data.push(['RUTE DISTRIBUSI SPPG JATIAN']);
        data.push(['Tanggal:', new Date().toLocaleDateString('id-ID')]);
        data.push([]);
        ['Selatan', 'Utara'].forEach(jalur => {
            data.push([`JALUR ${jalur.toUpperCase()}`]);
            data.push(['Sekolah', 'PK', 'PB', 'Total']);
            distribusiData.filter(d => d.jalur === jalur).forEach(item => {
                const s = allSekolahData.find(x => x.id === item.sekolah_id);
                if (s) data.push([s.nama_sekolah, item.porsi_kecil || 0, item.porsi_besar || 0, (item.porsi_kecil || 0) + (item.porsi_besar || 0)]);
            });
            data.push([]);
        });
        data.push(['GRAND TOTAL', document.getElementById('grand-total-pk').textContent, document.getElementById('grand-total-pb').textContent, document.getElementById('grand-total').textContent]);
        const ws = XLSX.utils.aoa_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Distribusi');
        XLSX.writeFile(wb, `Distribusi_SPPG_${new Date().toISOString().split('T')[0]}.xlsx`);
        showToast('File Excel berhasil diunduh', 'success');
    } catch (error) {
        console.error(error);
        showToast('Gagal export Excel', 'error');
    }
}

function exportToText() {
    try {
        let text = `RUTE DISTRIBUSI SPPG JATIAN\nTanggal: ${new Date().toLocaleDateString('id-ID')}\n${'='.repeat(50)}\n\n`;
        ['Selatan', 'Utara'].forEach(jalur => {
            text += `JALUR ${jalur.toUpperCase()}\n${'-'.repeat(50)}\n`;
            distribusiData.filter(d => d.jalur === jalur).forEach(item => {
                const s = allSekolahData.find(x => x.id === item.sekolah_id);
                if (s) text += `${s.nama_sekolah} | PK: ${item.porsi_kecil || 0} | PB: ${item.porsi_besar || 0}\n`;
            });
            text += '\n';
        });
        text += `GRAND TOTAL | PK: ${document.getElementById('grand-total-pk').textContent} | PB: ${document.getElementById('grand-total-pb').textContent} | Total: ${document.getElementById('grand-total').textContent}`;
        navigator.clipboard.writeText(text).then(() => showToast('Teks berhasil disalin', 'success')).catch(() => {
            const blob = new Blob([text], { type: 'text/plain' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `Distribusi_SPPG_${new Date().toISOString().split('T')[0]}.txt`;
            link.click();
            showToast('File teks berhasil diunduh', 'success');
        });
    } catch (error) {
        console.error(error);
        showToast('Gagal export text', 'error');
    }
}