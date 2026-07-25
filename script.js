// Ganti dengan URL Web App dari Google Apps Script Anda
const GAS_URL = 'https://script.google.com/macros/s/AKfycbz2WSHxAPfO5-aC_I6XCje1q69JI3WOoQSuTezn6DizhL77P_IsqFDHhlMDRNvjjaE/exec'; 

// ==========================================
// Kemanan: Sanitasi HTML untuk cegah XSS
// ==========================================
function escapeHTML(str) {
  return str.replace(/[&<>'"]/g, tag => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[tag]));
}

// ==========================================
// Manajemen UI & Animasi Loading
// ==========================================
const ui = {
  showLoading: (btnId) => {
    const btn = document.getElementById(btnId);
    btn.dataset.originalText = btn.innerText;
    btn.innerText = 'Memproses...';
    btn.disabled = true;
  },
  hideLoading: (btnId) => {
    const btn = document.getElementById(btnId);
    btn.innerText = btn.dataset.originalText;
    btn.disabled = false;
  },
  showNotif: (msg, isError = false) => {
    const notif = document.getElementById('notification');
    notif.className = isError ? 'notif-error' : 'notif-success';
    notif.innerHTML = escapeHTML(msg);
    notif.style.display = 'block';
    setTimeout(() => { notif.style.display = 'none'; }, 4000);
  },
  logIDE: (msg) => {
    document.getElementById('log-console').innerHTML += `<br>> ${escapeHTML(msg)}`;
  }
};

// ==========================================
// Core Modules (Simulasi File Arsitektur)
// ==========================================
const appModule = {
  // Modul: akun.json (Aktivasi Instan)
  activateAccount: async () => {
    const email = document.getElementById('email-input').value;
    if (!email) return ui.showNotif('Email wajib diisi!', true);

    ui.showLoading('btn-activate');
    try {
      const response = await fetch(GAS_URL, {
        method: 'POST',
        body: JSON.stringify({ action: 'activateAccount', email: email })
      });
      const result = await response.json();
      
      if (result.status === 'success') {
        ui.showNotif(result.data.message);
        document.getElementById('panel-activation').classList.add('hidden');
        document.getElementById('panel-ide').classList.remove('hidden');
        
        const badge = document.getElementById('status-badge');
        badge.innerText = 'Status: Active (Pro)';
        badge.classList.add('active');
        ui.logIDE('Sistem siap. Silakan buat project baru.');
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      ui.showNotif('Gagal mengaktifkan akun: ' + error.message, true);
    } finally {
      ui.hideLoading('btn-activate');
    }
  },

  // Modul: browser-ide.js & project-builder.js
  saveProject: async () => {
    const projectId = document.getElementById('project-id').value;
    const code = document.getElementById('code-editor').value;
    if (!projectId || !code) return ui.showNotif('ID dan Kode tidak boleh kosong!', true);

    ui.showLoading('btn-save');
    ui.logIDE('Menyimpan perubahan ke Cloud...');
    
    try {
      const response = await fetch(GAS_URL, {
        method: 'POST',
        body: JSON.stringify({ action: 'saveProject', projectId: projectId, code: code, email: document.getElementById('email-input').value })
      });
      const result = await response.json();
      
      if (result.status === 'success') {
        ui.logIDE('Tersimpan! ' + result.data.message);
        ui.showNotif('File utama berhasil disimpan.');
      }
    } catch (error) {
      ui.logIDE('[ERROR] Gagal menyimpan.');
      ui.showNotif('Error menyimpan project', true);
    } finally {
      ui.hideLoading('btn-save');
    }
  },

  // Modul: publish.sh (Preview & Publish)
  publishProject: async () => {
    const projectId = document.getElementById('project-id').value;
    ui.showLoading('btn-publish');
    ui.logIDE('Menyiapkan URL publik dan server preview...');
    
    try {
      const response = await fetch(GAS_URL, {
        method: 'POST',
        body: JSON.stringify({ action: 'publishProject', projectId: projectId })
      });
      const result = await response.json();
      
      if (result.status === 'success') {
        ui.logIDE(`Publish sukses! URL Publik: ${result.data.url}`);
        ui.showNotif('Project siap diakses publik!');
      }
    } catch (error) {
      ui.showNotif('Gagal melakukan publish.', true);
    } finally {
      ui.hideLoading('btn-publish');
    }
  }
};
