// js/services/LeadEnricherService.js

const MAX_LEADS = 20;
const TIMEOUT_MS = 10000;

function clean(value) {
    if (!value) return null;

    return value
        .replace(/\s+/g, ' ')
        .trim();
}

function normalizeUrl(url) {
    if (!url) return null;

    try {
        const parsed = new URL(url);

        if (
            parsed.protocol !== 'http:' &&
            parsed.protocol !== 'https:'
        ) {
            return null;
        }

        return parsed.href;
    } catch {
        return null;
    }
}

function extractEmails(html) {

    const matches =
        html.match(
            /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi
        ) || [];

    return [
        ...new Set(
            matches
                .map(email => email.toLowerCase())
                .filter(email =>
                    !email.includes('example.com') &&
                    !email.includes('domain.com')
                )
        )
    ];
}

function extractPhones(html) {

    const matches =
        html.match(
            /(?:\+54|0054)?[\s(.-]*\d{2,4}[\s)./-]*\d{3,4}[\s.-]*\d{3,4}/g
        ) || [];

    return [
        ...new Set(
            matches
                .map(clean)
                .filter(Boolean)
        )
    ];
}

function extractWhatsApp(html) {

    const results = [];

    const regex =
        /https?:\/\/(?:wa\.me|api\.whatsapp\.com\/send\?phone=)[^"'&<>\s]+/gi;

    const matches =
        html.match(regex) || [];

    for (const match of matches) {

        const cleaned =
            match
                .replace(/&amp;/g, '&');

        results.push(cleaned);
    }

    return [
        ...new Set(results)
    ];
}

function extractSocial(html) {

    const networks = {
        facebook: null,
        instagram: null,
        linkedin: null
    };

    const urls =
        html.match(
            /https?:\/\/[^"'<> ]+/gi
        ) || [];

    for (const rawUrl of urls) {

        const url =
            rawUrl
                .replace(/&amp;/g, '&')
                .replace(/[),.;]+$/, '');

        const lower =
            url.toLowerCase();

        if (
            !networks.facebook &&
            lower.includes('facebook.com')
        ) {
            networks.facebook = url;
        }

        if (
            !networks.instagram &&
            lower.includes('instagram.com')
        ) {
            networks.instagram = url;
        }

        if (
            !networks.linkedin &&
            lower.includes('linkedin.com')
        ) {
            networks.linkedin = url;
        }
    }

    return networks;
}

function selectBestPhone(phones) {

    if (!phones.length) {
        return null;
    }

    /*
     * Preferimos teléfonos argentinos.
     */
    const argentinaPhone =
        phones.find(phone =>
            phone.includes('+54') ||
            phone.includes('0054') ||
            phone.startsWith('11') ||
            phone.startsWith('223') ||
            phone.startsWith('2266')
        );

    return argentinaPhone || phones[0];
}

export class LeadEnricherService {

    static async enrichLead(lead) {

        if (!lead.website) {
            return lead;
        }

        const website =
            normalizeUrl(lead.website);

        if (!website) {
            return lead;
        }

        console.log(
            `[LeadEnricher] Analizando ${lead.nombre}: ${website}`
        );

        try {

            const response =
                await fetch(
                    website,
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
                            AbortSignal.timeout(
                                TIMEOUT_MS
                            )
                    }
                );

            if (!response.ok) {

                console.warn(
                    `[LeadEnricher] ${lead.nombre}: HTTP ${response.status}`
                );

                return lead;
            }

            const html =
                await response.text();

            /*
             * Limitar el análisis para evitar
             * consumir memoria innecesariamente.
             */
            const limitedHtml =
                html.slice(0, 1000000);

            const emails =
                extractEmails(limitedHtml);

            const phones =
                extractPhones(limitedHtml);

            const whatsapp =
                extractWhatsApp(limitedHtml);

            const social =
                extractSocial(limitedHtml);

            if (!lead.email && emails.length) {
                lead.email = emails[0];
            }

            if (!lead.telefono && phones.length) {
                lead.telefono =
                    selectBestPhone(phones);
            }

            if (
                !lead.whatsapp &&
                whatsapp.length
            ) {
                lead.whatsapp =
                    whatsapp[0];
            }

            lead.redes = {
                ...(lead.redes || {}),
                ...social
            };

            lead.website = website;

            /*
             * Si encontramos un enlace wa.me
             * tenemos una señal fuerte de contacto.
             */
            if (
                lead.whatsapp &&
                !lead.telefono
            ) {

                const phoneMatch =
                    lead.whatsapp.match(
                        /(?:phone=|wa\.me\/)(\+?\d+)/
                    );

                if (phoneMatch) {
                    lead.telefono =
                        phoneMatch[1];
                }
            }

            lead.fuentes = [
                ...(lead.fuentes || []),
                'Web Enrichment'
            ];

            console.log(
                `[LeadEnricher] ${lead.nombre}: ` +
                `email=${lead.email || 'no'} ` +
                `tel=${lead.telefono || 'no'} ` +
                `whatsapp=${lead.whatsapp ? 'si' : 'no'}`
            );

            return lead;

        } catch (error) {

            console.warn(
                `[LeadEnricher] No se pudo analizar ${lead.nombre}:`,
                error?.message || error
            );

            return lead;
        }
    }

    static async process(leads) {

        if (!Array.isArray(leads)) {
            return [];
        }

        /*
         * No analizamos infinitos sitios en una búsqueda.
         */
        const limited =
            leads.slice(0, MAX_LEADS);

        console.log(
            `[LeadEnricher] Analizando ${limited.length} leads...`
        );

        /*
         * Procesamiento en paralelo.
         */
        const enriched =
            await Promise.all(
                limited.map(lead =>
                    this.enrichLead(lead)
                )
            );

        return enriched;
    }
}