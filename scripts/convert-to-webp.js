/**
 * BEKA AUTO EXPORT — Conversion images → WebP
 * Usage: node scripts/convert-to-webp.js
 *
 * - Scans images/ for jpg/jpeg/png files
 * - Converts each to .webp (quality 85)
 * - Updates all _vehicules/*.md references
 * - Deletes the original files
 */

const sharp  = require('sharp');
const fs     = require('fs');
const path   = require('path');

const IMAGES_DIR   = path.join(__dirname, '..', 'images');
const VEHICULES_DIR = path.join(__dirname, '..', '_vehicules');
const CONVERTIBLE  = ['.jpg', '.jpeg', '.png'];

async function run() {
    // 1. Find all non-webp images
    const files = fs.readdirSync(IMAGES_DIR).filter(f => {
        const ext = path.extname(f).toLowerCase();
        return CONVERTIBLE.includes(ext);
    });

    if (files.length === 0) {
        console.log('✓ No images to convert — all already .webp');
        return;
    }

    console.log(`Found ${files.length} image(s) to convert:\n`);

    const renamed = {}; // { 'images/old.jpg': 'images/new.webp' }

    // 2. Convert each image
    for (const file of files) {
        const srcPath  = path.join(IMAGES_DIR, file);
        const baseName = path.basename(file, path.extname(file));
        const newFile  = baseName + '.webp';
        const dstPath  = path.join(IMAGES_DIR, newFile);

        // Skip if webp already exists with same name
        if (fs.existsSync(dstPath)) {
            console.log(`  SKIP  ${file} → ${newFile} (already exists)`);
            renamed[`images/${file}`] = `images/${newFile}`;
            fs.unlinkSync(srcPath);
            continue;
        }

        try {
            const before = fs.statSync(srcPath).size;
            await sharp(srcPath).webp({ quality: 85 }).toFile(dstPath);
            const after = fs.statSync(dstPath).size;
            const saved = Math.round((1 - after / before) * 100);

            fs.unlinkSync(srcPath);

            renamed[`images/${file}`] = `images/${newFile}`;
            console.log(`  ✓  ${file} → ${newFile}  (${Math.round(before/1024)}KB → ${Math.round(after/1024)}KB, -${saved}%)`);
        } catch (err) {
            console.error(`  ✗  ${file} — Error: ${err.message}`);
        }
    }

    // 3. Update .md files
    if (Object.keys(renamed).length === 0) return;

    const mdFiles = fs.readdirSync(VEHICULES_DIR).filter(f => f.endsWith('.md'));
    let mdUpdated = 0;

    for (const mdFile of mdFiles) {
        const mdPath = path.join(VEHICULES_DIR, mdFile);
        let content  = fs.readFileSync(mdPath, 'utf8');
        let changed  = false;

        for (const [oldPath, newPath] of Object.entries(renamed)) {
            if (content.includes(oldPath)) {
                content = content.split(oldPath).join(newPath);
                changed = true;
            }
        }

        if (changed) {
            fs.writeFileSync(mdPath, content, 'utf8');
            console.log(`  ↺  Updated: _vehicules/${mdFile}`);
            mdUpdated++;
        }
    }

    console.log(`\nDone. ${Object.keys(renamed).length} image(s) converted, ${mdUpdated} .md file(s) updated.`);
    console.log('→ Run: git add -A && git commit -m "Convert images to webp"');
}

run().catch(err => {
    console.error('Fatal error:', err.message);
    process.exit(1);
});
