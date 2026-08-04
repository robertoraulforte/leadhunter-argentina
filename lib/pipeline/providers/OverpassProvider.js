// js/providers/OverpassProvider.js

import { SearchProvider } from './SearchProvider.js';
import { Lead } from '../models/Lead.js';

export class OverpassProvider extends SearchProvider {
    constructor() {
        super('Overpass (OpenStreetMap)');
        this.endpoint = 'https://overpass-api.de/api/interpreter';
    }

    async search(filters) {
        console.log(`[OverpassProvider] Ejecutando consulta real a OSM para provincia: ${filters.provincia}...`);

        // Mapeo de bounding boxes aproximados para provincias clave en Argentina
        const areaBounds = {
            'caba': '(-34.70,-58.53,-34.52,-58.33)',
            'bsas': '(-38.05,-57.65,-37.90,-57.45)', // Ejemplo en zona MDQ/Balcarce/Costa
            'cordoba': '(-31.48,-64.25,-31.33,-64.10)',
            'todas': '(-34.70,-58.53,-34.52,-58.33)' // Fallback CABA
        };

        const bbox = areaBounds[filters.provincia] || areaBounds['todas'];

        // Consulta Overpass QL para buscar nodos con tag 'amenity' o 'shop'
        const query = `
            [out:json][timeout:10];
            (
              node["amenity"]${bbox};
              node["shop"]${bbox};
            );
            out body 15;
        `;

        try {
            const response = await fetch(this.endpoint, {
                method: 'POST',
                body: 'data=' + encodeURIComponent(query)
            });

            if (!response.ok) throw new Error(`HTTP error ${response.status}`);

            const data = await response.json();
            
            if (!data.elements) return [];

            // Mapear elementos reales de OpenStreetMap al modelo estándar Lead
            return data.elements
                .filter(item => item.tags && item.tags.name)
                .map(item => {
                    const tags = item.tags;
                    return new Lead({
                        nombre: tags.name,
                        provincia: filters.provincia !== 'todas' ? filters.provincia : 'Buenos Aires',
                        ciudad: tags['addr:city'] || tags['addr:suburb'] || 'Argentina',
                        rubro: tags.shop || tags.amenity || filters.rubro,
                        telefono: tags.phone || tags['contact:phone'] || null,
                        email: tags.email || tags['contact:email'] || null,
                        website: tags.website || tags['contact:website'] || null,
                        fuentes: [this.name],
                        coordenadas: { lat: item.lat, lng: item.lon }
                    });
                });

        } catch (error) {
            console.error(`[OverpassProvider] Error al consultar la API de Overpass:`, error);
            // Fallback en caso de timeout o bloqueo de red
            return [];
        }
    }
}