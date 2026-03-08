/**
 * BEKA AUTO EXPORT — Script de build
 * Copie _vehicules/ dans la fonction Netlify
 */

const fs   = require('fs');
const path = require('path');

const FUNCTION_DIR = path.join(__dirname, '../netlify/functions/vehicles');
const SOURCE_DIR   = path.join(__dirname, '../_vehicules');
const DEST_DIR     = path.join(FUNCTION_DIR, '_vehicules');

console.log('📋 BEKA AUTO EXPORT — Copie des véhicules vers la fonction Netlify...\n');

if (!fs.existsSync(SOURCE_DIR)) {
    console.log('⚠️  _vehicules/ introuvable — ignoré.');
    process.exit(0);
}

if (!fs.existsSync(DEST_DIR)) {
    fs.mkdirSync(DEST_DIR, { recursive: true });
}

const files = fs.readdirSync(SOURCE_DIR).filter(f => f.endsWith('.md'));
console.log(`📂 _vehicules — ${files.length} fichier(s):`);

files.forEach(file => {
    fs.copyFileSync(path.join(SOURCE_DIR, file), path.join(DEST_DIR, file));
    console.log(`   ✅ ${file}`);
});

console.log(`\n✨ Build terminé — ${files.length} véhicule(s) copié(s).`);
