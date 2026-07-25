// [WAJIB GANTI]: Masukkan URL Web App GAS Anda di bawah ini
const GAS_URL = 'https://script.google.com/macros/s/AKfycbz9eOBCKzzKs2hRp7sj3M8GOUqJpJpv_PtQj-FR4OmPndEJLjzkxnl3r0udBYQCauJH/exec';

// Keamanan: Sanitasi HTML untuk Terminal & Notifikasi
const escapeHTML = (str) => {
  return String(str).replace(/[&<>'"]/g, 
    term.scrollTop = term.scrollHeight; // Auto-scroll ke bawah
  }
};

// Event Listener agar setiap ketikan otomatis tersimpan di state
document.addEventListener('DOMContentLoaded', () => {
  const codeEditor = document.getElementById('input-code');
  codeEditor.addEventListener('input', (e) => {
    app.files[app.activeFile] = e.target.value;
  });
});

// Modul Utama Alur Kerja
const app = {
  email: '',
  activeFile: 'index.html',
  
  // State manajemen multi-file virtual memory
  files: {
    'index.html': '<!DOCTYPE html>\n<html lang="id">\n<head>\n  <meta charset="UTF-8">\n  <title>Nexus App</title>\n</head>\n<body>\n  <h1>Halo Dunia!</h1>\n</body>\n</html>',
    'style.css': '/* Tambahkan CSS Anda di sini */\nbody {\n  background: #f0f0f0;\n  font-family: sans-serif;\n}',
    'script.js': '// Tambahkan JavaScript Anda di sini\nconsole.log("App Ready");',
    '.gitignore': 'node_modules\ndist\n.env',
    '.env.example': 'VITE_API_KEY=your_api_key_here',
    'package.json': '{\n  "name": "nexus-pro-app",\n  "version": "1.0.0",\n  "scripts": { "dev": "vite" }\n}',
    'vite.config.js': 'import { defineConfig } from "vite";\nexport default defineConfig({});',
    'vercel.json': '{\n  "version": 2\n}',
    'README.md': '# Project Baru\n\nDibuat dengan Nexus IDE Serverless.',
    'public/favicon.ico': '<!-- icon binary data -->',
    'public/manifest.json': '{\n  "name": "Nexus PWA App"\n}',
    'public/robots.txt': 'User-agent: *\nAllow: /',
    'src/App.jsx': 'import React from "react";\n\nexport default function App() {\n  return <div>Welcome to React</div>;\n}',
    'src/main.jsx': 'import React from "react";\nimport ReactDOM from "react-dom/client";\nimport App from "./App";\n\nReactDOM.createRoot(document.getElementById("root")).render(<App />);'
  },

  switchFile: (filename) => {
    // 1. Simpan nama file aktif
    app.activeFile = filename;
    
    // 2. Ganti konten textarea dengan isi file
    document.getElementById('input-code').value = app.files[filename] || '';
    document.getElementById('active-tab-name').innerText = filename;
    
    // 3. Perbarui gaya visual di panel Sidebar
    document.querySelectorAll('.file-tree .file').forEach(el => el.classList.remove('active-file'));
    const activeEl = document.querySelector(`.file-tree .file[data-file="${filename}"]`);
    if (activeEl) activeEl.classList.add('active-file');
    
    ui.log(`Membuka file: ${filename}`);
  },
  
  activate: async () => {
    const emailInput = document.getElementById('input-email').value.trim();
    if (!emailInput) return ui.toast('Email tidak boleh kosong', 'error');

    ui.loading('btn-auth', 'Memproses...');
    try {
      const res = await callServer({ action: 'activateAccount', email: emailInput });
      
      if (res.status === 'success') {
        app.email = emailInput;
        document.getElementById('panel-auth').classList.add('hidden');
        document.getElementById('panel-explorer').classList.remove('hidden');
        document.getElementById('panel-config').classList.remove('hidden');
        document.getElementById('panel-ai').classList.remove('hidden');
        
        const badge = document.getElementById('user-badge');
        badge.innerText = 'Online';
        ui.log('Autentikasi berhasil. Workspace siap.');
        
        // Memuat konten index.html secara default
        app.switchFile('index.html');
      } else {
        throw new Error(res.message);
      }
    } catch (err) {
      ui.toast('Gagal autentikasi', 'error');
      ui.log(`Gagal: ${err.message}`, 'error');
    } finally {
      ui.reset('btn-auth');
    }
  },

  save: async () => {
    const id = document.getElementById('input-project').value.trim();
    
    // Menyimpan SELURUH FILE dalam format JSON ke server
    const codePayload = JSON.stringify(app.files);
    
    if (!id) return ui.toast('Project ID harus diisi', 'error');

    ui.loading('btn-save', 'Menyimpan...');
    ui.log('Mengompilasi seluruh file ke Cloud Serverless...');
    
    try {
      const response = await fetch(GAS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        redirect: 'follow',
        body: JSON.stringify({ action: 'saveProject', projectId: id, email: app.email, code: codePayload })
      });
      
      if (res.status === 'success') {
        ui.toast('Berhasil disimpan');
        ui.log(`Project [${id}] berhasil disinkronisasi ke Cloud.`);
      } else {
        throw new Error(res.message);
      }
    } catch (err) {
      ui.toast('Gagal menyimpan', 'error');
      ui.log(`Save Error: ${err.message}`, 'error');
    } finally {
      ui.reset('btn-save');
    }
  },

  publish: () => {
    const id = document.getElementById('input-project').value.trim();
    if (!id) return ui.toast('Tentukan Project ID dan simpan terlebih dahulu', 'error');
    
    const publicUrl = `${GAS_URL}?id=${id}`;
    ui.log(`Memulai server publik di tab baru...`);
    window.open(publicUrl, '_blank');
  },

  askGemini: async () => {
    const promptInput = document.getElementById('input-prompt').value.trim();
    if (!promptInput) return ui.toast('Masukkan instruksi untuk AI terlebih dahulu.', 'error');
    
    ui.loading('btn-ai', 'AI Berpikir...');
    ui.log('Memanggil Gemini AI (Ini mungkin memakan waktu beberapa detik)...', 'info');
    
    try {
      const res = await callServer({ action: 'askGemini', prompt: promptInput });
      
      if (res.status === 'success') {
        const codeEditor = document.getElementById('input-code');
        // Inject hasil ke file yang sedang AKTIP saat ini
        codeEditor.value += `\n\n/* Generated by Gemini AI */\n${res.data.answer}`;
        app.files[app.activeFile] = codeEditor.value; // Simpan ke state
        
        ui.toast('Kode berhasil di-generate!', 'success');
        ui.toast('Kode berhasil dibuat!', 'success');
        ui.log('AI selesai bekerja. Kode disuntikkan ke Editor.', 'success');
        document.getElementById('input-prompt').value = '';
      } else {
        throw new Error(res.message);
      }
    } catch (err) {
      ui.toast('AI gagal merespons', 'error');
      ui.log(`AI Error: ${err.message}`, 'error');
    } finally {
      ui.reset('btn-ai');
    }
  }
};
