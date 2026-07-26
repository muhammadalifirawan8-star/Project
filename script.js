// [WAJIB] GANTI DENGAN URL WEB APP GOOGLE APPS SCRIPT ANDA YANG BARU
const GAS_URL = 'https://script.google.com/macros/s/AKfycbxNnQq3trqAD-BgFErQ9jegrKyZGCZ9CVJvn9Yya5Tfwb5PoSJjgSniPYdywd8Gkm08/exec';

const escapeHTML = (str) => String(str).replace(/[&<>'"]/g, 
  tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag])
);

const ui = {
  log: (msg, type = 'success') => {
    const term = document.getElementById('terminal-body');
    const time = new Date().toLocaleTimeString('id-ID', { hour12: false });
    let colorClass = '';
    if (type === 'error') colorClass = 'log-error';
    if (type === 'info') colorClass = 'log-info';
    if (type === 'warn') colorClass = 'log-warn';
    
    term.innerHTML += `<div class="${colorClass}">[${time}] > ${escapeHTML(msg)}</div>`;
    term.scrollTop = term.scrollHeight;
  },
  toast: (msg, type = 'success') => {
    const t = document.getElementById('toast');
    t.innerText = msg;
    t.className = `toast ${type}`;
    t.classList.remove('hidden');
    setTimeout(() => t.classList.add('hidden'), 3000);
  },
  loading: (btnId, text) => {
    const btn = document.getElementById(btnId);
    btn.dataset.original = btn.innerHTML;
    btn.innerHTML = `⏳ ${text}`;
    btn.disabled = true;
  },
  reset: (btnId) => {
    const btn = document.getElementById(btnId);
    if (btn.dataset.original) btn.innerHTML = btn.dataset.original;
    btn.disabled = false;
  }
};

