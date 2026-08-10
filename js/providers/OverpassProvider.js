// js/providers/OverpassProvider.js

import { SearchProvider } from './SearchProvider.js';
import { Lead } from '../models/Lead.js';

/*
 * ============================================================
 * SERVIDORES OVERPASS
 * ============================================================
 *
 * Si uno está saturado o devuelve 504,
 * probamos automáticamente el siguiente.
 */
const OVERPASS_ENDPOINTS = [
    'https://overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter',
    'https://overpass.private.coffee/api/interpreter'
];

/*
 * ============================================================
 * CATEGORÍAS OSM
 * ============================================================
 */
const CATEGORY_MAP = {
    farmacia: {
        amenity: 'pharmacy'
    },

    farmacias: {
        amenity: 'pharmacy'
    },

    ferreteria: {
        shop: 'hardware'
    },

    gomeria: {
        shop: 'tyres'
    },

    neumaticos: {
        shop: 'tyres'
    },

    supermercado: {
        shop: 'supermarket'
    },

    supermercados: {
        shop: 'supermarket'
    },

    panaderia: {
        shop: 'bakery'
    },

    libreria: {
        shop: 'books'
    },

    kiosco: {
        shop: 'convenience'
    },

    peluqueria: {
        shop: 'hairdresser'
    },

    restaurante: {
        amenity: 'restaurant'
    },

    restaurant: {
        amenity: 'restaurant'
    },

    bar: {
        amenity: 'bar'
    },

    cafe: {
        amenity: 'cafe'
    },

    veterinaria: {
        amenity: 'veterinary'
    },

    veterinario: {
        amenity: 'veterinary'
    },

    hotel: {
        tourism: 'hotel'
    }
};

/*
 * ============================================================
 * NORMALIZACIÓN DE TEXTO
 * ============================================================
 *
 * Permite que:
 *
 * farmacia
 * Farmacia
 * FARMACIA
 *
 * sean tratados igual.
 *
 * También elimina acentos.
 */
function normalizeText(value) {

    return String(value || '')
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
}

/*
 * ============================================================
 * NOMBRE DE PROVINCIA
 * ============================================================
 */
function getProvinceName(provincia) {
    const map = {
        bsas: 'Buenos Aires',
        caba: 'Ciudad Autónoma de Buenos Aires',
        cordoba: 'Córdoba',
        'santa-fe': 'Santa Fe',
        'entre-rios': 'Entre Ríos',
        mendoza: 'Mendoza',
        tucuman: 'Tucumán',
        salta: 'Salta',
        neuquen: 'Neuquén',
        chubut: 'Chubut',
        'rio-negro': 'Río Negro',
        misiones: 'Misiones',
        corrientes: 'Corrientes',
        chaco: 'Chaco',
        formosa: 'Formosa',
        jujuy: 'Jujuy',
        catamarca: 'Catamarca',
        'la-rioja': 'La Rioja',
        'san-juan': 'San Juan',
        'san-luis': 'San Luis',
        'santa-cruz': 'Santa Cruz',
        'tierra-del-fuego': 'Tierra del Fuego'
    };

    return map[provincia] || provincia;
}

/*
 * ============================================================
 * PROVIDER
 * ============================================================
 */
export class OverpassProvider extends SearchProvider {

    constructor() {
        super('Overpass (OpenStreetMap)');
    }

