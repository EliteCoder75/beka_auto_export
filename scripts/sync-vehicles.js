#!/usr/bin/env node

/**
 * Script pour synchroniser les véhicules du CMS vers data.js
 * Fusionne les véhicules de base avec ceux ajoutés via le CMS
 */

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const VEHICLES_DIR = path.join(__dirname, '..', '_vehicules');
const BASE_VEHICLES_FILE = path.join(__dirname, '..', 'js', 'vehicles-base.js');
const OUTPUT_FILE = path.join(__dirname, '..', 'js', 'data.js');

// Charger les véhicules de base depuis vehicles-base.js
function loadBaseVehicles() {
    if (!fs.existsSync(BASE_VEHICLES_FILE)) {
        console.log('⚠️  Fichier vehicles-base.js introuvable. Utilisation d\'un tableau vide.');
        return [];
    }

    try {
        const baseContent = fs.readFileSync(BASE_VEHICLES_FILE, 'utf8');
        // Extraire le tableau vehiclesData du fichier
        const match = baseContent.match(/const vehiclesData = (\[[\s\S]*?\]);/);
        if (match && match[1]) {
            return eval(match[1]); // Parse le tableau JavaScript
        }
    } catch (error) {
        console.error('Erreur lors du chargement des véhicules de base:', error.message);
    }
    return [];
}

// Lire tous les fichiers Markdown dans _vehicules/
function loadVehiclesFromMarkdown() {
    if (!fs.existsSync(VEHICLES_DIR)) {
        console.log('ℹ️  Le dossier _vehicules/ n\'existe pas encore.');
        return [];
    }

    const files = fs.readdirSync(VEHICLES_DIR).filter(file => file.endsWith('.md'));

    if (files.length === 0) {
        console.log('ℹ️  Aucun véhicule dans _vehicules/');
        return [];
    }

    const vehicles = files.map(file => {
        const filePath = path.join(VEHICLES_DIR, file);
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const { data } = matter(fileContent);

        return {
            id: data.id,
            brand: data.brand,
            model: data.model,
            year: data.year,
            price: data.price,
            mileage: data.mileage,
            fuel: data.fuel,
            transmission: data.transmission,
            power: data.power,
            types: data.types || ['occasion'], // Par défaut occasion
            destination: data.destination,
            image: data.image,
            description: data.description,
            features: data.features || []
        };
    });

    console.log(`✅ Chargé ${vehicles.length} véhicule(s) depuis le CMS`);
    return vehicles;
}

// Fusionner les véhicules de base avec ceux du CMS
function mergeVehicles(baseVehicles, cmsVehicles) {
    // Les véhicules de base sont toujours conservés
    const merged = [...baseVehicles];
    const baseIds = new Set(baseVehicles.map(v => v.id));

    // Ajouter ou mettre à jour les véhicules du CMS
    for (const cmsVehicle of cmsVehicles) {
        if (!baseIds.has(cmsVehicle.id)) {
            // Nouveau véhicule du CMS : ajouter
            merged.push(cmsVehicle);
        } else {
            // Véhicule existe dans la base : le remplacer par la version CMS (mise à jour)
            const index = merged.findIndex(v => v.id === cmsVehicle.id);
            if (index !== -1) {
                merged[index] = cmsVehicle;
            }
        }
    }

    // Note: Les véhicules qui ne sont ni dans base ni dans CMS sont automatiquement exclus
    // Car on part de baseVehicles et on ajoute seulement les cmsVehicles actuels

    // Trier par ID
    return merged.sort((a, b) => a.id - b.id);
}

