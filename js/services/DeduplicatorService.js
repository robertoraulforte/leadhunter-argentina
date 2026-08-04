// js/services/DeduplicatorService.js

export class DeduplicatorService {
    /**
     * Fusiona leads duplicados por Email o Nombre similar
     * @param {import('../models/Lead.js').Lead[]} rawLeads 
     */
    static process(rawLeads) {
        const uniqueLeads = new Map();

        rawLeads.forEach(lead => {
            // Clave única basada en email o nombre normalizado
            const key = lead.email ? lead.email.toLowerCase() : lead.nombre.toLowerCase().trim();

            if (uniqueLeads.has(key)) {
                // Combinar datos del duplicado existente
                const existing = uniqueLeads.get(key);
                
                // Unificar fuentes
                lead.fuentes.forEach(f => {
                    if (!existing.fuentes.includes(f)) existing.fuentes.push(f);
                });

                // Completar vacíos
                if (!existing.telefono && lead.telefono) existing.telefono = lead.telefono;
                if (!existing.website && lead.website) existing.website = lead.website;
                if (!existing.redes.facebook && lead.redes.facebook) existing.redes.facebook = lead.redes.facebook;
                if (!existing.redes.instagram && lead.redes.instagram) existing.redes.instagram = lead.redes.instagram;
                if (!existing.coordenadas && lead.coordenadas) existing.coordenadas = lead.coordenadas;

            } else {
                uniqueLeads.set(key, lead);
            }
        });

        const deduplicated = Array.from(uniqueLeads.values());
        console.log(`[DeduplicatorService] Reducido de ${rawLeads.length} a ${deduplicated.length} leads únicos.`);
        return deduplicated;
    }
}