    async search(filters) {

        const rubroOriginal = String(
            filters.rubro || ''
        ).trim();

        const rubro = normalizeText(rubroOriginal);

        const ciudad = String(
            filters.ciudad || ''
        ).trim();

        console.log(
            `[OverpassProvider] Buscando "${rubroOriginal}" en "${ciudad}"`
        );

        /*
         * ========================================================
         * 1. GEOCODIFICAR CIUDAD
         * ========================================================
         */

        let lat;
        let lon;

        try {

            const params = new URLSearchParams({
                q: `${ciudad}, Argentina`,
                format: 'json',
                limit: '1',
                countrycodes: 'ar',
                addressdetails: '1'
            });

            const geoUrl =
                `https://nominatim.openstreetmap.org/search?${params.toString()}`;

            console.log(
                `[Nominatim] Buscando coordenadas para ${ciudad}`
            );

            const geoResponse = await fetch(
                geoUrl,
                {
                    headers: {
                        'User-Agent':
                            'LeadHunterArgentina/1.0'
                    },

                    cache: 'no-store',

                    signal:
                        AbortSignal.timeout(10000)
                }
            );

            if (!geoResponse.ok) {

                throw new Error(
                    `Nominatim HTTP ${geoResponse.status}`
                );
            }

            const geoData =
                await geoResponse.json();

            if (
                !Array.isArray(geoData) ||
                geoData.length === 0
            ) {

                console.warn(
                    `[Nominatim] No se encontraron coordenadas para ${ciudad}`
                );

                return [];
            }

            lat = Number(
                geoData[0].lat
            );

            lon = Number(
                geoData[0].lon
            );

            console.log(
                `[Nominatim] ${ciudad}: ${lat}, ${lon}`
            );

        } catch (error) {

            console.error(
                '[OverpassProvider] Error Nominatim:',
                error
            );

            return [];
        }

        /*
         * ========================================================
         * 2. BUSCAR CATEGORÍA OSM
         * ========================================================
         */

        const category =
            CATEGORY_MAP[rubro];

        if (!category) {

            console.warn(
                `[OverpassProvider] Rubro no mapeado: "${rubroOriginal}"`
            );

            return [];
        }

        /*
         * ========================================================
         * 3. RADIO DE BÚSQUEDA
         * ========================================================
         *
         * 10 km inicialmente.
         *
         * Es bastante más liviano que los 15 km anteriores.
         */

        const radius = 10000;

        /*
         * ========================================================
         * 4. CONSTRUIR QUERY
         * ========================================================
         *
         * Eliminamos RELATION porque genera bastante carga
         * y para negocios normalmente node + way es suficiente.
         */

        const queryParts = [];

        if (category.shop) {

            queryParts.push(
                `node["shop"="${category.shop}"](around:${radius},${lat},${lon});`
            );

            queryParts.push(
                `way["shop"="${category.shop}"](around:${radius},${lat},${lon});`
            );
        }

        if (category.amenity) {

            queryParts.push(
                `node["amenity"="${category.amenity}"](around:${radius},${lat},${lon});`
            );

            queryParts.push(
                `way["amenity"="${category.amenity}"](around:${radius},${lat},${lon});`
            );
        }

        if (category.tourism) {

            queryParts.push(
                `node["tourism"="${category.tourism}"](around:${radius},${lat},${lon});`
            );

            queryParts.push(
                `way["tourism"="${category.tourism}"](around:${radius},${lat},${lon});`
            );
        }

        const query = `
[out:json][timeout:15];

(
    ${queryParts.join('\n    ')}
);

out center tags;
`;

        console.log(
            '========== OVERPASS QUERY =========='
        );

        console.log(query);

        console.log(
            '====================================='
        );

        /*
         * ========================================================
         * 5. PROBAR SERVIDORES
         * ========================================================
         */

        for (
            let index = 0;
            index < OVERPASS_ENDPOINTS.length;
            index++
        ) {

            const endpoint =
                OVERPASS_ENDPOINTS[index];

            try {

                console.log(
                    `[OverpassProvider] Servidor ${index + 1}/${OVERPASS_ENDPOINTS.length}: ${endpoint}`
                );

                const response =
                    await fetch(
                        endpoint,
                        {
                            method: 'POST',

                            headers: {
                                'Content-Type':
                                    'application/x-www-form-urlencoded',

                                'Accept':
                                    'application/json',

                                'User-Agent':
                                    'LeadHunterArgentina/1.0'
                            },

                            body:
                                'data=' +
                                encodeURIComponent(query),

                            signal:
                                AbortSignal.timeout(20000)
                        }
                    );

                /*
                 * ------------------------------------------------
                 * Si devuelve 429 / 502 / 503 / 504,
                 * probamos automáticamente otro servidor.
                 * ------------------------------------------------
                 */

                if (!response.ok) {

                    console.warn(
                        `[OverpassProvider] ${endpoint} respondió HTTP ${response.status}`
                    );

                    continue;
                }

                const data =
                    await response.json();

                if (
                    !data ||
                    !Array.isArray(data.elements)
                ) {

                    console.warn(
                        `[OverpassProvider] Respuesta inválida de ${endpoint}`
                    );

                    continue;
                }

                /*
                 * =================================================
                 * 6. CONVERTIR OSM -> LEAD
                 * =================================================
                 */

                const leads =
                    data.elements

                        .filter(
                            item =>
                                item.tags &&
                                item.tags.name
                        )

                        .map(item => {

                            const tags =
                                item.tags || {};

                            const itemLat =
                                item.lat ??
                                item.center?.lat ??
                                null;

                            const itemLon =
                                item.lon ??
                                item.center?.lon ??
                                null;

                            const phone =
                                tags.phone ||
                                tags['contact:phone'] ||
                                tags['contact:mobile'] ||
                                null;

                            const email =
                                tags.email ||
                                tags['contact:email'] ||
                                null;

                            const website =
                                tags.website ||
                                tags['contact:website'] ||
                                null;

                            return new Lead({

                                nombre:
                                    tags.name,

                                provincia:
                                    tags['addr:state'] ||
                                    getProvinceName(
                                        filters.provincia
                                    ),

                                ciudad:
                                    tags['addr:city'] ||
                                    tags['addr:town'] ||
                                    tags['addr:municipality'] ||
                                    tags['addr:suburb'] ||
                                    ciudad,

                                rubro:
                                    rubroOriginal,

                                telefono:
                                    phone,

                                email:
                                    email,

                                website:
                                    website,

                                redes: {

                                    facebook:
                                        tags.facebook ||
                                        tags['contact:facebook'] ||
                                        null,

                                    instagram:
                                        tags.instagram ||
                                        tags['contact:instagram'] ||
                                        null
                                },

                                fuentes: [
                                    this.name
                                ],

                                coordenadas: {

                                    lat:
                                        itemLat,

                                    lng:
                                        itemLon
                                }
                            });
                        });

                console.log(
                    `[OverpassProvider] ${leads.length} resultados reales encontrados`
                );

                /*
                 * =================================================
                 * 7. INFORMACIÓN ÚTIL PARA DEBUG
                 * =================================================
                 */

                if (leads.length === 0) {

                    console.warn(
                        `[OverpassProvider] El servidor respondió correctamente pero no encontró ${rubroOriginal} en ${ciudad}`
                    );
                }

                /*
                 * Servidor exitoso.
                 */
                return leads;

            } catch (error) {

                console.warn(
                    `[OverpassProvider] Falló ${endpoint}:`,
                    error
                );

                /*
                 * No hacemos throw.
                 *
                 * Probamos el siguiente servidor.
                 */
            }
        }

        /*
         * ========================================================
         * 8. TODOS LOS SERVIDORES FALLARON
         * ========================================================
         */

        console.error(
            '[OverpassProvider] Todos los servidores Overpass fallaron.'
        );

        return [];
    }
}