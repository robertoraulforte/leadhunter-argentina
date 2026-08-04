// js/services/SearchService.js

export class SearchService {
    constructor() {
        this.providers = [];
    }

    registerProvider(provider) {
        this.providers.push(provider);
    }

    async searchAll(filters) {
        console.log(`[SearchService] Consultando ${this.providers.length} fuentes en paralelo...`);

        // Ejecutar consultas simultáneas sin bloquear si una falla
        const promises = this.providers.map(p => 
            p.search(filters).catch(err => {
                console.error(`[SearchService] Error en proveedor ${p.name}:`, err);
                return [];
            })
        );

        const resultsArray = await Promise.all(promises);
        const rawLeads = resultsArray.flat();
        
        console.log(`[SearchService] ${rawLeads.length} leads obtenidos en bruto.`);
        return rawLeads;
    }
}