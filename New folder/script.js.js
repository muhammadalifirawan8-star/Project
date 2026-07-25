const GAS_URL = 'GANTI_DENGAN_URL_WEB_APP_ANDA';

// --- Utilities ---
const utils = {
  // Sanitasi XSS untuk input yang akan dirender ke DOM UI (bukan iframe preview)
  escapeHTML: (str) => str.replace(/[&<>'"]/g, tag => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    }[tag])),
  
  showLoading: (msg = 'Memproses...') => {
    document.getElementById('loader-text').innerText = msg;
    document.getElementById('loader').classList.remove('hidden');
  },
  
  hideLoading: () => document.getElementById('loader').classList.add('hidden'),
  
  log: (msg, type="info") => {
    const logPanel = document.getElementById('logPanel');
    const safeMsg = utils.escapeHTML(msg);
    logPanel.innerHTML += `<br>[${new Date().toLocaleTimeString()}] ${safeMsg}`;
    logPanel.scrollTop = logPanel.scrollHeight;
  }
};

// --- Modul 1: Akun (akun.json / Aktivasi Instan) ---
const account = {
  isReady: false,
  activate: async () => {
    utils.showLoading('Mengonfirmasi pembayaran & Setup Akun (akun.json)...');
    try {
      const res = await fetch(GAS_URL, {
        method: 'POST',
        body: JSON.stringify({ action: 'activateAccount', email: 'user@bisnis.com' })
      });
      const data = await res.json();
      if(data.status === 'success') {
        account.isReady = true;
        document.getElementById('accountStatus').innerText = `✅ Akun Aktif: ${utils.escapeHTML(data.user)}`;
        document.getElementById('accountStatus').style.color = '#4CAF50';
        utils.log("Akun berhasil diaktivasi secara instan.");
      }
    } catch (error) {
      utils.log(`Error aktivasi: ${error.message}`);
    } finally {
      utils.hideLoading();
    }
  }
};

// --- Modul 2 & 3: Project Builder & Browser IDE ---
const ide = {
  currentExt: 'html',
  files: {
    html: "<h1>Halo Dunia!</h1>\n<p>Aplikasi bisnis baru siap dilaunching.</p>",
    css: "body { font-family: sans-serif; text-align: center; margin-top: 50px; }",
    js: "console.log('Aplikasi berjalan dengan baik!');"
  },
  
  init: () => {
    document.getElementById('codeEditor').value = ide.files['html'];
    document.getElementById('codeEditor').addEventListener('input', (e) => {
      ide.files[ide.currentExt] = e.target.value;
    });
  },

  switchFile: (ext) => {
    ide.currentExt = ext;
    document.getElementById('codeEditor').value = ide.files[ext];
    
    // Update UI active state
    document.querySelectorAll('.sidebar li').forEach(li => li.classList.remove('active'));
    event.target.classList.add('active');
    
    const fileNames = { html: 'index.html', css: 'style.css', js: 'script.js' };
    document.getElementById('currentFileLabel').innerText = fileNames[ext];
    utils.log(`Membuka ${fileNames[ext]}...`);
  },

  runProject: () => {
    utils.log("Menjalankan preview proyek...");
    const iframe = document.getElementById('previewFrame');
    
    // Menggabungkan HTML, CSS, JS menggunakan srcdoc untuk keamanan sandbox
    const combinedCode = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>${ide.files.css}</style>
        </head>
        <body>
          ${ide.files.html}
          <script>${ide.files.js}<\/script>
        </body>
      </html>
    `;
    iframe.srcdoc = combinedCode;
  }
};

// --- Modul 4: Publisher (publish.sh) ---
const publisher = {
  publish: async () => {
    if (!account.isReady) {
      alert("Harap aktivasi akun terlebih dahulu!");
      return;
    }
    
    utils.showLoading('Mempublikasikan proyek ke server (publish.sh)...');
    try {
      const payload = {
        action: 'saveProject',
        user: 'user@bisnis.com',
        projectName: 'Landing_Page_1',
        htmlCode: ide.files.html,
        cssCode: ide.files.css,
        jsCode: ide.files.js
      };

      const res = await fetch(GAS_URL, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if(data.status === 'success') {
        utils.log(`Sukses: ${data.message} URL Publik: https://app.namabisnisanda.com/p1`);
        alert("Proyek berhasil dipublish!");
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      utils.log(`Gagal publish: ${error.message}`);
      alert("Gagal mempublikasikan proyek.");
    } finally {
      utils.hideLoading();
    }
  }
};

// Initialize App
window.onload = () => {
  ide.init();
  utils.log("Web Builder Workspace dimuat. Sistem siap.");
};