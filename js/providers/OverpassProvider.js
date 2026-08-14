 // js/providers/OverpassProvider.js

import { SearchProvider } from './SearchProvider.js';
import { Lead } from '../models/Lead.js';

const OVERPASS_ENDPOINTS = [
    'https://overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter',
    'https://overpass.private.coffee/api/interpreter',
];

const NOMINATIM_ENDPOINT =
    'https://nominatim.openstreetmap.org/search';

const GOMERIA_RADIUS = 15000;
const GENERIC_RADIUS = 10000;

const TIMEOUT_MS = 10000;

function clean(value) {
    if (value === undefined || value === null) {
        return null;
    }

    const result = String(value)
        .replace(/\s+/g, ' ')
        .trim();

    return result || null;
}

function normalize(value) {
    if (!value) return '';

    return String(value)
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();
}

function normalizePhone(phone) {
    return clean(phone);
}

function escapeRegex(value) {
    return String(value || '')
        .replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getCoordinates(element) {
    if (
        element &&
        element.lat !== undefined &&
        element.lon !== undefined
    ) {
        return {
            lat: Number(element.lat),
            lon: Number(element.lon),
        };
    }

    if (
        element?.center &&
        element.center.lat !== undefined &&
        element.center.lon !== undefined
    ) {
        return {
            lat: Number(element.center.lat),
            lon: Number(element.center.lon),
        };
    }

    return null;
}

function getTags(element) {
    return element?.tags || {};
}

function getName(tags) {
    return (
        tags.name ||
        tags['name:es'] ||
        tags.brand ||
        tags.operator ||
        null
    );
}

function isGomeria(rubro) {
    const value = normalize(rubro);

    return (
        value.includes('gomer') ||
        value.includes('neumatic') ||
        value.includes('cubierta') ||
        value.includes('llanta') ||
        value.includes('tyre') ||
        value.includes('tire')
    );
}

function looksLikeGomeria(tags) {
    const shop =
        normalize(tags.shop);

    const craft =
        normalize(tags.craft);

    const serviceVehicleTyres =
        normalize(
            tags['service:vehicle:tyres']
        );

    const service =
        normalize(tags.service);

    const carRepair =
        normalize(tags.car_repair);

    const text =
        normalize(
            [
                tags.name,
                tags['name:es'],
                tags.brand,
                tags.operator,
                tags.description,
                tags.note,
                tags['contact:name'],
            ]
                .filter(Boolean)
                .join(' ')
        );

    /*
     * Clasificación OSM directa.
     */
    if (shop === 'tyres') {
        return true;
    }

    /*
     * Reparación de vehículos con servicio
     * específico de neumáticos.
     */
    if (
        shop === 'car_repair' &&
        serviceVehicleTyres === 'yes'
    ) {
        return true;
    }

    if (
        shop === 'car_repair' &&
        (
            service === 'tyres' ||
            service === 'tyre' ||
            service === 'wheel_repair' ||
            carRepair === 'tyres' ||
            carRepair === 'tyre' ||
            carRepair === 'wheel_repair'
        )
    ) {
        return true;
    }

    /*
     * Algunos comercios pueden estar etiquetados
     * como craft=car_repair.
     */
    if (
        craft === 'car_repair' &&
        (
            text.includes('gomeria') ||
            text.includes('neumatic') ||
            text.includes('cubierta') ||
            text.includes('llanta') ||
            text.includes('tyre') ||
            text.includes('tire')
        )
    ) {
        return true;
    }

    /*
     * Último filtro por texto.
     */
    const keywords = [
        'gomeria',
        'gomería',
        'neumaticos',
        'neumáticos',
        'neumatico',
        'neumático',
        'cubiertas',
        'cubierta',
        'llantas',
        'llanta',
        'wheel repair',
        'wheel_repair',
        'tyres',
        'tyre',
    ];

    return keywords.some(
        keyword =>
            text.includes(
                normalize(keyword)
            )
    );
}

function looksLikeBusiness(tags) {
    return Boolean(
        getName(tags) ||
        tags.brand ||
        tags.operator
    );
}

async function searchNominatim(ciudad) {
    const url =
        `${NOMINATIM_ENDPOINT}?format=json&limit=1&q=` +
        encodeURIComponent(
            `${ciudad}, Buenos Aires, Argentina`
        );

    console.log(
        `[Nominatim] Buscando coordenadas para ${ciudad}`
    );

    const response =
        await fetch(
            url,
            {
                headers: {
                    'User-Agent':
                        'LeadHunter-Argentina/1.0',
                },

                cache: 'no-store',

                signal:
                    AbortSignal.timeout(
                        10000
                    ),
            }
        );

    if (!response.ok) {
        throw new Error(
            `Nominatim HTTP ${response.status}`
        );
    }

    const data =
        await response.json();

    if (
        !Array.isArray(data) ||
        data.length === 0
    ) {
        throw new Error(
            `No se encontraron coordenadas para ${ciudad}`
        );
    }

    const coordinates = {
        lat: Number(data[0].lat),
        lon: Number(data[0].lon),
    };

    console.log(
        `[OverpassProvider] Coordenadas ${ciudad}: ` +
        `${coordinates.lat}, ${coordinates.lon}`
    );

    return coordinates;
}

/*
 * Consulta pequeña y específica.
 *
 * Es importante NO juntar todas las categorías
 * de gomería en una sola consulta.
 */
function buildGomeriaQuery(
    lat,
    lon,
    type
) {
    switch (type) {

        case 'tyres':
            return `
[out:json][timeout:10];

nwr[
    "shop"="tyres"
](
    around:${GOMERIA_RADIUS},${lat},${lon}
);

out center tags;
`;

        case 'car_repair':
            return `
[out:json][timeout:10];

nwr[
    "shop"="car_repair"
](
    around:10000,${lat},${lon}
);

out center tags;
`;

        case 'craft_repair':
            return `
[out:json][timeout:10];

nwr[
    "craft"="car_repair"
](
    around:10000,${lat},${lon}
);

out center tags;
`;

        case 'tyre_service':
            return `
[out:json][timeout:10];

nwr[
    "service:vehicle:tyres"="yes"
](
    around:10000,${lat},${lon}
);

out center tags;
`;

        default:
            return null;
    }
}

function buildGenericQuery(
    lat,
    lon,
    rubro
) {
    const escapedRubro =
        escapeRegex(rubro);

    return `
[out:json][timeout:10];

(
    nwr[
        "name"~"${escapedRubro}",
        i
    ](
        around:${GENERIC_RADIUS},${lat},${lon}
    );

    nwr[
        "shop"~"${escapedRubro}",
        i
    ](
        around:${GENERIC_RADIUS},${lat},${lon}
    );

    nwr[
        "craft"~"${escapedRubro}",
        i
    ](
        around:${GENERIC_RADIUS},${lat},${lon}
    );
);

out center tags;
`;
}

async function queryOverpass(
    endpoint,
    query
) {
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
                        'text/plain',

                    'Accept':
                        'application/json',

                    'User-Agent':
                        'LeadHunter-Argentina/1.0',
                },

                body: query,

                cache: 'no-store',

                signal:
                    AbortSignal.timeout(
                        TIMEOUT_MS
                    ),
            }
        );

    if (!response.ok) {
        throw new Error(
            `Overpass HTTP ${response.status}`
        );
    }

    return await response.json();
}