const app = {
  email: '',
  activeFile: 'src/App.jsx',
  isPreviewMode: false,
  
  // Boilerplate Kebal Vercel
  files: {
    'package.json': JSON.stringify({
      "name": "appcraft-pro", "version": "1.0.0", "type": "module",
      "scripts": { "dev": "vite", "build": "vite build", "preview": "vite preview" },
      "dependencies": { "react": "^18.2.0", "react-dom": "^18.2.0", "lucide-react": "^0.263.1" },
      "devDependencies": { "@vitejs/plugin-react": "^4.2.1", "vite": "^5.1.4", "tailwindcss": "^3.4.1", "autoprefixer": "^10.4.18", "postcss": "^8.4.35" }
    }, null, 2),
    'vite.config.js': "import { defineConfig } from 'vite';\nimport react from '@vitejs/plugin-react';\n\nexport default defineConfig({\n  plugins: [react()],\n});",
    'index.html': "<!DOCTYPE html>\n<html lang=\"en\">\n  <head>\n    <meta charset=\"UTF-8\" />\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />\n    <title>AppCraft App</title>\n  </head>\n  <body>\n    <div id=\"root\"></div>\n    <script type=\"module\" src=\"/src/main.jsx\"></script>\n  </body>\n</html>",
    'src/main.jsx': "import React from 'react';\nimport ReactDOM from 'react-dom/client';\nimport App from './App.jsx';\nimport './index.css';\n\nReactDOM.createRoot(document.getElementById('root')).render(\n  <React.StrictMode>\n    <App />\n  </React.StrictMode>,\n);",
    'src/index.css': "@tailwind base;\n@tailwind components;\n@tailwind utilities;\n\nbody { background-color: #f8fafc; }",
    'src/App.jsx': "import React from 'react';\n\nexport default function App() {\n  return (\n    <div className=\"min-h-screen flex items-center justify-center bg-slate-900\">\n      <h1 className=\"text-3xl font-bold text-blue-400\">Aplikasi Siap Di-build!</h1>\n    </div>\n  );\n}"
  },

  renderExplorer: () => {
    const container = document.getElementById('file-tree-container');
    container.innerHTML = '';
    Object.keys(app.files).sort().forEach(filename => {
      const el = document.createElement('div');
      el.className = `file-item ${filename === app.activeFile ? 'active' : ''}`;
      el.innerText = filename.includes('/') ? `📄 ${filename.split('/').pop()}` : `📁 ${filename}`;
      el.onclick = () => app.switchFile(filename);
      container.appendChild(el);
    });
  },

  switchFile: (filename) => {
    if (app.isPreviewMode) app.togglePreview(); // Matikan preview jika ganti file
    
    if (!app.files[filename] && app.files[filename] !== '') return;
    app.activeFile = filename;
    document.getElementById('input-code').value = app.files[filename];
    document.getElementById('active-tab-name').innerText = filename;
    app.renderExplorer();
  },

  initEditor: () => {
    document.getElementById('input-code').addEventListener('input', (e) => {
      app.files[app.activeFile] = e.target.value;
    });
  },

  callServer: async (payload) => {
    try {
      const response = await fetch(GAS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (data.status !== 'success') throw new Error(data.message || 'Server menolak permintaan');
      return data;
    } catch (error) {
      throw new Error(error.message);
    }
  },

  parseXMLResponse: (text) => {
    const xmlRegex = /<file\s+(?:path|name)=["']?([^"'>]+)["']?>([\s\S]*?)<\/file>/gi;
    let match;
    let fileFound = false;

    while ((match = xmlRegex.exec(text)) !== null) {
      const filepath = match[1].trim();
      const content = match[2].trim();
      app.files[filepath] = content;
      fileFound = true;
      ui.log(`File di-generate/diperbarui: ${filepath}`, 'info');
    }

    // FALLBACK: Jika AI membandel pakai Markdown
    if (!fileFound) {
      ui.log('Mendeteksi format Markdown. Mengaktifkan sistem Penyelamat...', 'warn');
      const mdRegex = /```(?:jsx|js|javascript|tsx|html|css)?\s*([\s\S]*?)```/gi;
      const mdMatches = [...text.matchAll(mdRegex)];

      if (mdMatches.length > 0) {
        let rescuedCode = mdMatches[0][1].trim();
        app.files['src/App.jsx'] = rescuedCode;
        fileFound = true;
        ui.log('Berhasil menyelamatkan kode AI ke src/App.jsx', 'success');
      }
    }
    return fileFound;
  },

  // Fitur Canggih: Mengubah kode React menjadi HTML murni yang bisa di-render langsung di browser tanpa Vercel
  togglePreview: () => {
    const frame = document.getElementById('preview-frame');
    const editor = document.getElementById('input-code');
    const btn = document.getElementById('btn-preview');
    
    app.isPreviewMode = !app.isPreviewMode;

    if (app.isPreviewMode) {
      // Masuk Mode Preview
      frame.classList.remove('hidden');
      editor.classList.add('hidden');
      btn.innerHTML = '💻 Kembali ke Editor';
      btn.classList.add('btn-primary');
      btn.classList.remove('btn-outline');
      
      ui.log('Memuat React Babel Engine & Tailwind CSS...', 'info');
      
      // Mengambil kode React dan membersihkan statement import/export agar bisa dibaca Babel Standalone
      let appCode = app.files['src/App.jsx'] || '';
      appCode = appCode.replace(/import .*?;/g, '').replace(/export default/g, '');
      let cssCode = app.files['src/index.css'] || '';

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8" />
          <script src="https://cdn.tailwindcss.com"></script>
          <style>${cssCode}</style>
          <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
          <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
          <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
          <!-- Ikon Lucide untuk UI mewah -->
          <script src="https://unpkg.com/lucide@latest"></script>
        </head>
        <body>
          <div id="root"></div>
          <script type="text/babel">
            // Injecting React App
            ${appCode}
            
            // Rendering to DOM
            const root = ReactDOM.createRoot(document.getElementById('root'));
            root.render(<App />);
          </script>
        </body>
        </html>
      `;
      frame.srcdoc = htmlContent;
    } else {
      // Kembali ke Mode Kode
      frame.classList.add('hidden');
      editor.classList.remove('hidden');
      btn.innerHTML = '👀 Live Preview';
      btn.classList.remove('btn-primary');
      btn.classList.add('btn-outline');
      frame.srcdoc = ''; // Bersihkan memori iframe
    }
  },

  activate: async () => {
    const email = document.getElementById('input-email').value.trim();
    if (!email) return ui.toast('Email wajib diisi', 'error');

    ui.loading('btn-auth', 'Memverifikasi...');
    try {
      await app.callServer({ action: 'activateAccount', email });
      app.email = email;
      
      document.getElementById('panel-auth').classList.add('hidden');
      document.getElementById('panel-explorer').classList.remove('hidden');
      document.getElementById('panel-config').classList.remove('hidden');
      document.getElementById('panel-ai').classList.remove('hidden');
      document.getElementById('user-badge').innerText = 'Online';
      document.getElementById('user-badge').classList.add('active');
      
      app.renderExplorer();
      app.switchFile('src/App.jsx');
      ui.log('Autentikasi sukses. Modul IDE aktif.');
      ui.toast('Selamat datang di Workspace!');
    } catch (err) {
      ui.log(`Akses Ditolak: ${err.message}`, 'error');
    } finally {
      ui.reset('btn-auth');
    }
  },

  askGemini: async () => {
    const prompt = document.getElementById('input-prompt').value.trim();
    if (!prompt) return ui.toast('Tuliskan ide aplikasi Anda.', 'error');
    
    ui.loading('btn-ai', 'AI Merakit Kode...');
    ui.log('Mengirim blueprint ke mesin Gemini 3.6 Flash...', 'warn');
    
    try {
      const res = await app.callServer({ action: 'askGemini', prompt });
      const success = app.parseXMLResponse(res.data.answer);
      
      if (success) {
        app.renderExplorer();
        app.switchFile('src/App.jsx');
        ui.toast('Aplikasi berhasil dirakit!', 'success');
        ui.log('Selesai! Klik tombol "👀 Live Preview" untuk melihat hasilnya.');
      } else {
        ui.log('Sistem Penyelamat Gagal: AI merespons dengan format yang sama sekali tidak ada kodenya.', 'error');
      }
    } catch (err) {
      ui.log(`AI Error: ${err.message}`, 'error');
    } finally {
      ui.reset('btn-ai');
    }
  },

  auditCode: async () => {
    ui.loading('btn-audit', 'Audit Menyeluruh...');
    ui.log('Memulai operasi bedah kode (Audit & Debugging)...', 'warn');
    
    try {
      const res = await app.callServer({ action: 'auditCode', files: app.files });
      const success = app.parseXMLResponse(res.data.answer);
      if (success) {
        app.renderExplorer();
        app.switchFile(app.activeFile); 
        ui.toast('Bug berhasil dibersihkan!', 'success');
        ui.log('Audit selesai. Struktur file telah disinkronkan.');
      }
    } catch (err) {
      ui.log(`Audit Gagal: ${err.message}`, 'error');
    } finally {
      ui.reset('btn-audit');
    }
  },

  save: async () => {
    const id = document.getElementById('input-project').value.trim();
    if (!id) return ui.toast('Masukkan Project ID (Slug)', 'error');

    ui.loading('btn-save', 'Sync...');
    try {
      await app.callServer({ action: 'saveProject', projectId: id, email: app.email, code: JSON.stringify(app.files) });
      ui.toast('Tersimpan di Cloud!');
      ui.log(`Proyek [${id}] sukses disinkronkan ke server.`);
    } catch (err) {
      ui.log(`Gagal menyimpan: ${err.message}`, 'error');
    } finally {
      ui.reset('btn-save');
    }
  },

  publish: () => {
    const id = document.getElementById('input-project').value.trim();
    if (!id) return ui.toast('Simpan proyek terlebih dahulu!', 'error');
    ui.log('Menginisiasi proses Deployment Vercel...', 'warn');
    window.open(`${GAS_URL}?id=${id}`, '_blank');
  }
};

document.addEventListener('DOMContentLoaded', app.initEditor);
