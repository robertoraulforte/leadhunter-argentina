// js/providers/DuckDuckGoProvider.js

import { SearchProvider } from './SearchProvider.js';
import { Lead } from '../models/Lead.js';

export class DuckDuckGoProvider extends SearchProvider {
    constructor() {
        super('DuckDuckGo Search');
    }

    async search(filters) {
        return new Promise((resolve) => {
            setTimeout(() => {
                const leads = [
                    new Lead({
                        nombre: "Clínica Odontológica Centro", // Coincide intencionalmente para la Deduplicación (Fase 2)
                        provincia: filters.provincia !== 'todas' ? filters.provincia : 'caba',
                        ciudad: "Buenos Aires",
                        rubro: filters.rubro !== 'todos' ? filters.rubro : 'salud',
                        tamano: "pyme",
                        email: "consultas@clinicacentro.com.ar",
                        redes: { facebook: "https://facebook.com/clinicacentro", instagram: "https://instagram.com/clinicacentro" },
                        fuentes: [this.name]
                    }),
                    new Lead({
                        nombre: "Ferretería El Progreso",
                        provincia: filters.provincia !== 'todas' ? filters.provincia : 'cordoba',
                        ciudad: "Córdoba",
                        rubro: filters.rubro !== 'todos' ? filters.rubro : 'comercio',
                        tamano: "mono",
                        telefono: "+54 351 455-1234",
                        website: "http://ferreteriaelprog.com.ar",
                        fuentes: [this.name]
                    })
                ];
                resolve(leads);
            }, 700);
        });
    }
}