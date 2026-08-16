// js/providers/DuckDuckGoProvider.js

import { SearchProvider } from './SearchProvider.js';
import { Lead } from '../models/Lead.js';

const DUCKDUCKGO_ENDPOINT =
    'https://html.duckduckgo.com/html/';

const MAX_RESULTS_PER_QUERY = 10;
const MAX_TOTAL_RESULTS = 20;

const IGNORED_DOMAINS = [
    'duckduckgo.com',
    'google.com',
    'bing.com',
    'yahoo.com',
    'youtube.com',
    'tiktok.com',
    'twitter.com',
    'x.com',
    'wikipedia.org',
    'mercadolibre.com.ar',
    'argentina.gob.ar'
];

const DIRECTORY_DOMAINS = [
    'firmania.com.ar',
    'guiaurbana.com.ar',
    'paginasamarillas.com.ar',
    'cylex.com.ar',
    'argentinafirmas.com',
    'indizze.com',
    'hotfrog.com.ar',
    'yelp.com.ar',
    'tripadvisor.com.ar'
];

function decodeHtml(text) {
    if (!text) return '';

    return String(text)
        .replace(/&amp;/gi, '&')
        .replace(/&quot;/gi, '"')
        .replace(/&#x27;/gi, "'")
        .replace(/&#39;/gi, "'")
        .replace(/&lt;/gi, '<')
        .replace(/&gt;/gi, '>')
        .replace(/&nbsp;/gi, ' ')
        .replace(/&#(\d+);/g, (_, code) =>
            String.fromCharCode(Number(code))
        )
        .replace(/&#x([0-9a-f]+);/gi, (_, code) =>
            String.fromCharCode(parseInt(code, 16))
        );
}

function cleanText(text) {
    if (!text) return '';

    return decodeHtml(
        String(text)
            .replace(/<script[\s\S]*?<\/script>/gi, ' ')
            .replace(/<style[\s\S]*?<\/style>/gi, ' ')
            .replace(/<[^>]*>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
    );
}

function normalize(value) {
    if (!value) return '';

    return String(value)
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function extractRealUrl(href) {
    if (!href) return null;

    try {
        let value = decodeHtml(href);

        if (
            value.startsWith('//')
        ) {
            value = `https:${value}`;
        }

        if (
            value.startsWith('/')
        ) {
            value =
                `https://html.duckduckgo.com${value}`;
        }

        const url =
            new URL(value);

        const uddg =
            url.searchParams.get('uddg');

        if (uddg) {
            return decodeURIComponent(uddg);
        }

        return url.toString();

    } catch {
        return null;
    }
}

function getHostname(url) {
    if (!url) return null;

    try {
        return new URL(url)
            .hostname
            .toLowerCase()
            .replace(/^www\./, '');

    } catch {
        return null;
    }
}

function isIgnoredDomain(url) {
    const hostname =
        getHostname(url);

    if (!hostname) return true;

    return IGNORED_DOMAINS.some(
        domain =>
            hostname === domain ||
            hostname.endsWith(`.${domain}`)
    );
}

function isDirectoryDomain(url) {
    const hostname =
        getHostname(url);

    if (!hostname) return false;

    return DIRECTORY_DOMAINS.some(
        domain =>
            hostname === domain ||
            hostname.endsWith(`.${domain}`)
    );
}

function detectSocialNetworks(url) {
    const result = {
        facebook: null,
        instagram: null,
        linkedin: null
    };

    if (!url) {
        return result;
    }

    const lower =
        url.toLowerCase();

    if (lower.includes('facebook.com')) {
        result.facebook = url;
    }

    if (lower.includes('instagram.com')) {
        result.instagram = url;
    }

    if (lower.includes('linkedin.com')) {
        result.linkedin = url;
    }

    return result;
}

function normalizeBusinessName(title) {
    let name =
        cleanText(title);

    if (!name) {
        return 'Empresa';
    }

    name =
        name
            .replace(/\s*[-|–—]\s*Google.*$/i, '')
            .replace(/\s*[-|–—]\s*Facebook.*$/i, '')
            .replace(/\s*[-|–—]\s*Instagram.*$/i, '')
            .replace(/\s*[-|–—]\s*LinkedIn.*$/i, '')
            .replace(/\s*[-|–—]\s*Sitio Oficial.*$/i, '')
            .replace(/\s*[-|–—]\s*Página Oficial.*$/i, '')
            .trim();

    if (name.length > 120) {
        name =
            name
                .split(/\s+[|]\s+/)[0]
                .trim();
    }

    return name || 'Empresa';
}

function isRelevantText(
    title,
    snippet,
    url,
    rubro,
    ciudad
) {
    const text =
        normalize(
            `${title} ${snippet} ${url}`
        );

    const normalizedRubro =
        normalize(rubro);

    const normalizedCiudad =
        normalize(ciudad);

    /*
     * Coincidencia directa.
     */
    if (
        normalizedRubro &&
        text.includes(normalizedRubro)
    ) {
        return true;
    }

    if (
        normalizedCiudad &&
        text.includes(normalizedCiudad)
    ) {
        return true;
    }

    /*
     * Variantes útiles para gomerías.
     */
    const tireKeywords = [
        'gomeria',
        'gomerias',
        'neumatico',
        'neumaticos',
        'cubierta',
        'cubiertas',
        'llanta',
        'llantas',
        'tire',
        'tyres',
        'vulcanizacion'
    ];

    if (
        normalizedRubro.includes('gomer') ||
        normalizedRubro.includes('neumatic') ||
        normalizedRubro.includes('cubierta') ||
        normalizedRubro.includes('llanta') ||
        normalizedRubro.includes('tyre')
    ) {
        return tireKeywords.some(
            keyword =>
                text.includes(
                    normalize(keyword)
                )
        );
    }

    /*
     * Para búsquedas genéricas aceptamos
     * rubro o ciudad.
     */
    return false;
}

function createResult(
    href,
    title,
    snippet,
    rubro,
    ciudad
) {
    const url =
        extractRealUrl(href);

    if (!url) {
        return null;
    }

    if (isIgnoredDomain(url)) {
        return null;
    }

    const cleanTitle =
        cleanText(title);

    const cleanSnippet =
        cleanText(snippet);

    if (!cleanTitle) {
        return null;
    }

    if (
        !isRelevantText(
            cleanTitle,
            cleanSnippet,
            url,
            rubro,
            ciudad
        )
    ) {
        return null;
    }

    return {
        title: cleanTitle,
        url,
        snippet: cleanSnippet,
        domain: getHostname(url),
        isDirectory:
            isDirectoryDomain(url)
    };
}

/*
 * Parser principal.
 *
 * DuckDuckGo HTML puede cambiar ligeramente
 * la estructura. Por eso buscamos enlaces
 * result__a y no dependemos únicamente de
 * bloques .result.
 */
function parseDuckDuckGoHtml(
    html,
    rubro,
    ciudad
) {
    const results = [];

    if (!html) {
        return results;
    }

    /*
     * DuckDuckGo puede cambiar las clases HTML.
     * Primero intentamos el formato clásico.
     */
    const patterns = [
        /<a[^>]*class=["'][^"']*result__a[^"']*["'][^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi,
        /<a[^>]*href=["']([^"']+)["'][^>]*class=["'][^"']*result__a[^"']*["'][^>]*>([\s\S]*?)<\/a>/gi
    ];

    for (const anchorRegex of patterns) {
        let match;

        while (
            (match = anchorRegex.exec(html)) !== null
        ) {
            const href = match[1];
            const title = match[2];

            const context = html.slice(
                match.index,
                Math.min(
                    html.length,
                    match.index + 5000
                )
            );

            const snippetMatch =
                context.match(
                    /class=["'][^"']*result__snippet[^"']*["'][^>]*>([\s\S]*?)(?:<\/a>|<\/div>)/i
                );

            const snippet =
                snippetMatch
                    ? snippetMatch[1]
                    : '';

            const result =
                createResult(
                    href,
                    title,
                    snippet,
                    rubro,
                    ciudad
                );

            if (result) {
                results.push(result);
            }

            if (
                results.length >=
                MAX_RESULTS_PER_QUERY
            ) {
                return results;
            }
        }
    }

    /*
     * Parser alternativo:
     * busca enlaces externos y toma el texto
     * del enlace como nombre potencial.
     */
    if (!results.length) {
        console.log(
            '[DuckDuckGoProvider] Parser clásico sin resultados. Activando parser alternativo...'
        );

        const genericAnchorRegex =
            /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;

        let match;

        while (
            (match =
                genericAnchorRegex.exec(html)) !== null
        ) {
            const href = match[1];
            const title = cleanText(match[2]);

            if (!title) {
                continue;
            }

            const result =
                createResult(
                    href,
                    title,
                    '',
                    rubro,
                    ciudad
                );

            if (result) {
                results.push(result);
            }

            if (
                results.length >=
                MAX_RESULTS_PER_QUERY
            ) {
                break;
            }
        }
    }

    /*
     * Último intento:
     * extraer URLs visibles del HTML aunque DuckDuckGo
     * haya cambiado completamente las clases.
     */
    if (!results.length) {
        console.log(
            '[DuckDuckGoProvider] Parser de enlaces sin resultados. Buscando URLs externas...'
        );

        const urlRegex =
            /https?:\/\/[^\s"'<>]+/gi;

        const urls =
            html.match(urlRegex) || [];

        for (const rawUrl of urls) {
            const url =
                rawUrl
                    .replace(
                        /[),.;]+$/,
                        ''
                    );

            const result =
                createResult(
                    url,
                    url,
                    '',
                    rubro,
                    ciudad
                );

            if (result) {
                results.push(result);
            }

            if (
                results.length >=
                MAX_RESULTS_PER_QUERY
            ) {
                break;
            }
        }
    }

    console.log(
        `[DuckDuckGoProvider] Parser final: ${results.length} resultados`
    );

    return results;
}
function createResultKey(result) {
    if (!result) return '';

    const url =
        String(result.url || '')
            .toLowerCase()
            .replace(/^https?:\/\//, '')
            .replace(/^www\./, '')
            .replace(/\/+$/, '');

    const title =
        normalize(
            result.title
        );

    return `${url}|${title}`;
}

function deduplicateResults(results) {
    const unique =
        new Map();

    for (const result of results) {
        const key =
            createResultKey(result);

        if (!key) {
            continue;
        }

        const existing =
            unique.get(key);

        if (!existing) {
            unique.set(
                key,
                result
            );

            continue;
        }

        if (
            result.snippet.length >
            existing.snippet.length
        ) {
            unique.set(
                key,
                result
            );
        }
    }

    return [
        ...unique.values()
    ];
}

function classifyResult(result) {
    const networks =
        detectSocialNetworks(
            result.url
        );

    if (networks.facebook) {
        return 'facebook';
    }

    if (networks.instagram) {
        return 'instagram';
    }

    if (networks.linkedin) {
        return 'linkedin';
    }

    if (result.isDirectory) {
        return 'directory';
    }

    return 'website';
}

function priority(result) {
    switch (
        classifyResult(result)
    ) {
        case 'website':
            return 100;

        case 'facebook':
            return 80;

        case 'instagram':
            return 80;

        case 'linkedin':
            return 70;

        case 'directory':
            return 50;

        default:
            return 10;
    }
}

export class DuckDuckGoProvider
    extends SearchProvider {

    constructor() {
        super(
            'DuckDuckGo Search'
        );
    }

    async executeSearch(query) {
        const url =
            `${DUCKDUCKGO_ENDPOINT}?q=` +
            encodeURIComponent(query);

        console.log(
            `[DuckDuckGoProvider] Consultando: ${query}`
        );

        const response =
            await fetch(
                url,
                {
                    method: 'GET',

                    headers: {
                        'User-Agent':
                            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131 Safari/537.36',

                        'Accept':
                            'text/html,application/xhtml+xml,application/xhtml;q=0.9,*/*;q=0.8',

                        'Accept-Language':
                            'es-AR,es;q=0.9,en;q=0.8'
                    },

                    cache: 'no-store',

                    signal:
                        AbortSignal.timeout(
                            15000
                        )
                }
            );

        if (!response.ok) {
            throw new Error(
                `DuckDuckGo HTTP ${response.status}`
            );
        }

        return await response.text();
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
            return [];
        }

        console.log(
            `[DuckDuckGoProvider] Búsqueda real: "${rubro}" en "${ciudad}"`
        );

        const queries = [
            `"${rubro}" "${ciudad}" Argentina`,
            `"${rubro}" "${ciudad}" contacto`,
            `"${rubro}" "${ciudad}" teléfono`
        ];

        const allResults = [];

        for (const query of queries) {
            try {
                const html =
                    await this.executeSearch(
                        query
                    );

                console.log(
                    `[DuckDuckGoProvider] HTML recibido: ${html.length} caracteres`
                );

                const results =
                    parseDuckDuckGoHtml(
                        html,
                        rubro,
                        ciudad
                    );

                console.log(
                    `[DuckDuckGoProvider] ${results.length} resultados parseados`
                );

                allResults.push(
                    ...results
                );

            } catch (error) {
                console.warn(
                    `[DuckDuckGoProvider] Error en búsqueda "${query}":`,
                    error?.message || error
                );
            }
        }

        const uniqueResults =
            deduplicateResults(
                allResults
            );

        uniqueResults.sort(
            (a, b) =>
                priority(b) -
                priority(a)
        );

        const limited =
            uniqueResults.slice(
                0,
                MAX_TOTAL_RESULTS
            );

        console.log(
            `[DuckDuckGoProvider] ${limited.length} resultados únicos después de filtrar`
        );

        const leads = [];

        for (const result of limited) {
            const redes =
                detectSocialNetworks(
                    result.url
                );

            const nombre =
                normalizeBusinessName(
                    result.title
                );

            const tipo =
                classifyResult(result);

            const website =
                tipo === 'website'
                    ? result.url
                    : null;

            const lead =
                new Lead({
                    nombre,

                    provincia:
                        filters.provincia !==
                        'todas'
                            ? filters.provincia
                            : 'Buenos Aires',

                    ciudad,

                    rubro,

                    email:
                        null,

                    telefono:
                        null,

                    whatsapp:
                        null,

                    website,

                    redes,

                    fuentes: [
                        this.name
                    ],

                    coordenadas:
                        null
                });

            lead.fuenteTipo =
                tipo;

            lead.fuenteUrl =
                result.url;

            lead.fuenteSnippet =
                result.snippet;

            lead.fuenteDominio =
                result.domain;

            leads.push(
                lead
            );
        }

        console.log(
            `[DuckDuckGoProvider] ${leads.length} leads reales encontrados`
        );

        return leads;
    }
}
