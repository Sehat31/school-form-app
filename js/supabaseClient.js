// ============================================
// SUPABASE CONFIGURATION
// ============================================
const SUPABASE_URL = 'https://ngxnutcjejdxuqkirxvi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5neG51dGNqZWpkeHVxa2lyeHZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM1ODE2NjUsImV4cCI6MjA5OTE1NzY2NX0.GvhbH_cdLnDeGTXpYuvdT7Q_Uo5cTwN-13rTs4Tn-DI';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================
// DATABASE FUNCTIONS
// ============================================

/**
 * Insert single school record
 */
async function insertSchool(data) {
    const { data: result, error } = await supabase
        .from('sekolah')
        .insert([{
            jenjang: data.jenjang,
            nama_sekolah: data.nama_sekolah,
            nama_kepsek: data.nama_kepsek, // <--- TAMBAHKAN INI
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

/**
 * Insert multiple school records (from Excel)
 */
async function insertBulkSchools(records) {
    const formatted = records.map(r => ({
        jenjang: r.jenjang || r['Jenjang'] || '',
        nama_sekolah: r.nama_sekolah || r['Nama Sekolah'] || '',
        npsn: String(r.npsn || r['NPSN'] || ''),
        alamat_sekolah: r.alamat_sekolah || r['Alamat Sekolah'] || '',
        nama_pic: r.nama_pic || r['Nama PIC'] || '',
        nomor_hp: String(r.nomor_hp || r['Nomor HP PIC'] || ''),
        spp_bulanan: parseInt(r.spp_bulanan || r['SPP Bulanan'] || 0),
        created_at: new Date().toISOString()
    }));

    const { data, error } = await supabase
        .from('sekolah')
        .insert(formatted)
        .select();

    if (error) throw error;
    return data;
}

/**
 * Get all school records
 */
async function getAllSchools() {
    const { data, error } = await supabase
        .from('sekolah')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
}

/**
 * Update school record
 */
async function updateSchool(id, data) {
    const { data: result, error } = await supabase
        .from('sekolah')
        .update({
            jenjang: data.jenjang,
            nama_sekolah: data.nama_sekolah,
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

/**
 * Delete school record
 */
async function deleteSchool(id) {
    const { error } = await supabase
        .from('sekolah')
        .delete()
        .eq('id', id);

    if (error) throw error;
}

// ============================================
// STORAGE FUNCTIONS
// ============================================

/**
 * Upload file to Supabase Storage
 */
async function uploadFileToStorage(file) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `excels/${fileName}`;

    const { data, error } = await supabase.storage
        .from('school-files')
        .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
        });

    if (error) throw error;
    return { path: data.path, name: file.name, size: file.size };
}

/**
 * Get list of uploaded files
 */
async function getUploadedFiles() {
    const { data, error } = await supabase.storage
        .from('school-files')
        .list('excels', {
            sortBy: { column: 'created_at', order: 'desc' }
        });

    if (error) throw error;
    return data || [];
}

/**
 * Get public URL for a file
 */
function getFileUrl(path) {
    const { data } = supabase.storage
        .from('school-files')
        .getPublicUrl(path);
    return data.publicUrl;
}

/**
 * Delete file from storage
 */
async function deleteFileFromStorage(path) {
    const { error } = await supabase.storage
        .from('school-files')
        .remove([path]);

    if (error) throw error;
}
