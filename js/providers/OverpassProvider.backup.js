// js/providers/OverpassProvider.js

import { SearchProvider } from './SearchProvider.js';
import { Lead } from '../models/Lead.js';

const OVERPASS_ENDPOINTS = [
    'https://overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter',
    'https://overpass.private.coffee/api/interpreter',
];

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

    ferretería: {
        shop: 'hardware'
    },

    gomeria: {
        shop: 'tyres'
    },

    gomería: {
        shop: 'tyres'
    },

    neumaticos: {
        shop: 'tyres'
    },

    neumáticos: {
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

    panadería: {
        shop: 'bakery'
    },

    libreria: {
        shop: 'books'
    },

    librería: {
        shop: 'books'
    },

    kiosco: {
        shop: 'convenience'
    },

    peluqueria: {
        shop: 'hairdresser'
    },

    peluquería: {
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

    café: {
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

export class OverpassProvider extends SearchProvider {

    constructor() {
        super('Overpass (OpenStreetMap)');
    }

    async search(filters) {

        const rubro = String(
            filters.rubro || ''
        )
            .trim()
            .toLowerCase();

        const ciudad = String(
            filters.ciudad || ''
        )
            .trim();

        console.log(
            `[OverpassProvider] Buscando "${rubro}" en "${ciudad}"`
        );

        /*
         * ========================================
         * 1. GEOCODIFICAR CIUDAD
         * ========================================
         */

        let lat;
        let lon;

        try {

            const geoUrl =
                'https://nominatim.openstreetmap.org/search?' +
                new URLSearchParams({
                    q: `${ciudad}, Argentina`,
                    format: 'json',
                    limit: '1',
                    countrycodes: 'ar'
                });

            const geoResponse = await fetch(
                geoUrl,
                {
                    headers: {
                        'User-Agent':
                            'LeadHunterArgentina/1.0'
                    },
                    cache: 'no-store',
                    signal: AbortSignal.timeout(10000)
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
                    `[OverpassProvider] No se encontraron coordenadas para ${ciudad}`
                );

                return [];
            }

            lat = Number(geoData[0].lat);
            lon = Number(geoData[0].lon);

            console.log(
                `[OverpassProvider] Coordenadas ${ciudad}: ${lat}, ${lon}`
            );

        } catch (error) {

            console.error(
                '[OverpassProvider] Error Nominatim:',
                error
            );

            return [];
        }

        /*
         * ========================================
         * 2. DETERMINAR CATEGORÍA OSM
         * ========================================
         */

        const category =
            CATEGORY_MAP[rubro];

        if (!category) {

            console.warn(
                `[OverpassProvider] Rubro no mapeado: ${rubro}`
            );

            return [];
        }

        /*
         * ========================================
         * 3. CONSTRUIR CONSULTA
         * ========================================
         */

        const queryParts = [];

        if (category.shop) {

            queryParts.push(
                `node["shop"="${category.shop}"](around:15000,${lat},${lon});`
            );

            queryParts.push(
                `way["shop"="${category.shop}"](around:15000,${lat},${lon});`
            );

            queryParts.push(
                `relation["shop"="${category.shop}"](around:15000,${lat},${lon});`
            );
        }

        if (category.amenity) {

            queryParts.push(
                `node["amenity"="${category.amenity}"](around:15000,${lat},${lon});`
            );

            queryParts.push(
                `way["amenity"="${category.amenity}"](around:15000,${lat},${lon});`
            );

            queryParts.push(
                `relation["amenity"="${category.amenity}"](around:15000,${lat},${lon});`
            );
        }

        if (category.tourism) {

            queryParts.push(
                `node["tourism"="${category.tourism}"](around:15000,${lat},${lon});`
            );

            queryParts.push(
                `way["tourism"="${category.tourism}"](around:15000,${lat},${lon});`
            );

            queryParts.push(
                `relation["tourism"="${category.tourism}"](around:15000,${lat},${lon});`
            );
        }

        const query = `
[out:json][timeout:20];

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
         * ========================================
         * 4. PROBAR SERVIDORES
         * ========================================
         */

        for (const endpoint of OVERPASS_ENDPOINTS) {

            try {

                console.log(
                    `[OverpassProvider] Probando ${endpoint}`
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
                                AbortSignal.timeout(30000)
                        }
                    );

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
                 * ========================================
                 * 5. CONVERTIR RESULTADOS
                 * ========================================
                 */

                const leads = data.elements
                    .filter(
                        item =>
                            item.tags &&
                            item.tags.name
                    )
                    .map(item => {

                        const tags =
                            item.tags;

                        const itemLat =
                            item.lat ??
                            item.center?.lat ??
                            null;

                        const itemLon =
                            item.lon ??
                            item.center?.lon ??
                            null;

                        return new Lead({

                            nombre:
                                tags.name,

                            provincia:
                                filters.provincia !== 'todas'
                                    ? filters.provincia
                                    : 'Buenos Aires',

                            ciudad:
                                tags['addr:city'] ||
                                ciudad,

                            rubro:
                                filters.rubro,

                            telefono:
                                tags.phone ||
                                tags['contact:phone'] ||
                                tags['contact:mobile'] ||
                                null,

                            email:
                                tags.email ||
                                tags['contact:email'] ||
                                null,

                            website:
                                tags.website ||
                                tags['contact:website'] ||
                                null,

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
                                lat: itemLat,
                                lng: itemLon
                            }
                        });
                    });

                console.log(
                    `[OverpassProvider] ${leads.length} resultados reales encontrados`
                );

                return leads;

            } catch (error) {

                console.warn(
                    `[OverpassProvider] Falló ${endpoint}:`,
                    error
                );

            }
        }

        console.error(
            '[OverpassProvider] Todos los servidores fallaron.'
        );

        return [];
    }
}