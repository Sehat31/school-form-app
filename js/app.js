async function loadSchoolInfo() {
    const select = document.getElementById('select_npsn_mbg');
    const selectedOption = select.options[select.selectedIndex];
    const npsn = select.value;

    if (!npsn) {
        document.getElementById('schoolInfoDisplay').style.display = 'none';
        return;
    }

    // Ambil data sekolah dari database langsung
    try {
        const { data: schools, error } = await db
            .from('sekolah')
            .select('*')
            .eq('npsn', npsn)
            .single();

        if (error || !schools) {
            console.error('Gagal load data sekolah:', error);
            document.getElementById('infoNamaSekolah').textContent = selectedOption.textContent.split(' - ')[1] || '-';
            document.getElementById('infoJenjang').textContent = '-';
            document.getElementById('infoKepsek').textContent = '-';
        } else {
            document.getElementById('infoNamaSekolah').textContent = schools.nama_sekolah || '-';
            document.getElementById('infoJenjang').textContent = schools.jenjang || '-';
            document.getElementById('infoKepsek').textContent = schools.nama_kepsek || '-';
        }
    } catch (err) {
        console.error('Error load school info:', err);
        document.getElementById('infoNamaSekolah').textContent = selectedOption.textContent.split(' - ')[1] || '-';
        document.getElementById('infoJenjang').textContent = '-';
        document.getElementById('infoKepsek').textContent = '-';
    }

    document.getElementById('schoolInfoDisplay').style.display = 'block';
}

