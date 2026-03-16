/**
 * BEKA AUTO EXPORT — Script principal
 */

// ===== MODAL (index) =====
function openVehicleModal() {
    const modal = document.getElementById('vehicleModal');
    if (modal) { modal.classList.add('active'); document.body.style.overflow = 'hidden'; }
}
function closeVehicleModal() {
    const modal = document.getElementById('vehicleModal');
    if (modal) { modal.classList.remove('active'); document.body.style.overflow = ''; }
}
document.addEventListener('click', e => {
    const modal = document.getElementById('vehicleModal');
    if (modal && e.target === modal) closeVehicleModal();
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeVehicleModal(); });

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initScrollEffects();
    initFeaturedVehicles();
    initVehiclesPage();
    initOccasionsPage();
    initVehicleDetailPage();
    initReviewsCarousel();
});

// ===== NAVIGATION =====
function initNavigation() {
    const navToggle = document.getElementById('navToggle');
    const navMenu   = document.getElementById('navMenu');
    const navLinks  = document.querySelectorAll('.nav-link');

    if (navToggle) {
        navToggle.addEventListener('click', () => {
            navToggle.classList.toggle('active');
            navMenu.classList.toggle('active');
        });
    }

    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (navToggle && navToggle.classList.contains('active')) {
                navToggle.classList.remove('active');
                navMenu.classList.remove('active');
            }
        });
    });

    // Activer le lien courant
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    navLinks.forEach(link => {
        if (link.getAttribute('href') === currentPage) {
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
        }
    });
}