// Générer le fichier data.js
function generateDataJS(vehicles) {
    const template = `/**
 * BEKA AUTO EXPORT - Données des véhicules
 * Généré automatiquement depuis les fichiers CMS
 *
 * SYSTÈME DE TAGS:
 * - "neuf" : Véhicule neuf 2025-2026 avec 0 km (tous carburants)
 * - "recent" : Véhicule de moins de 3 ans (2023-2025, km > 0, Essence/Électrique/Hybride uniquement)
 * - "occasion" : Véhicule d'occasion (kilométrage > 0, tous carburants)
 *
 * Une voiture peut avoir PLUSIEURS tags:
 * - Neuf : ["neuf"] uniquement (2025-2026, 0 km, tous carburants)
 * - Moins de 3 ans : ["recent", "occasion"] (2023-2025, km > 0, Essence/Électrique/Hybride UNIQUEMENT)
 * - Occasion : ["occasion"] uniquement (avant 2023 OU Diesel avec km > 0)
 *
 * ⚠️ RÈGLE IMPORTANTE: Les véhicules DIESEL avec kilométrage ne peuvent JAMAIS être "recent"
 */

const vehiclesData = ${JSON.stringify(vehicles, null, 4)};

// Fonction pour obtenir tous les véhicules
function getAllVehicles() {
    return vehiclesData;
}

// Fonction pour filtrer les véhicules (AVEC SUPPORT DES TAGS MULTIPLES)
function filterVehicles(filters) {
    let filtered = vehiclesData;

    if (filters.type) {
        // Filtre par type : vérifie si le type recherché est dans le tableau "types"
        filtered = filtered.filter(v => v.types.includes(filters.type));
    }

    if (filters.destination) {
        filtered = filtered.filter(v => v.destination === filters.destination);
    }

    if (filters.brand) {
        filtered = filtered.filter(v => v.brand.toLowerCase().includes(filters.brand.toLowerCase()));
    }

    if (filters.minPrice) {
        filtered = filtered.filter(v => v.price >= parseInt(filters.minPrice));
    }

    if (filters.maxPrice) {
        filtered = filtered.filter(v => v.price <= parseInt(filters.maxPrice));
    }

    if (filters.fuel) {
        filtered = filtered.filter(v => v.fuel === filters.fuel);
    }

    if (filters.transmission) {
        filtered = filtered.filter(v => v.transmission === filters.transmission);
    }

    return filtered;
}

// Fonction pour obtenir les véhicules en vedette (aléatoire)
function getFeaturedVehicles(count = 6) {
    const shuffled = [...vehiclesData].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}

// Fonction pour obtenir un véhicule par ID
function getVehicleById(id) {
    return vehiclesData.find(v => v.id === parseInt(id));
}

// Fonction pour formater le prix
function formatPrice(price) {
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 0
    }).format(price);
}

// Fonction pour formater le kilométrage
function formatMileage(mileage) {
    if (mileage === 0) return 'Neuf';
    return new Intl.NumberFormat('fr-FR').format(mileage) + ' km';
}

// Fonction pour obtenir le badge du type de véhicule (PREMIER TAG)
function getVehicleTypeBadge(types) {
    // Prioriser "neuf" si présent
    if (types.includes('neuf')) return 'Neuf';
    if (types.includes('recent')) return 'Moins de 3 ans';
    if (types.includes('occasion')) return 'Occasion';
    return types[0] || '';
}

// Fonction pour obtenir la destination
function getDestinationLabel(destination) {
    const labels = {
        export: 'Export',
        algerie: 'Algérie',
        europe: 'Europe'
    };
    return labels[destination] || destination;
}
`;

    fs.writeFileSync(OUTPUT_FILE, template, 'utf8');
    console.log(`✅ Fichier data.js mis à jour avec ${vehicles.length} véhicule(s)`);
}

// Exécuter le script
try {
    console.log('🔄 Synchronisation des véhicules...');

    const baseVehicles = loadBaseVehicles();
    console.log(`📦 Chargé ${baseVehicles.length} véhicule(s) de base`);

    const cmsVehicles = loadVehiclesFromMarkdown();

    const allVehicles = mergeVehicles(baseVehicles, cmsVehicles);
    console.log(`🔀 Fusion: ${allVehicles.length} véhicule(s) au total`);

    generateDataJS(allVehicles);
    console.log('✨ Synchronisation terminée!');
} catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error(error.stack);
    process.exit(1);
}
