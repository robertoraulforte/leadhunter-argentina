// js/providers/OverpassProvider.js

import { SearchProvider } from './SearchProvider.js';
import { Lead } from '../models/Lead.js';

export class OverpassProvider extends SearchProvider {
    constructor() {
        super('Overpass (OpenStreetMap)');
    }

    async search(filters) {
        // Simulamos la resolución de red de geolocalización
        return new Promise((resolve) => {
            setTimeout(() => {
                const leads = [
                    new Lead({
                        nombre: "Clínica Odontológica Centro",
                        provincia: filters.provincia !== 'todas' ? filters.provincia : 'caba',
                        ciudad: "Buenos Aires",
                        rubro: filters.rubro !== 'todos' ? filters.rubro : 'salud',
                        tamano: "pyme",
                        email: "consultas@clinicacentro.com.ar",
                        telefono: "+54 11 4321-8899",
                        website: null,
                        fuentes: [this.name],
                        coordenadas: { lat: -34.6037, lng: -58.3816 }
                    }),
                    new Lead({
                        nombre: "Distribuidora Balcarce",
                        provincia: filters.provincia !== 'todas' ? filters.provincia : 'bsas',
                        ciudad: "Balcarce",
                        rubro: filters.rubro !== 'todos' ? filters.rubro : 'comercio',
                        tamano: "pyme",
                        telefono: "+54 2266 42-1122",
                        website: null,
                        fuentes: [this.name],
                        coordenadas: { lat: -37.8481, lng: -58.2553 }
                    })
                ];
                resolve(leads);
            }, 500);
        });
    }
}