// js/services/DeduplicatorService.js

export class DeduplicatorService {
    /**
     * Deduplicador avanzado.
     *
     * Objetivos:
     * - Detectar duplicados entre Overpass + DuckDuckGo.
     * - Normalizar nombres, emails, teléfonos y URLs.
     * - Evitar fusiones agresivas por nombres parecidos.
     * - Fusionar la mayor cantidad posible de información.
     *
     * @param {import('../models/Lead.js').Lead[]} rawLeads
     * @returns {import('../models/Lead.js').Lead[]}
     */
    static process(rawLeads) {
        if (!Array.isArray(rawLeads) || rawLeads.length === 0) {
            console.log('[DeduplicatorService] No hay leads para deduplicar.');
            return [];
        }

        const uniqueLeads = [];
        const stats = {
            input: rawLeads.length,
            duplicates: 0,
            merged: 0,
            strongMatches: 0,
            nameCityMatches: 0,
            similarNameMatches: 0
        };

        for (const lead of rawLeads) {
            if (!lead) continue;

            // Garantizamos estructuras mínimas para evitar errores.
            this.ensureLeadStructure(lead);

            let match = null;
            let matchType = null;

            /*
             * ============================================================
             * NIVEL 1 - IDENTIFICADORES FUERTES
             * ============================================================
             */

            // Email exacto.
            if (this.normalizeEmail(lead.email)) {
                match = uniqueLeads.find(existing =>
                    this.normalizeEmail(existing.email) ===
                    this.normalizeEmail(lead.email)
                );

                if (match) {
                    matchType = 'email';
                }
            }

            // Website exacto.
            if (!match && this.normalizeUrl(lead.website)) {
                match = uniqueLeads.find(existing =>
                    this.normalizeUrl(existing.website) ===
                    this.normalizeUrl(lead.website)
                );

                if (match) {
                    matchType = 'website';
                }
            }

            // Google Maps exacto.
            if (!match && this.normalizeUrl(lead.googleMapsUrl)) {
                match = uniqueLeads.find(existing =>
                    this.normalizeUrl(existing.googleMapsUrl) ===
                    this.normalizeUrl(lead.googleMapsUrl)
                );

                if (match) {
                    matchType = 'googleMaps';
                }
            }

            // Teléfono normalizado.
            if (!match && this.normalizePhone(lead.telefono)) {
                const phone = this.normalizePhone(lead.telefono);

                match = uniqueLeads.find(existing =>
                    this.normalizePhone(existing.telefono) === phone
                );

                if (match) {
                    matchType = 'telefono';
                }
            }

            /*
             * ============================================================
             * NIVEL 2 - NOMBRE + CIUDAD
             * ============================================================
             */

            if (!match) {
                const normalizedName = this.normalizeBusinessName(lead.nombre);
                const normalizedCity = this.normalizeLocation(lead.ciudad);

                if (normalizedName) {
                    match = uniqueLeads.find(existing => {
                        const existingName =
                            this.normalizeBusinessName(existing.nombre);

                        const existingCity =
                            this.normalizeLocation(existing.ciudad);

                        if (!existingName) return false;

                        // Si ambos tienen ciudad, exigimos que coincidan.
                        if (
                            normalizedCity &&
                            existingCity &&
                            normalizedCity !== existingCity
                        ) {
                            return false;
                        }

                        return normalizedName === existingName;
                    });

                    if (match) {
                        matchType = 'nombre_ciudad';
                    }
                }
            }

            /*
             * ============================================================
             * NIVEL 3 - NOMBRE SIMILAR + CONTEXTO
             * ============================================================
             *
             * Este nivel es deliberadamente conservador.
             *
             * No alcanza con que dos nombres sean parecidos.
             * También necesitamos:
             *
             * - misma ciudad, o
             * - un nombre claramente contenido en el otro.
             *
             * Y evitamos nombres demasiado cortos.
             */

            if (!match) {
                match = this.findSimilarNameMatch(lead, uniqueLeads);

                if (match) {
                    matchType = 'nombre_similar';
                }
            }

            /*
             * ============================================================
             * INSERTAR O FUSIONAR
             * ============================================================
             */

            if (!match) {
                uniqueLeads.push(lead);
                continue;
            }

            stats.duplicates++;

            if (
                matchType === 'email' ||
                matchType === 'website' ||
                matchType === 'googleMaps' ||
                matchType === 'telefono'
            ) {
                stats.strongMatches++;
            } else if (matchType === 'nombre_ciudad') {
                stats.nameCityMatches++;
            } else if (matchType === 'nombre_similar') {
                stats.similarNameMatches++;
            }

            this.mergeLeads(match, lead);
            stats.merged++;
        }

        console.log(
            `[DeduplicatorService] Reducido de ${stats.input} a ${uniqueLeads.length} leads únicos. ` +
            `Duplicados fusionados: ${stats.merged}. ` +
            `Coincidencias fuertes: ${stats.strongMatches}. ` +
            `Nombre+ciudad: ${stats.nameCityMatches}. ` +
            `Nombre similar: ${stats.similarNameMatches}.`
        );

        return uniqueLeads;
    }

