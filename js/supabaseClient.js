// ============================================
// SUPABASE CLIENT & DATABASE FUNCTIONS
// ============================================
const SUPABASE_URL = 'https://ngxnutcjejdxuqkirxvi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5neG51dGNqZWpkeHVxa2lyeHZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM1ODE2NjUsImV4cCI6MjA5OTE1NzY2NX0.GvhbH_cdLnDeGTXpYuvdT7Q_Uo5cTwN-13rTs4Tn-DI';

// Inisialisasi Client
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const db = supabaseClient;

/**
 * Wrapper untuk query dengan retry otomatis (Penting untuk Free Plan)
 */
async function queryWithRetry(queryFn, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            const result = await queryFn();
            if (result.error) throw result.error;
            return result;
        } catch (error) {
            console.warn(`Database attempt ${i + 1} failed:`, error.message);
            if (i === maxRetries - 1) {
                if (typeof showToast === 'function') {
                    showToast('❌ Gagal koneksi ke database. Silakan refresh halaman.', 'error');
                } else {
                    alert('Gagal koneksi ke database. Silakan refresh halaman.');
                }
                throw error;
            }
            // Exponential backoff: 1s, 2s, 4s
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
        }
    }
}

// ============================================
// SCHOOL FUNCTIONS
// ============================================
async function insertSchool(data) {
    const { data: result, error } = await queryWithRetry(() =>
        db.from('sekolah').insert({
            jenjang: data.jenjang,
            nama_sekolah: data.nama_sekolah,
            nama_kepsek: data.nama_kepsek,
            npsn: data.npsn,
            alamat_sekolah: data.alamat_sekolah,
            nama_pic: data.nama_pic,
            nomor_hp: data.nomor_hp,
            spp_bulanan: parseInt(data.spp_bulanan)
        }).select()
    );
    if (error) throw error;
    return result[0];
}

async function getAllSchools() {
    const { data, error } = await queryWithRetry(() =>
        db.from('sekolah').select('*').order('nama_sekolah', { ascending: true })
    );
    if (error) throw error;
    return data || [];
}

async function deleteSchool(id) {
    const { error } = await queryWithRetry(() =>
        db.from('sekolah').delete().eq('id', id)
    );
    if (error) throw error;
}

// ============================================
// PM MBG FUNCTIONS
// ============================================
async function insertBulkPM(records) {
    if (records.length === 0) return;
    const { data, error } = await queryWithRetry(() =>
        db.from('pm_mbg').insert(records).select()
    );
    if (error) throw error;
    return data;
}

async function getAllPM() {
    const { data, error } = await queryWithRetry(() =>
        db.from('pm_mbg').select(`*, sekolah:sekolah_id ( nama_sekolah )`).order('nama_lengkap', { ascending: true })
    );
    if (error) throw error;
    return data || [];
}

async function deletePM(id) {
    const { error } = await queryWithRetry(() =>
        db.from('pm_mbg').delete().eq('id', id)
    );
    if (error) throw error;
}

// ============================================
// GURU TENDIK FUNCTIONS
// ============================================
async function insertBulkGuru(records) {
    if (records.length === 0) return;
    const { data, error } = await queryWithRetry(() =>
        db.from('guru_tendik').insert(records).select()
    );
    if (error) throw error;
    return data;
}

async function getAllGuru() {
    const { data, error } = await queryWithRetry(() =>
        db.from('guru_tendik').select(`*, sekolah:sekolah_id ( nama_sekolah )`).order('nama_lengkap', { ascending: true })
    );
    if (error) throw error;
    return data || [];
}

async function deleteGuru(id) {
    const { error } = await queryWithRetry(() =>
        db.from('guru_tendik').delete().eq('id', id)
    );
    if (error) throw error;
}

// ============================================
// STORAGE FUNCTIONS
// ============================================
async function uploadFileToStorageWithMetadata(file, metadata, customFileName) {
    const fileExt = file.name.split('.').pop();
    const fileName = customFileName || `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `excels/${fileName}`;
    
    const { data, error } = await queryWithRetry(() =>
        db.storage.from('school-files').upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
            metadata: { ...metadata, size: file.size, originalName: file.name }
        })
    );
    if (error) throw error;
    return { path: data.path, name: fileName, size: file.size };
}

async function getUploadedFiles() {
    const { data, error } = await queryWithRetry(() =>
        db.storage.from('school-files').list('excels', {
            sortBy: { column: 'created_at', order: 'desc' }
        })
    );
    if (error) throw error;
    return data || [];
}

function getFileUrl(path) {
    const { data } = db.storage.from('school-files').getPublicUrl(path);
    return data.publicUrl;
}

async function deleteFileFromStorage(path) {
    const { error } = await queryWithRetry(() =>
        db.storage.from('school-files').remove([path])
    );
    if (error) throw error;
}

// Export ke global window agar bisa dipakai di app.js
window.db = db;
window.queryWithRetry = queryWithRetry;