/*
 * Ejecuta una consulta intentando los endpoints
 * disponibles.
 */
async function executeQuery(query) {

    for (
        let i = 0;
        i < OVERPASS_ENDPOINTS.length;
        i++
    ) {
        try {

            const data =
                await queryOverpass(
                    OVERPASS_ENDPOINTS[i],
                    query
                );

            console.log(
                `[OverpassProvider] Consulta OK ` +
                `en servidor ${i + 1}`
            );

            return data;

        } catch (error) {

            console.warn(
                `[OverpassProvider] Servidor ${i + 1} falló:`,
                error?.message || error
            );
        }
    }

    console.warn(
        '[OverpassProvider] Ningún servidor respondió esta consulta.'
    );

    return null;
}

function elementToLead(
    element,
    filters,
    coordinates
) {
    const tags =
        getTags(element);

    const name =
        getName(tags);

    if (!name) {
        return null;
    }

    if (!looksLikeBusiness(tags)) {
        return null;
    }

    if (
        isGomeria(filters.rubro) &&
        !looksLikeGomeria(tags)
    ) {
        return null;
    }

    const elementCoordinates =
        getCoordinates(element) ||
        coordinates;

    const addressParts = [
        tags['addr:street'],
        tags['addr:housenumber'],
    ]
        .filter(Boolean);

    const address =
        addressParts.length > 0
            ? addressParts.join(' ')
            : clean(tags.address);

    const website =
        tags.website ||
        tags['contact:website'] ||
        null;

    const email =
        tags.email ||
        tags['contact:email'] ||
        null;

    const phone =
        tags.phone ||
        tags['contact:phone'] ||
        null;

    const whatsapp =
        tags['contact:whatsapp'] ||
        null;

    const facebook =
        tags.facebook ||
        tags['contact:facebook'] ||
        null;

    const instagram =
        tags.instagram ||
        tags['contact:instagram'] ||
        null;

    const linkedin =
        tags.linkedin ||
        tags['contact:linkedin'] ||
        null;

    const lead =
        new Lead({
            nombre:
                clean(name),

            provincia:
                filters.provincia &&
                filters.provincia !== 'todas'
                    ? filters.provincia
                    : 'Buenos Aires',

            ciudad:
                filters.ciudad,

            rubro:
                filters.rubro,

            email:
                clean(email),

            telefono:
                normalizePhone(phone),

            whatsapp:
                clean(whatsapp),

            website:
                clean(website),

            redes: {
                facebook:
                    clean(facebook),

                instagram:
                    clean(instagram),

                linkedin:
                    clean(linkedin),
            },

            fuentes: [
                'OpenStreetMap',
            ],

            coordenadas:
                elementCoordinates
                    ? {
                        lat:
                            elementCoordinates.lat,

                        lon:
                            elementCoordinates.lon,
                    }
                    : null,
        });

    lead.direccion =
        address;

    lead.osmId =
        element.id;

    lead.osmType =
        element.type;

    lead.osmTags =
        tags;

    return lead;
}

