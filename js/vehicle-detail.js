/**
 * BEKA AUTO EXPORT - Vehicle Detail Page Script
 * Displays detailed information about a specific vehicle
 */

document.addEventListener('DOMContentLoaded', function() {
    loadVehicleDetail();
    initContactModal();
});

// ===== CONTACT MODAL =====
function initContactModal() {
    const contactBtn = document.querySelector('.btn-contact-info');
    const modal = document.getElementById('contactModal');
    const modalOverlay = document.getElementById('modalOverlay');
    const modalClose = document.getElementById('modalClose');
    const emailOptionBtn = document.getElementById('emailOptionBtn');
    const backToOptions = document.getElementById('backToOptions');
    const contactOptions = document.querySelector('.contact-options');
    const emailFormContainer = document.getElementById('emailFormContainer');
    const contactForm = document.getElementById('contactForm');

    // Open modal
    if (contactBtn) {
        contactBtn.addEventListener('click', function() {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
            // Reset form state
            contactForm.reset();
            contactForm.style.display = '';
            document.getElementById('formSuccess').style.display = 'none';
            document.getElementById('backToOptions').style.display = '';
            const submitBtn = document.getElementById('submitBtn');
            if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Envoyer le message'; }
            showOptions();
        });
    }

    // Close modal
    function closeModal() {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }

    if (modalClose) {
        modalClose.addEventListener('click', closeModal);
    }

    if (modalOverlay) {
        modalOverlay.addEventListener('click', closeModal);
    }

    // Close on Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeModal();
        }
    });

    // Show email form
    if (emailOptionBtn) {
        emailOptionBtn.addEventListener('click', function() {
            contactOptions.classList.add('hidden');
            emailFormContainer.classList.add('active');
            // Pre-fill vehicle info
            const vehicleTitle = document.getElementById('vehicleTitle')?.textContent || '';
            const vehiclePrice = document.getElementById('vehiclePrice')?.textContent || '';
            document.getElementById('vehicleInfo').value = `${vehicleTitle} - ${vehiclePrice}`;
            // Pre-fill message with vehicle info
            const messageField = document.getElementById('contactMessage');
            if (messageField && !messageField.value) {
                messageField.value = `Bonjour,\n\nJe suis intéressé(e) par le véhicule ${vehicleTitle} affiché à ${vehiclePrice}.\n\nMerci de me contacter pour plus d'informations.`;
            }
        });
    }

    // Back to options
    function showOptions() {
        contactOptions.classList.remove('hidden');
        emailFormContainer.classList.remove('active');
    }

    if (backToOptions) {
        backToOptions.addEventListener('click', showOptions);
    }

    // Form submission
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();

            const submitBtn = document.getElementById('submitBtn');
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Envoi en cours...';

            const formData = new FormData(contactForm);

            fetch('/vehicule-detail.html', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams(formData).toString()
            })
            .then(response => {
                if (response.ok) {
                    contactForm.style.display = 'none';
                    document.getElementById('formSuccess').style.display = 'block';
                    document.getElementById('backToOptions').style.display = 'none';
                } else {
                    throw new Error('Erreur');
                }
            })
            .catch(() => {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Envoyer le message';
                alert('Une erreur est survenue. Veuillez nous contacter par WhatsApp.');
            });
        });
    }
}

async function loadVehicleDetail() {
    const urlParams = new URLSearchParams(window.location.search);
    const vehicleId = urlParams.get('id');

    if (!vehicleId) {
        window.location.href = '/vehicules-neufs.html';
        return;
    }

    try {
        let vehicle = null;

        // Essayer localStorage d'abord (navigation rapide depuis catalogue)
        const vehicleData = localStorage.getItem('currentVehicle');
        if (vehicleData) {
            const cached = JSON.parse(vehicleData);
            if (String(cached.id) === String(vehicleId)) {
                vehicle = cached;
            }
        }

        // Fallback : charger depuis l'API si localStorage absent ou ID différent
        if (!vehicle) {
            vehicle = await getVehicleById(vehicleId);
        }

        if (!vehicle) {
            window.location.href = '/vehicules-neufs.html';
            return;
        }

        localStorage.removeItem('currentVehicle');

        displayVehicleDetail(vehicle);
        loadColorVariants(vehicle);
        loadSimilarVehicles(vehicle);

    } catch (error) {
        window.location.href = '/vehicules-neufs.html';
    }
}