    /**
     * Garantiza que el Lead tenga las estructuras esperadas.
     *
     * @param {import('../models/Lead.js').Lead} lead
     */
    static ensureLeadStructure(lead) {
        if (!lead.redes || typeof lead.redes !== 'object') {
            lead.redes = {};
        }

        if (!Object.prototype.hasOwnProperty.call(lead.redes, 'facebook')) {
            lead.redes.facebook = null;
        }

        if (!Object.prototype.hasOwnProperty.call(lead.redes, 'instagram')) {
            lead.redes.instagram = null;
        }

        if (!Object.prototype.hasOwnProperty.call(lead.redes, 'linkedin')) {
            lead.redes.linkedin = null;
        }

        if (!Array.isArray(lead.fuentes)) {
            lead.fuentes = lead.fuentes
                ? [lead.fuentes]
                : [];
        }

        if (!Array.isArray(lead.diagnostico)) {
            lead.diagnostico = [];
        }
    }

    /**
     * Normaliza un email.
     *
     * @param {string|null|undefined} email
     * @returns {string}
     */
    static normalizeEmail(email) {
        if (!email || typeof email !== 'string') {
            return '';
        }

        return email
            .trim()
            .toLowerCase();
    }

    /**
     * Normaliza URLs para detectar el mismo sitio aunque aparezcan
     * con http/https, www o slash final.
     *
     * @param {string|null|undefined} url
     * @returns {string}
     */
    static normalizeUrl(url) {
        if (!url || typeof url !== 'string') {
            return '';
        }

        let normalized = url
            .trim()
            .toLowerCase();

        if (!normalized) {
            return '';
        }

        // Agregamos protocolo solamente para poder parsear URLs simples.
        let parsed;

        try {
            parsed = new URL(
                normalized.startsWith('http://') ||
                normalized.startsWith('https://')
                    ? normalized
                    : `https://${normalized}`
            );
        } catch {
            return normalized
                .replace(/^https?:\/\//, '')
                .replace(/^www\./, '')
                .replace(/\/+$/, '');
        }

        let hostname = parsed.hostname
            .toLowerCase()
            .replace(/^www\./, '');

        let pathname = parsed.pathname
            .toLowerCase()
            .replace(/\/+$/, '');

        // Eliminamos parámetros de tracking comunes.
        const ignoredParams = [
            'utm_source',
            'utm_medium',
            'utm_campaign',
            'utm_term',
            'utm_content',
            'fbclid',
            'gclid'
        ];

        for (const param of ignoredParams) {
            parsed.searchParams.delete(param);
        }

        const search = parsed.searchParams.toString();

        return `${hostname}${pathname}${search ? `?${search}` : ''}`;
    }

    /**
     * Normaliza teléfonos.
     *
     * Mantiene solamente números.
     * También contempla algunas diferencias habituales de Argentina.
     *
     * @param {string|null|undefined} phone
     * @returns {string}
     */
    static normalizePhone(phone) {
        if (!phone || typeof phone !== 'string') {
            return '';
        }

        let normalized = phone.replace(/\D/g, '');

        if (!normalized) {
            return '';
        }

        // Argentina:
        // +54 9 223 1234567
        // +54 223 1234567
        //
        // Quitamos el 9 después de 54 para comparar números móviles
        // que puedan venir con formatos diferentes.
        if (normalized.startsWith('549')) {
            normalized = `54${normalized.slice(3)}`;
        }

        return normalized;
    }

    /**
     * Normaliza una ubicación.
     *
     * @param {string|null|undefined} value
     * @returns {string}
     */
    static normalizeLocation(value) {
        if (!value || typeof value !== 'string') {
            return '';
        }

        return this.removeAccents(value)
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    /**
     * Normaliza el nombre comercial.
     *
     * Ejemplos:
     *
     * Farmacia San José
     * Farmacia San Jose
     *
     * Farmacia San José - Balcarce
     *
     * se acercan a una representación comparable.
     *
     * @param {string|null|undefined} name
     * @returns {string}
     */
    static normalizeBusinessName(name) {
        if (!name || typeof name !== 'string') {
            return '';
        }

        let normalized = this.removeAccents(name)
            .toLowerCase()
            .replace(/&/g, ' y ')
            .replace(/[^a-z0-9\s]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();

        if (!normalized) {
            return '';
        }

        /*
         * Eliminamos algunos términos geográficos que suelen aparecer
         * agregados por buscadores.
         *
         * IMPORTANTE:
         * No eliminamos ciudades de manera indiscriminada.
         * Solamente quitamos sufijos claramente separados por el nombre.
         */
        normalized = normalized
            .replace(
                /\s+(balcarce|mar del plata|tandil|necochea|azul|olavarria|olavarría|bahia blanca|bahía blanca|la plata|buenos aires)$/i,
                ''
            )
            .trim();

        return normalized;
    }

    /**
     * Busca coincidencias de nombres conservadoras.
     *
     * @param {import('../models/Lead.js').Lead} lead
     * @param {import('../models/Lead.js').Lead[]} existingLeads
     * @returns {import('../models/Lead.js').Lead|null}
     */
    static findSimilarNameMatch(lead, existingLeads) {
        const leadName = this.normalizeBusinessName(lead.nombre);

        if (!leadName || leadName.length < 5) {
            return null;
        }

        const leadCity = this.normalizeLocation(lead.ciudad);

        let bestMatch = null;
        let bestScore = 0;

        for (const existing of existingLeads) {
            const existingName =
                this.normalizeBusinessName(existing.nombre);

            if (!existingName || existingName.length < 5) {
                continue;
            }

            const existingCity =
                this.normalizeLocation(existing.ciudad);

            /*
             * Si ambos tienen ciudad y son diferentes, descartamos.
             */
            if (
                leadCity &&
                existingCity &&
                leadCity !== existingCity
            ) {
                continue;
            }

            /*
             * Si los nombres son exactamente iguales ya fueron tratados
             * por el nivel anterior.
             */
            if (leadName === existingName) {
                return existing;
            }

            const similarity =
                this.calculateNameSimilarity(
                    leadName,
                    existingName
                );

            /*
             * Nombre muy similar.
             */
            if (similarity >= 0.92) {
                const score = similarity + (
                    leadCity &&
                    existingCity &&
                    leadCity === existingCity
                        ? 0.05
                        : 0
                );

                if (score > bestScore) {
                    bestScore = score;
                    bestMatch = existing;
                }

                continue;
            }

            /*
             * Caso:
             *
             * "farmacia san jose"
             * "farmacia san jose balcarce"
             *
             * Después de normalización geográfica muchas veces ya
             * coincidirán, pero este control cubre variantes adicionales.
             */
            const contained =
                leadName.includes(existingName) ||
                existingName.includes(leadName);

            const shorterLength =
                Math.min(
                    leadName.length,
                    existingName.length
                );

            /*
             * Evitamos que nombres demasiado cortos produzcan falsos
             * positivos.
             */
            if (
                contained &&
                shorterLength >= 12 &&
                (
                    !leadCity ||
                    !existingCity ||
                    leadCity === existingCity
                )
            ) {
                const score = 0.90 + (
                    leadCity &&
                    existingCity &&
                    leadCity === existingCity
                        ? 0.06
                        : 0
                );

                if (score > bestScore) {
                    bestScore = score;
                    bestMatch = existing;
                }
            }
        }

        return bestMatch;
    }

    /**
     * Calcula similitud entre dos nombres.
     *
     * Combina:
     * - similitud por distancia de Levenshtein;
     * - similitud por tokens.
     *
     * @param {string} a
     * @param {string} b
     * @returns {number}
     */
    static calculateNameSimilarity(a, b) {
        if (a === b) {
            return 1;
        }

        const levenshteinSimilarity =
            this.levenshteinSimilarity(a, b);

        const tokenSimilarity =
            this.tokenSimilarity(a, b);

        return Math.max(
            levenshteinSimilarity,
            tokenSimilarity
        );
    }

    /**
     * Similitud basada en distancia de Levenshtein.
     *
     * @param {string} a
     * @param {string} b
     * @returns {number}
     */
    static levenshteinSimilarity(a, b) {
        const maxLength = Math.max(a.length, b.length);

        if (maxLength === 0) {
            return 1;
        }

        const distance = this.levenshteinDistance(a, b);

        return 1 - (distance / maxLength);
    }

    /**
     * Distancia de Levenshtein.
     *
     * @param {string} a
     * @param {string} b
     * @returns {number}
     */
    static levenshteinDistance(a, b) {
        const rows = a.length + 1;
        const cols = b.length + 1;

        const matrix = Array.from(
            { length: rows },
            () => new Array(cols).fill(0)
        );

        for (let i = 0; i < rows; i++) {
            matrix[i][0] = i;
        }

        for (let j = 0; j < cols; j++) {
            matrix[0][j] = j;
        }

        for (let i = 1; i < rows; i++) {
            for (let j = 1; j < cols; j++) {
                const cost =
                    a[i - 1] === b[j - 1]
                        ? 0
                        : 1;

                matrix[i][j] = Math.min(
                    matrix[i - 1][j] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j - 1] + cost
                );
            }
        }

        return matrix[rows - 1][cols - 1];
    }

    /**
     * Similitud por tokens.
     *
     * @param {string} a
     * @param {string} b
     * @returns {number}
     */
    static tokenSimilarity(a, b) {
        const tokensA = new Set(
            a.split(/\s+/).filter(Boolean)
        );

        const tokensB = new Set(
            b.split(/\s+/).filter(Boolean)
        );

        if (tokensA.size === 0 || tokensB.size === 0) {
            return 0;
        }

        let intersection = 0;

        for (const token of tokensA) {
            if (tokensB.has(token)) {
                intersection++;
            }
        }

        const union =
            new Set([
                ...tokensA,
                ...tokensB
            ]).size;

        if (union === 0) {
            return 0;
        }

        return intersection / union;
    }

    /**
     * Fusiona toda la información disponible.
     *
     * El lead existente se conserva como objeto principal.
     * Los campos vacíos se completan con el duplicado.
     *
     * @param {import('../models/Lead.js').Lead} existing
     * @param {import('../models/Lead.js').Lead} duplicate
     */
    static mergeLeads(existing, duplicate) {
        this.ensureLeadStructure(existing);
        this.ensureLeadStructure(duplicate);

        /*
         * ============================================================
         * INFORMACIÓN BÁSICA
         * ============================================================
         */

        if (
            this.isEmpty(existing.nombre) &&
            !this.isEmpty(duplicate.nombre)
        ) {
            existing.nombre = duplicate.nombre;
        }

        if (
            this.isEmpty(existing.provincia) ||
            existing.provincia === 'Otras'
        ) {
            if (
                !this.isEmpty(duplicate.provincia) &&
                duplicate.provincia !== 'Otras'
            ) {
                existing.provincia = duplicate.provincia;
            }
        }

        if (
            this.isEmpty(existing.ciudad) &&
            !this.isEmpty(duplicate.ciudad)
        ) {
            existing.ciudad = duplicate.ciudad;
        }

        if (
            this.isEmpty(existing.rubro) ||
            existing.rubro === 'General'
        ) {
            if (
                !this.isEmpty(duplicate.rubro) &&
                duplicate.rubro !== 'General'
            ) {
                existing.rubro = duplicate.rubro;
            }
        }

        if (
            this.isEmpty(existing.tamano) ||
            existing.tamano === 'Desconocido'
        ) {
            if (
                !this.isEmpty(duplicate.tamano) &&
                duplicate.tamano !== 'Desconocido'
            ) {
                existing.tamano = duplicate.tamano;
            }
        }

        /*
         * ============================================================
         * CONTACTO
         * ============================================================
         */

        existing.email =
            this.pickBestValue(
                existing.email,
                duplicate.email
            );

        existing.telefono =
            this.pickBestValue(
                existing.telefono,
                duplicate.telefono
            );

        existing.whatsapp =
            this.pickBestValue(
                existing.whatsapp,
                duplicate.whatsapp
            );

        /*
         * ============================================================
         * WEB
         * ============================================================
         */

        existing.website =
            this.pickBestValue(
                existing.website,
                duplicate.website
            );

        existing.googleMapsUrl =
            this.pickBestValue(
                existing.googleMapsUrl,
                duplicate.googleMapsUrl
            );

        /*
         * ============================================================
         * REDES SOCIALES
         * ============================================================
         */

        existing.redes.facebook =
            this.pickBestValue(
                existing.redes.facebook,
                duplicate.redes?.facebook
            );

        existing.redes.instagram =
            this.pickBestValue(
                existing.redes.instagram,
                duplicate.redes?.instagram
            );

        existing.redes.linkedin =
            this.pickBestValue(
                existing.redes.linkedin,
                duplicate.redes?.linkedin
            );

        /*
         * ============================================================
         * COORDENADAS
         * ============================================================
         */

        if (
            !existing.coordenadas &&
            duplicate.coordenadas
        ) {
            existing.coordenadas =
                duplicate.coordenadas;
        }

        /*
         * ============================================================
         * FUENTES
         * ============================================================
         */

        if (Array.isArray(duplicate.fuentes)) {
            for (const fuente of duplicate.fuentes) {
                if (
                    !existing.fuentes.includes(fuente)
                ) {
                    existing.fuentes.push(fuente);
                }
            }
        }

        /*
         * ============================================================
         * DIAGNÓSTICO
         * ============================================================
         *
         * Normalmente todavía estará vacío porque el scoring ocurre
         * después del deduplicador.
         *
         * Lo conservamos para que el merge sea seguro si el servicio
         * se reutiliza en otro flujo.
         */

        if (Array.isArray(duplicate.diagnostico)) {
            for (const item of duplicate.diagnostico) {
                if (
                    !existing.diagnostico.includes(item)
                ) {
                    existing.diagnostico.push(item);
                }
            }
        }

        /*
         * ============================================================
         * SCORE / PRIORIDAD
         * ============================================================
         *
         * El scoring todavía no ocurrió normalmente.
         * Si algún flujo reutiliza el deduplicador después del scoring,
         * conservamos el valor más alto.
         */

        if (
            typeof duplicate.scoreIA === 'number' &&
            (
                typeof existing.scoreIA !== 'number' ||
                duplicate.scoreIA > existing.scoreIA
            )
        ) {
            existing.scoreIA = duplicate.scoreIA;
        }

        if (
            duplicate.prioridad &&
            (!existing.prioridad ||
                existing.prioridad === 'MEDIA')
        ) {
            existing.prioridad =
                duplicate.prioridad;
        }
    }

    /**
     * Devuelve el primer valor válido.
     *
     * @param {*} current
     * @param {*} incoming
     * @returns {*}
     */
    static pickBestValue(current, incoming) {
        if (!this.isEmpty(current)) {
            return current;
        }

        if (!this.isEmpty(incoming)) {
            return incoming;
        }

        return current ?? incoming ?? null;
    }

    /**
     * Determina si un valor está vacío.
     *
     * @param {*} value
     * @returns {boolean}
     */
    static isEmpty(value) {
        return (
            value === null ||
            value === undefined ||
            (
                typeof value === 'string' &&
                value.trim() === ''
            )
        );
    }

    /**
     * Elimina acentos y diacríticos.
     *
     * @param {string} value
     * @returns {string}
     */
    static removeAccents(value) {
        return value
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');
    }
}