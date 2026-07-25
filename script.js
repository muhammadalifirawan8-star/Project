// GANTI DENGAN URL WEB APP GAS ANDA
const GAS_URL = 'https://script.google.com/macros/s/AKfycbwECjDA9zvr3FmCY-w5Us5ztY8hgtFnMB1fFR9237TXgdmZfagYrhwJl2aDvEGMwm2z/exec';

// Keamanan: Mencegah injeksi XSS pada log dan notifikasi
const escapeHTML = (str) => {
  return String(str).replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag])
  );
};

// Manajemen UI
const ui = {
  loading: (id, text) => {
    const btn = document.getElementById(id);
    btn.dataset.original = btn.innerText;
    btn.innerText = text;
    btn.disabled = true;
  },
  reset: (id) => {
    const btn = document.getElementById(id);
    btn.innerText = btn.dataset.original;
    btn.disabled = false;
  },
  toast: (msg, type = 'success') => {
    const toast = document.getElementById('toast');
    toast.className = `toast ${type}`;
    toast.innerHTML = escapeHTML(msg);
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 3500);
  },
  log: (msg, type = 'info') => {
    const term = document.getElementById('terminal-log');
    const color = type === 'error' ? '#ef4444' : '#22c55e';
    const timestamp = new Date().toLocaleTimeString();
    term.innerHTML += `<br><span style="color: #64748b">[${timestamp}]</span> <span style="color: ${color}">> ${escapeHTML(msg)}</span>`;
    term.scrollTop = term.scrollHeight; // Auto-scroll ke bawah
  }
};

// Modul Utama Aplikasi
const app = {
  email: '',
  
  activate: async () => {
    const emailInput = document.getElementById('input-email').value.trim();
    if (!emailInput) return ui.toast('Email tidak boleh kosong', 'error');

    ui.loading('btn-auth', 'Memproses...');
    try {
      const response = await fetch(GAS_URL, {
        method: 'POST',
        body: JSON.stringify({ action: 'activateAccount', email: emailInput })
      });
      const res = await response.json();
      
      if (res.status === 'success') {
        app.email = emailInput;
        document.getElementById('panel-auth').classList.add('hidden');
        document.getElementById('panel-config').classList.remove('hidden');
        
        const badge = document.getElementById('user-badge');
        badge.innerText = 'Online';
        badge.classList.add('active');
        
        ui.toast(res.data.message);
        ui.log('Autentikasi berhasil. Workspace diaktifkan.');
      } else {
        throw new Error(res.message);
      }
    } catch (err) {
      ui.toast('Gagal terhubung ke server', 'error');
      ui.log(`Koneksi ditolak: ${err.message}`, 'error');
    } finally {
      ui.reset('btn-auth');
    }
  },

  save: async () => {
    const id = document.getElementById('input-project').value.trim();
    const code = document.getElementById('input-code').value;
    
    if (!id || !code) return ui.toast('Project ID dan Kode harus diisi', 'error');

    ui.loading('btn-save', 'Menyimpan...');
    ui.log('Mengompilasi data ke Cloud Serverless...');
    
    try {
      const response = await fetch(GAS_URL, {
        method: 'POST',
        body: JSON.stringify({ action: 'saveProject', projectId: id, email: app.email, code: code })
      });
      const res = await response.json();
      
      if (res.status === 'success') {
        ui.toast('Berhasil disimpan');
        ui.log(`Project [${id}] tersimpan di Cloud.`);
      } else {
        throw new Error(res.message);
      }
    } catch (err) {
      ui.toast('Gagal menyimpan project', 'error');
      ui.log(`Gagal menyimpan: ${err.message}`, 'error');
    } finally {
      ui.reset('btn-save');
    }
  },

  publish: () => {
    const id = document.getElementById('input-project').value.trim();
    if (!id) return ui.toast('Silakan simpan project terlebih dahulu', 'error');
    
    const publicUrl = `${GAS_URL}?id=${id}`;
    
    ui.log(`Menyiapkan server publik...`);
    ui.log(`Membuka target: ${publicUrl}`);
    ui.toast('Menjalankan Web Browser...', 'success');
    
    // Eksekusi membuka tab baru yang akan merender halaman dari GAS
    window.open(publicUrl, '_blank');
  }
};