// ===== SCROLL =====
function initScrollEffects() {
    const header    = document.getElementById('header');
    const scrollTop = document.getElementById('scrollTop');

    const onScroll = () => {
        if (!header) return;
        if (window.scrollY > 80) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
        if (scrollTop) {
            if (window.scrollY > 400) scrollTop.classList.add('visible');
            else scrollTop.classList.remove('visible');
        }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    if (scrollTop) {
        scrollTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    }
}

// ===== VÉHICULES EN VEDETTE (index) =====
async function initFeaturedVehicles() {
    const grid   = document.getElementById('featuredVehicles');
    const noMsg  = document.getElementById('noVehiclesMsg');
    const seeAll = document.getElementById('seeAllBtn');
    if (!grid) return;

    try {
        const vehicles = await getFeaturedVehicles(6);
        if (!vehicles || vehicles.length === 0) {
            grid.style.display = 'none';
            if (noMsg) noMsg.style.display = 'block';
            if (seeAll) seeAll.style.display = 'none';
            return;
        }
        grid.innerHTML = vehicles.map(v => buildVehicleCard(v)).join('');
    } catch {
        grid.style.display = 'none';
        if (noMsg) noMsg.style.display = 'block';
        if (seeAll) seeAll.style.display = 'none';
    }
}

function buildVehicleCard(v) {
    const imgHtml = v.image
        ? `<img src="${v.image}" alt="${v.brand} ${v.model}" loading="lazy" style="width:100%;height:100%;object-fit:cover;">`
        : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:#555;font-size:2.5rem;"><i class="fas fa-car"></i></div>`;

    let badgeClass = 'badge-neuf', badgeLabel = 'Neuf';
    if (v.categorie === 'export') { badgeClass = 'badge-export'; badgeLabel = 'Export'; }
    else if (v.categorie === 'france') { badgeClass = 'badge-france'; badgeLabel = 'France'; }

    const kmSpec = v.kilometrage
        ? `<span class="vehicle-card-spec"><i class="fas fa-tachometer-alt"></i> ${Number(v.kilometrage).toLocaleString('fr-FR')} km</span>`
        : '';

    const detailUrl = `vehicule-detail.html?id=${v.id}&categorie=${v.categorie || 'neuf'}`;
    const waText = encodeURIComponent(`Bonjour, je suis intéressé(e) par le véhicule ${v.brand} ${v.model} ${v.year || ''} — réf. ${v.id}`);

    return `
    <div class="vehicle-card">
        <div class="vehicle-card-img">
            ${imgHtml}
            <span class="vehicle-card-badge ${badgeClass}">${badgeLabel}</span>
        </div>
        <div class="vehicle-card-body">
            <div class="vehicle-card-title">${v.brand} ${v.model}</div>
            <div class="vehicle-card-sub">${v.year || ''} ${v.finition ? '· ' + v.finition : ''}</div>
            <div class="vehicle-card-specs">
                ${v.fuel ? `<span class="vehicle-card-spec"><i class="fas fa-gas-pump"></i> ${v.fuel}</span>` : ''}
                ${v.transmission ? `<span class="vehicle-card-spec"><i class="fas fa-cog"></i> ${v.transmission}</span>` : ''}
                ${kmSpec}
            </div>
            <div class="vehicle-card-price">${v.price ? Number(v.price).toLocaleString('fr-FR') + ' €' : 'Prix sur demande'}</div>
            <div class="vehicle-card-actions">
                <a href="${detailUrl}" class="btn btn-outline-gold" style="width:100%;justify-content:center;">Voir détail</a>
            </div>
        </div>
    </div>`;
}

// ===== PAGE VÉHICULES NEUFS =====
async function initVehiclesPage() {
    const grid = document.getElementById('vehiclesGrid');
    if (!grid) return;

    let allVehicles = [];
    try {
        allVehicles = await getAllVehicles('neuf');
    } catch { allVehicles = []; }

    renderVehicleGrid(grid, allVehicles);
    initFilters(allVehicles, grid);
}

// ===== PAGE OCCASIONS =====
async function initOccasionsPage() {
    const gridExport = document.getElementById('vehiclesGridExport');
    if (!gridExport) return;

    let exportVehicles = [];
    try {
        exportVehicles = await getAllVehicles('export');
    } catch { exportVehicles = []; }

    renderVehicleGrid(gridExport, exportVehicles);
    initFiltersOccasions(exportVehicles, gridExport);

    const countEl = document.getElementById('resultsCount');
    if (countEl) {
        const n = exportVehicles.length;
        countEl.innerHTML = `<span class="results-count-number">${n}</span><span class="results-count-text"> véhicule${n > 1 ? 's' : ''} Export trouvé${n > 1 ? 's' : ''}</span>`;
    }
}

function renderVehicleGrid(grid, vehicles) {
    if (!vehicles || vehicles.length === 0) {
        grid.innerHTML = `
        <div class="no-vehicles">
            <i class="fas fa-car"></i>
            <h3>Aucun véhicule disponible</h3>
            <p>De nouveaux véhicules arrivent bientôt.<br>Contactez-nous pour connaître notre stock.</p>
            <a href="https://wa.me/33770048806" class="btn btn-whatsapp" target="_blank" rel="noopener">
                <i class="fab fa-whatsapp"></i> Nous contacter
            </a>
        </div>`;
        return;
    }
    grid.innerHTML = vehicles.map(v => buildCatalogueCard(v)).join('');
}

function buildCatalogueCard(v) {
    const isVendu = v.disponibilite === 'vendu';

    const imgHtml = v.image
        ? `<img src="${v.image}" alt="${v.brand} ${v.model}" loading="lazy">`
        : `<div class="vc-img-placeholder"><i class="fas fa-car"></i></div>`;

    let badgeClass = 'neuf', badgeLabel = 'Neuf';
    if (v.categorie === 'export') { badgeClass = 'export'; badgeLabel = 'Export'; }
    else if (v.categorie === 'france') { badgeClass = 'france'; badgeLabel = 'France'; }

    const dispoClass = isVendu ? 'vendu' : (v.disponibilite === 'commande' ? 'commande' : 'stock');
    const dispoLabel = isVendu ? 'Vendu' : (v.disponibilite === 'commande' ? 'Sur commande' : 'En stock');

    const soldOverlay = isVendu
        ? `<div class="vc-sold-overlay"><span>Vendu</span></div>`
        : '';

    const kmSpec = v.kilometrage
        ? `<span class="vc-spec"><i class="fas fa-tachometer-alt"></i> ${Number(v.kilometrage).toLocaleString('fr-FR')} km</span>`
        : '';

    const detailUrl = `vehicule-detail.html?id=${v.id}&categorie=${v.categorie}`;
    const waText = encodeURIComponent(`Bonjour BEKA AUTO EXPORT, je suis intéressé(e) par le véhicule :\n${v.brand} ${v.model} ${v.year || ''} (réf. ${v.id})\n\nPouvez-vous me donner plus d'informations ?`);

    const actions = isVendu
        ? `<span class="btn btn-outline-gold" style="opacity:.4;cursor:default;pointer-events:none;width:100%;justify-content:center;text-align:center;">Non disponible</span>`
        : `<a href="${detailUrl}" class="btn btn-outline-gold" style="width:100%;justify-content:center;">Voir détail</a>`;

    return `
    <div class="vc${isVendu ? ' vc--vendu' : ''}">
        <div class="vc-img">
            ${imgHtml}
            ${soldOverlay}
            <span class="vc-badge ${badgeClass}">${badgeLabel}</span>
            <span class="vc-dispo ${dispoClass}">${dispoLabel}</span>
        </div>
        <div class="vc-body">
            <div class="vc-title">${v.brand} ${v.model}${v.finition ? ' ' + v.finition : ''}${v.motor ? ' ' + v.motor : ''}</div>
            <div class="vc-sub">${v.year || ''}</div>
            <div class="vc-specs">
                ${v.fuel ? `<span class="vc-spec"><i class="fas fa-gas-pump"></i> ${v.fuel}</span>` : ''}
                ${v.transmission ? `<span class="vc-spec"><i class="fas fa-cog"></i> ${v.transmission}</span>` : ''}
                ${kmSpec}
                ${v.motor ? `<span class="vc-spec"><i class="fas fa-engine"></i> ${v.motor}</span>` : ''}
            </div>
            <div class="vc-price">${v.price ? Number(v.price).toLocaleString('fr-FR') + ' €' : 'Prix sur demande'}</div>
            <div class="vc-actions">${actions}</div>
        </div>
    </div>`;
}

// ===== FILTRES NEUFS =====
function initFilters(allVehicles, grid) {
    const brandInput = document.getElementById('filterBrand');
    const minPrice   = document.getElementById('filterMinPrice');
    const maxPrice   = document.getElementById('filterMaxPrice');
    const fuelSelect = document.getElementById('filterFuel');
    const transSelect= document.getElementById('filterTransmission');
    const resetBtn   = document.getElementById('resetFilters');
    const countEl    = document.getElementById('resultsCount');

    const applyFilters = () => {
        let filtered = [...allVehicles];
        if (brandInput && brandInput.value.trim()) {
            const q = brandInput.value.trim().toLowerCase();
            filtered = filtered.filter(v =>
                (v.brand || '').toLowerCase().includes(q) || (v.model || '').toLowerCase().includes(q)
            );
        }
        if (minPrice && minPrice.value) filtered = filtered.filter(v => (v.price || 0) >= Number(minPrice.value));
        if (maxPrice && maxPrice.value) filtered = filtered.filter(v => (v.price || 0) <= Number(maxPrice.value));
        if (fuelSelect && fuelSelect.value) filtered = filtered.filter(v => v.fuel === fuelSelect.value);
        if (transSelect && transSelect.value) filtered = filtered.filter(v => v.transmission === transSelect.value);

        renderVehicleGrid(grid, filtered);
        if (countEl) {
            countEl.innerHTML = `<span class="results-count-number">${filtered.length}</span><span class="results-count-text"> véhicule${filtered.length > 1 ? 's' : ''} trouvé${filtered.length > 1 ? 's' : ''}</span>`;
        }
    };

    [brandInput, minPrice, maxPrice, fuelSelect, transSelect].forEach(el => {
        if (el) el.addEventListener('input', applyFilters);
    });

    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            [brandInput, minPrice, maxPrice, fuelSelect, transSelect].forEach(el => { if (el) el.value = ''; });
            applyFilters();
        });
    }

    applyFilters();
}

