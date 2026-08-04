// js/models/Lead.js

export class Lead {
    constructor({
        nombre,
        provincia = 'Otras',
        ciudad = '',
        rubro = 'General',
        tamano = 'Desconocido',
        email = null,
        telefono = null,
        whatsapp = null,
        website = null,
        redes = { facebook: null, instagram: null, linkedin: null },
        googleMapsUrl = null,
        fuentes = [],
        coordenadas = null
    }) {
        this.id = crypto.randomUUID();
        this.nombre = nombre;
        this.provincia = provincia;
        this.ciudad = ciudad;
        this.rubro = rubro;
        this.tamano = tamano;
        this.email = email;
        this.telefono = telefono;
        this.whatsapp = whatsapp;
        this.website = website;
        this.redes = redes;
        this.googleMapsUrl = googleMapsUrl;
        this.fuentes = Array.isArray(fuentes) ? fuentes : [fuentes];
        this.coordenadas = coordenadas;
        
        // Atributos de análisis e IA (Fase 3 & 4)
        this.scoreIA = 0;
        this.prioridad = 'MEDIA'; // ALTA, MEDIA, BAJA
        this.diagnostico = [];
    }
}