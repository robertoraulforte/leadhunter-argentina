// js/services/ScoringService.js

export class ScoringService {
    /**
     * Analiza las falencias digitales y asigna un puntaje de oportunidad
     * @param {import('../models/Lead.js').Lead[]} leads 
     */
    static process(leads) {
        return leads.map(lead => {
            let score = 50; // Base neutral
            lead.diagnostico = [];

            // Regla 1: No tiene sitio web (Gran Oportunidad de Venta)
            if (!lead.website) {
                score += 35;
                lead.diagnostico.push("Sin sitio web oficial");
            } else if (lead.website.includes('blogspot') || lead.website.includes('wordpress.com')) {
                score += 20;
                lead.diagnostico.push("Sitio web en plataforma gratuita/obsoleta");
            }

            // Regla 2: Tiene presencia activa en redes sociales
            if (lead.redes.facebook || lead.redes.instagram) {
                score += 15;
                lead.diagnostico.push("Presencia activa en redes sociales");
            }

            // Regla 3: Tiene canal directo de contacto (Email/Teléfono)
            if (lead.email || lead.telefono) {
                score += 10;
            }

            lead.scoreIA = Math.min(score, 100);

            // Definir Nivel de Prioridad
            if (lead.scoreIA >= 85) {
                lead.prioridad = 'ALTA';
            } else if (lead.scoreIA >= 65) {
                lead.prioridad = 'MEDIA';
            } else {
                lead.prioridad = 'BAJA';
            }

            return lead;
        });
    }
}