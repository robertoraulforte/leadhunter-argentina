// js/providers/SearchProvider.js

export class SearchProvider {
    constructor(name) {
        if (this.constructor === SearchProvider) {
            throw new Error("No se puede instanciar la clase abstracta SearchProvider directamente.");
        }
        this.name = name;
    }

    /**
     * Devuelve una Promesa con un Array de instancias de Lead
     * @param {Object} filters - Filtros enviados desde la UI
     * @returns {Promise<import('../models/Lead.js').Lead[]>}
     */
    async search(filters) {
        throw new Error(`El método search() debe ser implementado en ${this.name}. Filtros recibidos: ${JSON.stringify(filters)}`);
    }
}