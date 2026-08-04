'use client';

import { useState } from 'react';

// Interfaz para tipar los resultados sin usar 'any'
interface LeadResult {
  id: string;
  nombre: string;
  provincia: string;
  ciudad: string;
  rubro: string;
  email: string | null;
  telefono: string | null;
  scoreIA: number;
  prioridad: string;
  fuentes: string[];
}

export default function BuscadorLeads() {
  const [rubro, setRubro] = useState('');
  const [ciudad, setCiudad] = useState('');
  const [provincia, setProvincia] = useState('todas');
  
  // Usamos el tipo explicitado
  const [leads, setLeads] = useState<LeadResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rubro || !ciudad) {
      alert('Por favor completa el rubro y la ciudad.');
      return;
    }

    setLoading(true);
    setSearched(true);

    try {
      const res = await fetch(
        `/api/search?rubro=${encodeURIComponent(rubro)}&ciudad=${encodeURIComponent(ciudad)}&provincia=${encodeURIComponent(provincia)}`
      );
      const data = await res.json();

      if (data.success) {
        setLeads(data.results);
      } else {
        console.error('Error del servidor:', data.error);
        setLeads([]);
      }
    } catch (err) {
      console.error('Error al consultar /api/search:', err);
      setLeads([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Formulario de Búsqueda */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          🔍 Buscar Empresas y Leads
        </h2>
        <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Rubro</label>
            <input
              type="text"
              placeholder="Ej: gomería, clínica, ferretería"
              value={rubro}
              onChange={(e) => setRubro(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-2.5 focus:border-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Ciudad</label>
            <input
              type="text"
              placeholder="Ej: Balcarce, Mar del Plata, Córdoba"
              value={ciudad}
              onChange={(e) => setCiudad(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-2.5 focus:border-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Provincia</label>
            <select
              value={provincia}
              onChange={(e) => setProvincia(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-2.5 focus:border-blue-500 outline-none"
            >
              <option value="todas">Todas</option>
              <option value="bsas">Buenos Aires</option>
              <option value="caba">CABA</option>
              <option value="cordoba">Córdoba</option>
              <option value="santa-fe">Santa Fe</option>
            </select>
          </div>

          <div className="md:col-span-3 flex justify-end mt-2">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold px-6 py-2.5 rounded-lg transition flex items-center gap-2"
            >
              {loading ? 'Consultando Pipeline...' : 'Buscar Leads'}
            </button>
          </div>
        </form>
      </div>

      {/* Grid de Resultados */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">
          Resultados {searched && `(${leads.length} leads encontrados)`}
        </h3>

        {loading ? (
          <div className="text-center py-12 text-slate-400">
            <p className="animate-pulse">Ejecutando motores de búsqueda en paralelo...</p>
          </div>
        ) : leads.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {leads.map((lead) => (
              <div key={lead.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between hover:border-blue-500 transition">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-white text-lg">{lead.nombre}</h4>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                      lead.scoreIA >= 80 
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-800' 
                        : 'bg-amber-950 text-amber-300 border-amber-800'
                    }`}>
                      Score: {lead.scoreIA}%
                    </span>
                  </div>

                  <p className="text-sm text-slate-400 mb-1">📍 {lead.ciudad}, {lead.provincia}</p>
                  <p className="text-sm text-slate-300 mb-1">✉️ {lead.email || 'No disponible'}</p>
                  <p className="text-sm text-slate-300 mb-3">📞 {lead.telefono || 'No disponible'}</p>

                  <div className="mb-4">
                    <span className="text-xs text-slate-500 block mb-1">Fuentes:</span>
                    <div className="flex flex-wrap gap-1">
                      {lead.fuentes.map((f: string, i: number) => (
                        <span key={i} className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <button className="w-full bg-slate-800 hover:bg-slate-700 text-blue-400 border border-slate-700 py-2 rounded-lg text-sm font-medium transition">
                  Guardar en Favoritos / CRM
                </button>
              </div>
            ))}
          </div>
        ) : searched ? (
          <div className="text-center py-12 bg-slate-900 border border-slate-800 rounded-xl text-slate-400">
            No se encontraron leads para esa búsqueda. Intenta con otra ciudad o rubro.
          </div>
        ) : null}
      </div>
    </div>
  );
}