// ===== FILTRES OCCASIONS =====
function initFiltersOccasions(allVehicles, gridExport) {
    const brandInput = document.getElementById('filterBrand');
    const maxKm      = document.getElementById('filterMaxKm');
    const minPrice   = document.getElementById('filterMinPrice');
    const maxPrice   = document.getElementById('filterMaxPrice');
    const fuelSelect = document.getElementById('filterFuel');
    const resetBtn   = document.getElementById('resetFilters');

    const applyFilters = () => {
        let filtered = [...allVehicles];
        if (brandInput && brandInput.value.trim()) {
            const q = brandInput.value.trim().toLowerCase();
            filtered = filtered.filter(v =>
                (v.brand || '').toLowerCase().includes(q) || (v.model || '').toLowerCase().includes(q)
            );
        }
        if (maxKm && maxKm.value) filtered = filtered.filter(v => (v.kilometrage || 0) <= Number(maxKm.value));
        if (minPrice && minPrice.value) filtered = filtered.filter(v => (v.price || 0) >= Number(minPrice.value));
        if (maxPrice && maxPrice.value) filtered = filtered.filter(v => (v.price || 0) <= Number(maxPrice.value));
        if (fuelSelect && fuelSelect.value) filtered = filtered.filter(v => v.fuel === fuelSelect.value);

        if (gridExport) renderVehicleGrid(gridExport, filtered);

        const countEl = document.getElementById('resultsCount');
        if (countEl) {
            const n = filtered.length;
            countEl.innerHTML = `<span class="results-count-number">${n}</span><span class="results-count-text"> véhicule${n > 1 ? 's' : ''} Export trouvé${n > 1 ? 's' : ''}</span>`;
        }
    };

    [brandInput, maxKm, minPrice, maxPrice, fuelSelect].forEach(el => {
        if (el) el.addEventListener('input', applyFilters);
    });

    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            [brandInput, maxKm, minPrice, maxPrice, fuelSelect].forEach(el => { if (el) el.value = ''; });
            applyFilters();
        });
    }

    applyFilters();
}