function displayVehicleDetail(vehicle) {
    // Set page title
    const title = `${vehicle.brand} ${vehicle.model}${vehicle.finition ? ' ' + vehicle.finition : ''}`;
    document.getElementById('pageTitle').textContent = `${title} - BEKA AUTO EXPORT`;
    document.title = `${title} - BEKA AUTO EXPORT`;

    // Set breadcrumb
    document.getElementById('breadcrumbTitle').textContent = title;

    const typeLink = document.getElementById('breadcrumbType');
    typeLink.textContent = 'Véhicules Neufs';
    typeLink.href = 'vehicules-neufs.html';

    // Set main image
    const mainImage = document.getElementById('mainImage');
    mainImage.src = vehicle.image;
    mainImage.alt = title;

    // Set gallery
    const thumbnailGallery = document.getElementById('thumbnailGallery');
    thumbnailGallery.innerHTML = '';

    // Add main image as first thumbnail
    addThumbnail(vehicle.image, 0, true);

    // Add gallery images if available
    if (vehicle.gallery && Array.isArray(vehicle.gallery)) {
        vehicle.gallery.forEach((img, index) => {
            addThumbnail(img.image || img, index + 1, false);
        });
    }

    // Set vehicle info
    document.getElementById('vehicleTitle').textContent = title.toUpperCase();
    document.getElementById('vehicleSubtitle').textContent =
        `${vehicle.year} • ${vehicle.destination === 'export' ? 'Export' : 'Europe'}${vehicle.exterior_color ? ' • ' + vehicle.exterior_color : ''}`;
    document.getElementById('vehiclePrice').textContent = `€${Number(vehicle.price).toLocaleString('fr-FR')}.00`;

    // Set description fields
    document.getElementById('descYear').textContent = vehicle.year || '-';
    document.getElementById('descBrand').textContent = vehicle.brand || '-';
    document.getElementById('descModel').textContent = vehicle.model || '-';
    document.getElementById('descFinition').textContent = vehicle.finition || '-';
    document.getElementById('descTransmission').textContent = vehicle.transmission || '-';
    document.getElementById('descMotor').textContent = vehicle.motor || '-';
    document.getElementById('descFuel').textContent = vehicle.fuel || '-';
    document.getElementById('descExteriorColor').textContent = vehicle.exterior_color || '-';
    document.getElementById('descInteriorColor').textContent = vehicle.interior_color || '-';

    // Options & équipements depuis le champ description
    const desc = vehicle.description || '';
    if (desc.trim()) {
        const lines = desc.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        const section = document.getElementById('vehicleOptionsSection');
        const list = document.getElementById('vehicleOptionsList');
        list.innerHTML = lines.map(l => `<li>${l}</li>`).join('');
        section.style.display = 'block';
    }
}

function addThumbnail(imageSrc, index, isActive) {
    const thumbnailGallery = document.getElementById('thumbnailGallery');
    const thumbnail = document.createElement('div');
    thumbnail.className = `thumbnail ${isActive ? 'active' : ''}`;
    thumbnail.innerHTML = `<img src="${imageSrc}" alt="Image ${index + 1}">`;

    thumbnail.addEventListener('click', function() {
        // Update main image
        document.getElementById('mainImage').src = imageSrc;

        // Update active thumbnail
        document.querySelectorAll('.thumbnail').forEach(t => t.classList.remove('active'));
        thumbnail.classList.add('active');
    });

    thumbnailGallery.appendChild(thumbnail);
}

// ===== SIMILAR VEHICLES =====
async function loadSimilarVehicles(currentVehicle) {
    try {
        const allVehicles = await getAllVehicles();

        // Filter: same type (occasion/recent/neuf), exclude current vehicle
        const similar = allVehicles.filter(v => {
            if (v.id === currentVehicle.id) return false;
            if (!v.types || !currentVehicle.types) return false;
            return v.types.some(t => currentVehicle.types.includes(t));
        });

        if (similar.length === 0) return;

        // Shuffle and take up to 4
        const shuffled = similar.sort(() => Math.random() - 0.5);
        const selected = shuffled.slice(0, 4);

        const grid = document.getElementById('similarVehiclesGrid');
        const section = document.getElementById('similarVehiclesSection');

        selected.forEach(vehicle => {
            const card = createVehicleCard(vehicle);
            grid.appendChild(card);
        });

        section.style.display = '';
    } catch (error) {
        // Silently fail - similar vehicles is not critical
    }
}

async function loadColorVariants(currentVehicle) {
    try {
        const allVehicles = await getAllVehicles();

        // Détection auto : même marque + modèle + finition, couleur différente
        const variants = allVehicles.filter(v =>
            String(v.id) !== String(currentVehicle.id) &&
            v.brand.toLowerCase() === currentVehicle.brand.toLowerCase() &&
            v.model.toLowerCase() === currentVehicle.model.toLowerCase() &&
            (v.finition || '').toLowerCase() === (currentVehicle.finition || '').toLowerCase()
        );

        if (variants.length === 0) return;

        const picker = document.getElementById('colorVariantsPicker');
        const grid = document.getElementById('colorVariantsGrid');
        if (!picker || !grid) return;

        picker.style.display = 'block';
        grid.innerHTML = '';

        // Vignette du véhicule courant (active)
        grid.appendChild(buildVariantThumb(currentVehicle.image, currentVehicle.exterior_color, true));

        // Vignettes des autres couleurs
        variants.forEach(v => {
            const item = buildVariantThumb(v.image, v.exterior_color, false);
            item.addEventListener('click', () => {
                document.getElementById('mainImage').src = v.image;
                localStorage.setItem('currentVehicle', JSON.stringify(v));
                window.location.href = `vehicule-detail.html?id=${v.id}`;
            });
            grid.appendChild(item);
        });
    } catch (error) {
        // Silently fail
    }
}

function buildVariantThumb(imgSrc, colorLabel, isActive) {
    const item = document.createElement('div');
    item.className = `color-variant-item${isActive ? ' active' : ''}`;

    const thumb = document.createElement('div');
    thumb.className = 'color-variant-thumb';
    thumb.innerHTML = `<img src="${imgSrc || ''}" alt="${colorLabel || ''}">`;

    const label = document.createElement('div');
    label.className = 'color-variant-name';
    label.textContent = colorLabel || '';

    item.appendChild(thumb);
    item.appendChild(label);
    return item;
}
