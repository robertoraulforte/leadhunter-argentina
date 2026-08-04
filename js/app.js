// js/app.js

import { SearchService } from './services/SearchService.js';
import { DeduplicatorService } from './services/DeduplicatorService.js';
import { ScoringService } from './services/ScoringService.js';

import { OverpassProvider } from './providers/OverpassProvider.js';
import { DuckDuckGoProvider } from './providers/DuckDuckGoProvider.js';

// 1. Inicialización de Servicios y Proveedores
const searchService = new SearchService();
searchService.registerProvider(new OverpassProvider());
searchService.registerProvider(new DuckDuckGoProvider());

// 2. Renderizado de Tarjetas en la UI
function renderLeads(leads) {
    const contenedor = document.getElementById('resultados');
    const contador = document.getElementById('contadorLeads');
    if (!contenedor || !contador) return;

    contenedor.innerHTML = '';
    contador.textContent = `Mostrando ${leads.length} lead(s) procesados`;

    if (leads.length === 0) {
        contenedor.innerHTML = `
            <div class="col-span-full text-center py-12 bg-ar-cardBg border border-ar-border rounded-xl">
                <i class="fa-solid fa-magnifying-glass text-4xl text-slate-500 mb-3"></i>
                <p class="text-slate-300 font-medium">No se encontraron leads con esos filtros.</p>
            </div>
        `;
        return;
    }

    leads.forEach(lead => {
        const card = document.createElement('div');
        const badgeColor = lead.prioridad === 'ALTA' 
            ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800' 
            : 'bg-amber-950/80 text-amber-300 border-amber-800';

        card.className = "bg-ar-cardBg border border-ar-border rounded-xl p-5 card-hover border-l-4 border-l-blue-500 flex flex-col justify-between";
        card.innerHTML = `
            <div>
                <div class="flex justify-between items-start mb-2">
                    <h4 class="font-semibold text-white text-lg">${lead.nombre}</h4>
                    <span class="text-xs px-2.5 py-1 rounded-full border ${badgeColor} font-semibold">
                        Score IA: ${lead.scoreIA}%
                    </span>
                </div>
                <p class="text-sm text-ar-lightText mb-2"><i class="fa-solid fa-location-dot text-slate-400 mr-1"></i> ${lead.ciudad}, ${lead.provincia}</p>
                <p class="text-sm text-slate-300 mb-1"><i class="fa-solid fa-envelope text-slate-400 mr-2"></i>${lead.email || 'No disponible'}</p>
                <p class="text-sm text-slate-300 mb-3"><i class="fa-solid fa-phone text-slate-400 mr-2"></i>${lead.telefono || 'No disponible'}</p>
                
                <div class="mb-4">
                    <p class="text-xs text-slate-400 mb-1">Fuentes detectadas:</p>
                    <div class="flex flex-wrap gap-1">
                        ${lead.fuentes.map(f => `<span class="text-xs bg-slate-800 border border-slate-700 text-slate-300 px-2 py-0.5 rounded">${f}</span>`).join('')}
                    </div>
                </div>
            </div>
            <button class="w-full bg-slate-800 border border-slate-700 text-blue-400 py-2 rounded-lg text-sm font-medium hover:bg-slate-700 hover:text-white transition flex items-center justify-center gap-2">
                <i class="fa-solid fa-bolt"></i> Ver Ficha CRM
            </button>
        `;
        contenedor.appendChild(card);
    });
}

// 3. Event Listener del Botón de Búsqueda
document.getElementById('buscarBtn')?.addEventListener('click', async () => {
    const filters = {
        provincia: document.getElementById('provincia').value,
        rubro: document.getElementById('rubro').value,
        tamano: document.getElementById('tamano').value,
        necesidad: document.getElementById('necesidad').value
    };

    const btn = document.getElementById('buscarBtn');
    const originalContent = btn.innerHTML;
    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin mr-2"></i> Ejecutando Pipeline...`;
    btn.disabled = true;

    try {
        // PIPELINE EN ACCIÓN:
        // 1. Obtener de múltiples fuentes
        const rawLeads = await searchService.searchAll(filters);
        // 2. Unificar duplicados
        const deduplicatedLeads = DeduplicatorService.process(rawLeads);
        // 3. Analizar y calcular Score IA
        const finalLeads = ScoringService.process(deduplicatedLeads);

        // Renderizar resultados enriquecidos
        renderLeads(finalLeads);
    } catch (err) {
        console.error("Error en el Pipeline de Búsqueda:", err);
    } finally {
        btn.innerHTML = originalContent;
        btn.disabled = false;
    }
});