// ===== PAGE DÉTAIL VÉHICULE =====
async function initVehicleDetailPage() {
    const infoCard = document.getElementById('vehicleInfoCard');
    if (!infoCard) return;

    const params    = new URLSearchParams(window.location.search);
    const vehicleId = params.get('id');
    const categorie = params.get('categorie') || 'neuf';

    if (!vehicleId) {
        infoCard.innerHTML = '<p style="color:var(--text-light);padding:2rem;">Véhicule introuvable.</p>';
        return;
    }

    try {
        const vehicles = await getAllVehicles(categorie);
        const vehicle  = vehicles.find(v => String(v.id) === String(vehicleId));

        if (!vehicle) {
            infoCard.innerHTML = '<p style="color:var(--text-light);padding:2rem;">Véhicule introuvable.</p>';
            return;
        }

        document.title = `${vehicle.brand} ${vehicle.model} — BEKA AUTO EXPORT`;
        const breadcrumbTitle = document.getElementById('breadcrumbTitle');
        const breadcrumbType  = document.getElementById('breadcrumbType');
        if (breadcrumbTitle) breadcrumbTitle.textContent = `${vehicle.brand} ${vehicle.model}`;
        if (breadcrumbType) {
            const isOccasion = vehicle.categorie === 'export' || vehicle.categorie === 'france';
            breadcrumbType.textContent = isOccasion ? "Véhicules d'Occasion" : "Véhicules Neufs";
            breadcrumbType.href = isOccasion ? 'vehicules-occasions.html' : 'vehicules-neufs.html';
        }

        // Galerie
        const mainImg = document.getElementById('mainImage');
        const thumbGallery = document.getElementById('thumbnailGallery');
        const images = [vehicle.image, ...(vehicle.gallery || [])].filter(Boolean);

        if (mainImg && images.length > 0) {
            mainImg.src = images[0];
            mainImg.alt = `${vehicle.brand} ${vehicle.model}`;
        }
        if (thumbGallery && images.length > 1) {
            thumbGallery.innerHTML = images.map((img, i) => `
                <div class="thumb ${i === 0 ? 'active' : ''}" onclick="switchImage('${img}', this)">
                    <img src="${img}" alt="Photo ${i+1}">
                </div>`).join('');
        }

        // CTA WhatsApp dynamic
        const ctaWa = document.getElementById('ctaWhatsapp');
        const waText = encodeURIComponent(`Bonjour BEKA AUTO EXPORT, je suis intéressé(e) par le véhicule :\n${vehicle.brand} ${vehicle.model} ${vehicle.year || ''} (réf. ${vehicle.id})\n\nPouvez-vous me donner plus d'informations ?`);
        if (ctaWa) ctaWa.href = `https://wa.me/33770048806?text=${waText}`;

        const isVendu = vehicle.disponibilite === 'vendu';

        // Info card
        let badgeClass = 'neuf', badgeLabel = 'Neuf';
        if (vehicle.categorie === 'export') { badgeClass = 'export'; badgeLabel = 'Export Maghreb'; }
        else if (vehicle.categorie === 'france') { badgeClass = 'france'; badgeLabel = 'Occasion France'; }

        const dispoClass = vehicle.disponibilite === 'vendu' ? 'vendu' : (vehicle.disponibilite === 'commande' ? 'commande' : 'stock');
        const dispoLabel = vehicle.disponibilite === 'vendu' ? 'Vendu' : (vehicle.disponibilite === 'commande' ? 'Sur commande' : 'En stock');

        const kmRow = vehicle.kilometrage
            ? `<div class="vd-spec-item"><label>Kilométrage</label><span>${Number(vehicle.kilometrage).toLocaleString('fr-FR')} km</span></div>`
            : '';

        const soldBanner = isVendu ? `
        <div style="display:flex;align-items:center;gap:0.75rem;padding:0.9rem 1.1rem;background:rgba(239,68,68,0.12);border:1px solid rgba(239,68,68,0.35);border-radius:8px;margin-bottom:0.25rem;">
            <i class="fas fa-times-circle" style="color:#ef4444;font-size:1.1rem;flex-shrink:0;"></i>
            <p style="margin:0;font-size:0.88rem;color:#f87171;font-weight:600;">Ce véhicule a été vendu. Contactez-nous pour voir les véhicules similaires disponibles.</p>
        </div>` : '';

        const detailActions = isVendu ? `
        <div class="vd-actions">
            <a href="https://wa.me/33770048806?text=${encodeURIComponent('Bonjour BEKA AUTO EXPORT, le véhicule ' + vehicle.brand + ' ' + vehicle.model + ' ' + (vehicle.year || '') + ' est vendu. Avez-vous un modèle similaire disponible ?')}" class="btn btn-whatsapp" target="_blank" rel="noopener">
                <i class="fab fa-whatsapp"></i> Voir les véhicules similaires
            </a>
        </div>` : `
        <div class="vd-actions">
            <a href="https://wa.me/33770048806?text=${waText}" class="btn btn-whatsapp" target="_blank" rel="noopener">
                <i class="fab fa-whatsapp"></i> Demander par WhatsApp
            </a>
            <a href="tel:+33770048806" class="btn btn-phone">
                <i class="fas fa-phone"></i> 07 70 04 88 06
            </a>
        </div>`;

        infoCard.innerHTML = `
        ${soldBanner}
        <div class="vd-badge-row">
            <span class="vd-badge ${badgeClass}">${badgeLabel}</span>
            <span class="vd-badge ${dispoClass}">${dispoLabel}</span>
        </div>
        <div class="vd-title"${isVendu ? ' style="opacity:.6"' : ''}>${vehicle.brand} ${vehicle.model}${vehicle.finition ? ' ' + vehicle.finition : ''}${vehicle.motor ? ' ' + vehicle.motor : ''}</div>
        ${vehicle.year ? `<div class="vd-sub">${vehicle.year}</div>` : ''}
        <div class="vd-price"${isVendu ? ' style="color:var(--text-muted);text-decoration:line-through;"' : ''}>${vehicle.price ? Number(vehicle.price).toLocaleString('fr-FR') + ' €' : 'Prix sur demande'}</div>
        <div class="vd-specs">
            ${vehicle.year ? `<div class="vd-spec-item"><label>Année</label><span>${vehicle.year}</span></div>` : ''}
            ${vehicle.circulation_date ? `<div class="vd-spec-item"><label>Mise en circulation</label><span>${vehicle.circulation_date}</span></div>` : ''}
            ${vehicle.fuel ? `<div class="vd-spec-item"><label>Carburant</label><span>${vehicle.fuel}</span></div>` : ''}
            ${vehicle.transmission ? `<div class="vd-spec-item"><label>Boîte</label><span>${vehicle.transmission}</span></div>` : ''}
            ${vehicle.motor ? `<div class="vd-spec-item"><label>Moteur</label><span>${vehicle.motor}</span></div>` : ''}
            ${vehicle.exterior_color ? `<div class="vd-spec-item"><label>Couleur ext.</label><span>${vehicle.exterior_color}</span></div>` : ''}
            ${vehicle.interior_color ? `<div class="vd-spec-item"><label>Couleur int.</label><span>${vehicle.interior_color}</span></div>` : ''}
            ${kmRow}
        </div>
        ${vehicle.desc ? `<div class="vd-options"><h4>Options</h4><ul>${vehicle.desc.split('\n').filter(l => l.trim()).map(l => `<li>${l.trim()}</li>`).join('')}</ul></div>` : ''}
        ${detailActions}`;

    } catch (err) {
        infoCard.innerHTML = '<p style="color:var(--text-light);padding:2rem;">Impossible de charger ce véhicule.</p>';
    }
}

function switchImage(src, el) {
    const mainImg = document.getElementById('mainImage');
    if (mainImg) mainImg.src = src;
    document.querySelectorAll('.thumb').forEach(t => t.classList.remove('active'));
    if (el) el.classList.add('active');
}

// ===== CARROUSEL AVIS =====
function initReviewsCarousel() {
    // Simple — juste affichage statique, pas de JS requis pour 3 cards
}