function addElementsToLeads(
    data,
    leads,
    filters,
    coordinates
) {
    const elements =
        Array.isArray(data?.elements)
            ? data.elements
            : [];

    console.log(
        `[OverpassProvider] Elementos recibidos: ${elements.length}`
    );

    for (const element of elements) {

        try {

            const lead =
                elementToLead(
                    element,
                    filters,
                    coordinates
                );

            if (lead) {
                leads.push(lead);
            }

        } catch (error) {

            console.warn(
                '[OverpassProvider] Error convirtiendo elemento:',
                error?.message || error
            );
        }
    }

    return elements.length;
}

export class OverpassProvider
    extends SearchProvider {

    constructor() {

        super(
            'OpenStreetMap / Overpass'
        );
    }

    async search(filters) {

        const rubro =
            String(
                filters?.rubro || ''
            ).trim();

        const ciudad =
            String(
                filters?.ciudad || ''
            ).trim();

        if (!rubro || !ciudad) {

            console.warn(
                '[OverpassProvider] Faltan rubro o ciudad.'
            );

            return [];
        }

        console.log(
            `[OverpassProvider] Buscando "${rubro}" en "${ciudad}"`
        );

        let coordinates;

        try {

            coordinates =
                await searchNominatim(
                    ciudad
                );

        } catch (error) {

            console.error(
                '[OverpassProvider] Error Nominatim:',
                error?.message || error
            );

            return [];
        }

        const leads = [];

        /*
         * GOMERÍAS
         *
         * Ejecutamos consultas independientes.
         * Esto evita que una consulta enorme provoque
         * timeout del servidor Overpass.
         */
        if (isGomeria(rubro)) {

            const queries = [
                {
                    name:
                        'shop=tyres',

                    query:
                        buildGomeriaQuery(
                            coordinates.lat,
                            coordinates.lon,
                            'tyres'
                        ),
                },

                {
                    name:
                        'shop=car_repair',

                    query:
                        buildGomeriaQuery(
                            coordinates.lat,
                            coordinates.lon,
                            'car_repair'
                        ),
                },

                {
                    name:
                        'craft=car_repair',

                    query:
                        buildGomeriaQuery(
                            coordinates.lat,
                            coordinates.lon,
                            'craft_repair'
                        ),
                },

                {
                    name:
                        'service:vehicle:tyres=yes',

                    query:
                        buildGomeriaQuery(
                            coordinates.lat,
                            coordinates.lon,
                            'tyre_service'
                        ),
                },
            ];

            for (const item of queries) {

                console.log(
                    `========== OVERPASS: ${item.name} ==========`
                );

                const data =
                    await executeQuery(
                        item.query
                    );

                if (!data) {
                    console.warn(
                        `[OverpassProvider] Sin respuesta para ${item.name}`
                    );

                    continue;
                }

                addElementsToLeads(
                    data,
                    leads,
                    filters,
                    coordinates
                );
            }

        } else {

            /*
             * Búsqueda genérica.
             */
            const query =
                buildGenericQuery(
                    coordinates.lat,
                    coordinates.lon,
                    rubro
                );

            console.log(
                '========== OVERPASS QUERY =========='
            );

            console.log(query);

            console.log(
                '====================================='
            );

            const data =
                await executeQuery(
                    query
                );

            if (data) {

                addElementsToLeads(
                    data,
                    leads,
                    filters,
                    coordinates
                );
            }
        }

        /*
         * Deduplicación local.
         */
        const unique =
            new Map();

        for (const lead of leads) {

            const key =
                [
                    normalize(
                        lead.nombre
                    ),

                    normalize(
                        lead.ciudad
                    ),

                    normalize(
                        lead.telefono
                    ),
                ].join('|');

            if (!unique.has(key)) {

                unique.set(
                    key,
                    lead
                );
            }
        }

        const finalLeads =
            [...unique.values()];

        console.log(
            `[OverpassProvider] ${finalLeads.length} resultados reales encontrados`
        );

        for (const lead of finalLeads) {

            console.log(
                `[OverpassProvider] Lead: ${lead.nombre} | ` +
                `tel=${lead.telefono || 'no'} | ` +
                `web=${lead.website || 'no'} | ` +
                `direccion=${lead.direccion || 'no'}`
            );
        }

        return finalLeads;
    }
}
