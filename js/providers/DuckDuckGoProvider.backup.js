// js/providers/DuckDuckGoProvider.js

import { SearchProvider } from './SearchProvider.js';
import { Lead } from '../models/Lead.js';

const DUCKDUCKGO_ENDPOINT =
    'https://html.duckduckgo.com/html/';

const MAX_RESULTS = 10;

function decodeHtml(text) {
    if (!text) return '';

    return text
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#x27;/gi, "'")
        .replace(/&#39;/g, "'")
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&nbsp;/g, ' ');
}

function cleanText(text) {
    return decodeHtml(
        text
            .replace(/<[^>]*>/g, '')
            .replace(/\s+/g, ' ')
            .trim()
    );
}

function extractRealUrl(href) {
    if (!href) return null;

    try {
        const absoluteUrl = href.startsWith('http')
            ? href
            : `https://html.duckduckgo.com${href}`;

        const url = new URL(absoluteUrl);

        // DuckDuckGo utiliza enlaces de redirección
        // con el parámetro uddg.
        const redirectedUrl = url.searchParams.get('uddg');

        if (redirectedUrl) {
            return decodeURIComponent(redirectedUrl);
        }

        return absoluteUrl;
    } catch {
        return href;
    }
}

function isIgnoredDomain(url) {
    if (!url) return true;

    const ignoredDomains = [
        'duckduckgo.com',
        'google.com',
        'bing.com',
        'yahoo.com',
        'facebook.com',
        'instagram.com',
        'linkedin.com',
        'youtube.com',
        'tiktok.com',
        'twitter.com',
        'x.com',
        'tripadvisor.com',
        'wikipedia.org',
        'yelp.com',
        'paginasamarillas.com.ar',
        'argentina.gob.ar',
        'mercadolibre.com.ar'
    ];

    try {
        const hostname =
            new URL(url).hostname.toLowerCase();

        return ignoredDomains.some(domain =>
            hostname === domain ||
            hostname.endsWith(`.${domain}`)
        );
    } catch {
        return true;
    }
}

function extractResults(html) {
    const results = [];

    /*
     * DuckDuckGo HTML utiliza bloques:
     *
     * .result
     * .result__a
     * .result__snippet
     */

    const resultRegex =
        /<div[^>]+class="[^"]*\bresult\b[^"]*"[\s\S]*?<\/div>\s*<\/div>/gi;

    const blocks =
        html.match(resultRegex) || [];

    for (const block of blocks) {

        const titleMatch =
            block.match(
                /<a[^>]+class="[^"]*\bresult__a\b[^"]*"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i
            );

        if (!titleMatch) continue;

        const href =
            extractRealUrl(titleMatch[1]);

        const title =
            cleanText(titleMatch[2]);

        const snippetMatch =
            block.match(
                /<a[^>]+class="[^"]*\bresult__snippet\b[^"]*"[^>]*>([\s\S]*?)<\/a>/i
            ) ||
            block.match(
                /<div[^>]+class="[^"]*\bresult__snippet\b[^"]*"[^>]*>([\s\S]*?)<\/div>/i
            );

        const snippet =
            snippetMatch
                ? cleanText(snippetMatch[1])
                : '';

        if (!href || !title) continue;

        if (isIgnoredDomain(href)) continue;

        results.push({
            title,
            url: href,
            snippet
        });

        if (results.length >= MAX_RESULTS) {
            break;
        }
    }

    return results;
}

function detectSocialNetworks(url) {
    const networks = {
        facebook: null,
        instagram: null,
        linkedin: null
    };

    if (!url) return networks;

    const lowerUrl =
        url.toLowerCase();

    if (lowerUrl.includes('facebook.com')) {
        networks.facebook = url;
    }

    if (lowerUrl.includes('instagram.com')) {
        networks.instagram = url;
    }

    if (lowerUrl.includes('linkedin.com')) {
        networks.linkedin = url;
    }

    return networks;
}

function normalizeBusinessName(title) {
    if (!title) return 'Empresa';

    return title
        .replace(/\s*[-|–]\s*Google.*$/i, '')
        .replace(/\s*[-|–]\s*Facebook.*$/i, '')
        .replace(/\s*[-|–]\s*Instagram.*$/i, '')
        .replace(/\s*[-|–]\s*Sitio Oficial.*$/i, '')
        .trim();
}

export class DuckDuckGoProvider extends SearchProvider {

    constructor() {
        super('DuckDuckGo Search');
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
                            'text/html,application/xhtml+xml'
                    },

                    cache: 'no-store',

                    signal:
                        AbortSignal.timeout(15000)
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
            String(filters.rubro || '')
                .trim();

        const ciudad =
            String(filters.ciudad || '')
                .trim();

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
                    await this.executeSearch(query);

                console.log(
                    `[DuckDuckGoProvider] HTML recibido: ${html.length} caracteres`
                );

                const results =
                    extractResults(html);

                console.log(
                    `[DuckDuckGoProvider] ${results.length} resultados parseados`
                );

                allResults.push(...results);

            } catch (error) {

                console.warn(
                    `[DuckDuckGoProvider] Error en búsqueda "${query}":`,
                    error
                );
            }
        }

        /*
         * Eliminar URLs repetidas.
         */
        const uniqueResults =
            new Map();

        for (const result of allResults) {

            const key =
                result.url
                    .toLowerCase()
                    .replace(/\/$/, '');

            if (!uniqueResults.has(key)) {
                uniqueResults.set(
                    key,
                    result
                );
            }
        }

        const leads = [];

        for (const result of uniqueResults.values()) {

            const redes =
                detectSocialNetworks(result.url);

            const nombre =
                normalizeBusinessName(
                    result.title
                );

            /*
             * No generamos datos inventados.
             *
             * Si DuckDuckGo solamente conoce:
             * - nombre
             * - sitio web
             *
             * dejamos teléfono/email en null.
             */

            leads.push(
                new Lead({

                    nombre,

                    provincia:
                        filters.provincia !== 'todas'
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

                    website:
                        redes.facebook ||
                        redes.instagram
                            ? null
                            : result.url,

                    redes,

                    fuentes: [
                        this.name
                    ],

                    coordenadas:
                        null
                })
            );
        }

        console.log(
            `[DuckDuckGoProvider] ${leads.length} leads reales encontrados`
        );

        return leads;
    }
}