// ============================================
// SUPABASE CONFIGURATION
// ============================================
const SUPABASE_URL = 'https://ngxnutcjejdxuqkirxvi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5neG51dGNqZWpkeHVxa2lyeHZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM1ODE2NjUsImV4cCI6MjA5OTE1NzY2NX0.GvhbH_cdLnDeGTXpYuvdT7Q_Uo5cTwN-13rTs4Tn-DI';

// PENTING: Gunakan nama 'db' bukan 'supabase' untuk menghindari konflik
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================
// DATABASE FUNCTIONS - SEKOLAH
// ============================================

async function insertSchool(data) {
    const { data: result, error } = await db
        .from('sekolah')
        .insert([{
            jenjang: data.jenjang,
            nama_sekolah: data.nama_sekolah,
            nama_kepsek: data.nama_kepsek,
            npsn: data.npsn,
            alamat_sekolah: data.alamat_sekolah,
            nama_pic: data.nama_pic,
            nomor_hp: data.nomor_hp,
            spp_bulanan: parseInt(data.spp_bulanan) || 0,
            created_at: new Date().toISOString()
        }])
        .select();

    if (error) throw error;
    return result;
}

async function getAllSchools() {
    const { data, error } = await db
        .from('sekolah')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
}

async function updateSchool(id, data) {
    const { data: result, error } = await db
        .from('sekolah')
        .update({
            jenjang: data.jenjang,
            nama_sekolah: data.nama_sekolah,
            nama_kepsek: data.nama_kepsek,
            npsn: data.npsn,
            alamat_sekolah: data.alamat_sekolah,
            nama_pic: data.nama_pic,
            nomor_hp: data.nomor_hp,
            spp_bulanan: parseInt(data.spp_bulanan) || 0
        })
        .eq('id', id)
        .select();

    if (error) throw error;
    return result;
}

async function deleteSchool(id) {
    const { error } = await db
        .from('sekolah')
        .delete()
        .eq('id', id);

    if (error) throw error;
}

// ============================================
// DATABASE FUNCTIONS - PM (Penerima Manfaat)
// ============================================

async function insertBulkPM(records) {
    const { data, error } = await db
        .from('pm_mbg')
        .insert(records)
        .select();

    if (error) throw error;
    return data;
}

async function getAllPM() {
    const { data, error } = await db
        .from('pm_mbg')
        .select(`
            *,
            sekolah (nama_sekolah, npsn)
        `)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
}

async function deletePM(id) {
    const { error } = await db
        .from('pm_mbg')
        .delete()
        .eq('id', id);

    if (error) throw error;
}

// ============================================
// DATABASE FUNCTIONS - Guru & Tendik
// ============================================

async function insertBulkGuru(records) {
    const { data, error } = await db
        .from('guru_tendik')
        .insert(records)
        .select();

    if (error) throw error;
    return data;
}

async function getAllGuru() {
    const { data, error } = await db
        .from('guru_tendik')
        .select(`
            *,
            sekolah (nama_sekolah, npsn)
        `)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
}

async function deleteGuru(id) {
    const { error } = await db
        .from('guru_tendik')
        .delete()
        .eq('id', id);

    if (error) throw error;
}

// ============================================
// STORAGE FUNCTIONS
// ============================================

async function uploadFileToStorage(file) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `excels/${fileName}`;

    const { data, error } = await db.storage
        .from('school-files')
        .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
        });

    if (error) throw error;
    return { path: data.path, name: file.name, size: file.size };
}

async function getUploadedFiles() {
    const { data, error } = await db.storage
        .from('school-files')
        .list('excels', {
            sortBy: { column: 'created_at', order: 'desc' }
        });

    if (error) throw error;
    return data || [];
}

function getFileUrl(path) {
    const { data } = db.storage
        .from('school-files')
        .getPublicUrl(path);
    return data.publicUrl;
}

async function deleteFileFromStorage(path) {
    const { error } = await db.storage
        .from('school-files')
        .remove([path]);

    if (error) throw error;
}
