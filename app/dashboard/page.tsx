'use client';

import { useRef, useState, type FormEvent } from 'react';

interface LeadResult {
  id: string;
  nombre: string;
  provincia: string;
  ciudad: string;
  rubro: string;
  email: string | null;
  telefono: string | null;
  website: string | null;
  facebook: string | null;
  instagram: string | null;
  latitude: number | null;
  longitude: number | null;
  scoreIA: number;
  prioridad: string;
  fuentes: string[];
}
interface ManualLeadForm {
  name: string;
  category: string;
  city: string;
  province: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  facebook: string;
  instagram: string;
  latitude: string;
  longitude: string;
  score: string;
  priority: string;
  source: string;
  favorite: boolean;
  contacted: boolean;
  notes: string;
}

const initialManualLead: ManualLeadForm = {
  name: '',
  category: '',
  city: '',
  province: '',
  address: '',
  phone: '',
  email: '',
  website: '',
  facebook: '',
  instagram: '',
  latitude: '',
  longitude: '',
  score: '',
  priority: 'media',
  source: 'manual',
  favorite: false,
  contacted: false,
  notes: '',
};

export default function BuscadorLeads() {
  const [activeTab, setActiveTab] = useState<'search' | 'manual'>('search');

  const [rubro, setRubro] = useState('');
  const [ciudad, setCiudad] = useState('');
  const [provincia, setProvincia] = useState('todas');

  const [leads, setLeads] = useState<LeadResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const [savingId, setSavingId] = useState<string | null>(null);

  // Leads que ya fueron guardados correctamente durante esta búsqueda.
  const [savedLeadIds, setSavedLeadIds] = useState<Set<string>>(
    () => new Set()
  );

  // Ref para bloquear inmediatamente dobles clics antes de que React
  // llegue a actualizar el estado.
  const savingLeadIdsRef = useRef<Set<string>>(new Set());

  const [manualLead, setManualLead] =
    useState<ManualLeadForm>(initialManualLead);
  const [savingManual, setSavingManual] = useState(false);

  const [successMessage, setSuccessMessage] = useState<string | null>(null);


  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();

    if (!rubro.trim() || !ciudad.trim()) {
      alert('Por favor completá el rubro y la ciudad.');
      return;
    }

    setLoading(true);
    setSearched(true);
    setSuccessMessage(null);
    

    // Los resultados de una nueva búsqueda empiezan sin leads guardados.
    setSavedLeadIds(new Set());
    savingLeadIdsRef.current.clear();

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

  const handleSaveLead = async (lead: LeadResult) => {
    // Protección contra doble clic mientras se está guardando
    // o si el lead ya fue guardado.
    if (
      savingLeadIdsRef.current.has(lead.id) ||
      savedLeadIds.has(lead.id)
    ) {
      return;
    }

    // Bloqueo inmediato. No depende de que React actualice el estado.
    savingLeadIdsRef.current.add(lead.id);

    setSavingId(lead.id);
    setSuccessMessage(null);
    

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: lead.nombre,
          category: lead.rubro,
          city: lead.ciudad,
          province: lead.provincia,
          phone: lead.telefono,
          email: lead.email,
          website: lead.website,
          facebook: lead.facebook,
          instagram: lead.instagram,
          latitude: lead.latitude,
          longitude: lead.longitude,
          score: lead.scoreIA,
          priority: lead.prioridad,
          source: lead.fuentes.join(', '),
        }),
      });

      const data = await res.json();

        if (data.success) {
        // Marcamos el resultado de búsqueda como guardado.
        setSavedLeadIds((current) => {
          const next = new Set(current);
          next.add(lead.id);
          return next;
        });

        setSuccessMessage(
          `Lead "${lead.nombre}" creado correctamente.`
        );
      } else {
        // Si la API rechaza el guardado, permitimos reintentar.
        savingLeadIdsRef.current.delete(lead.id);

        alert(
          `No se pudo guardar el lead: ${
            data.error || 'Intentá nuevamente.'
          }`
        );
      }

    } catch (err) {
      // Si hubo error de conexión, permitimos volver a intentar.
      savingLeadIdsRef.current.delete(lead.id);

      console.error('Error al guardar lead:', err);
      alert('Error de conexión al guardar el lead.');
    } finally {
      setSavingId(null);
    }
  };

  const handleManualChange = (
    field: keyof ManualLeadForm,
    value: string | boolean
  ) => {
    setManualLead((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleManualSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!manualLead.name.trim()) {
      alert('El nombre del lead es obligatorio.');
      return;
    }

    setSavingManual(true);
    setSuccessMessage(null);
    

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(manualLead),
      });

      const data = await res.json();

      if (data.success) {
        setSuccessMessage(
          `Lead "${manualLead.name}" creado correctamente.`
        );
        
        setManualLead(initialManualLead);
      } else {
        alert(
          `Error al guardar: ${
            data.error || 'Intentá nuevamente.'
          }`
        );
      }
    } catch (err) {
      console.error('Error al guardar lead manual:', err);
      alert('Error de conexión al guardar el lead.');
    } finally {
      setSavingManual(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">

      {/* Encabezado */}
      <div>
        <h1 className="text-2xl font-bold text-white">
          Gestión de Leads
        </h1>

        <p className="text-slate-400 mt-1">
          Buscá nuevos prospectos o cargá un lead manualmente.
        </p>
      </div>

      {/* Navegación */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-2 flex gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('search')}
          className={`flex-1 md:flex-none px-5 py-2.5 rounded-lg font-medium transition ${
            activeTab === 'search'
              ? 'bg-blue-600 text-white'
              : 'text-slate-400 hover:bg-slate-800 hover:text-white'
          }`}
        >
          🔎 Buscar leads
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('manual')}
          className={`flex-1 md:flex-none px-5 py-2.5 rounded-lg font-medium transition ${
            activeTab === 'manual'
              ? 'bg-blue-600 text-white'
              : 'text-slate-400 hover:bg-slate-800 hover:text-white'
          }`}
        >
          ➕ Cargar lead
        </button>
      </div>

      {/* Mensaje de éxito */}
      {successMessage && (
        <div className="bg-emerald-950/60 border border-emerald-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <p className="text-emerald-300 font-semibold">
              ✓ {successMessage}
            </p>

            <p className="text-emerald-400/80 text-sm mt-1">
              El lead ya está disponible en el CRM.
            </p>
          </div>

          <a
            href="/crm"
            className="inline-flex justify-center items-center px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition"
          >
            Ver en CRM
          </a>
        </div>
      )}

      {/* ====================================================== */}
      {/* BUSCAR LEADS                                           */}
      {/* ====================================================== */}

      {activeTab === 'search' && (
        <>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              🔎 Buscar empresas y leads
            </h2>

            <form
              onSubmit={handleSearch}
              className="grid grid-cols-1 md:grid-cols-3 gap-4"
            >
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Rubro
                </label>

                <input
                  type="text"
                  placeholder="Ej: gomería, clínica, ferretería"
                  value={rubro}
                  onChange={(e) => setRubro(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-2.5 focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Ciudad
                </label>

                <input
                  type="text"
                  placeholder="Ej: Balcarce, Mar del Plata, Córdoba"
                  value={ciudad}
                  onChange={(e) => setCiudad(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-2.5 focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Provincia
                </label>

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
                  {loading
                    ? 'Consultando pipeline...'
                    : 'Buscar leads'}
                </button>
              </div>
            </form>
          </div>

          {/* Resultados */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">
              Resultados{' '}
              {searched && `(${leads.length} leads encontrados)`}
            </h3>

            {loading ? (
              <div className="text-center py-12 text-slate-400">
                <p className="animate-pulse">
                  Ejecutando motores de búsqueda en paralelo...
                </p>
              </div>
            ) : leads.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

                {leads.map((lead) => {
                  const isSaving = savingId === lead.id;
                  const isSaved = savedLeadIds.has(lead.id);

                  return (
                    <div
                      key={lead.id}
                      className={`bg-slate-900 border rounded-xl p-5 flex flex-col justify-between transition ${
                        isSaved
                          ? 'border-emerald-800'
                          : 'border-slate-800 hover:border-blue-500'
                      }`}
                    >
                      <div>
                        <div className="flex justify-between items-start mb-2 gap-3">

                          <h4 className="font-bold text-white text-lg">
                            {lead.nombre}
                          </h4>

                          <span
                            className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full border ${
                              lead.scoreIA >= 80
                                ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                                : 'bg-amber-950 text-amber-300 border-amber-800'
                            }`}
                          >
                            Score: {lead.scoreIA}%
                          </span>

                        </div>

                        <p className="text-sm text-slate-400 mb-1">
                          📍 {lead.ciudad}, {lead.provincia}
                        </p>

                        <p className="text-sm text-slate-300 mb-1">
                          ✉️ {lead.email || 'No disponible'}
                        </p>

                        <p className="text-sm text-slate-300 mb-3">
                          📞 {lead.telefono || 'No disponible'}
                        </p>

                        <div className="mb-4">
                          <span className="text-xs text-slate-500 block mb-1">
                            Fuentes:
                          </span>

                          <div className="flex flex-wrap gap-1">
                            {lead.fuentes.map((fuente, index) => (
                              <span
                                key={index}
                                className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700"
                              >
                                {fuente}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleSaveLead(lead)}
                        disabled={isSaving || isSaved}
                        className={`w-full py-2 rounded-lg text-sm font-medium transition border ${
                          isSaved
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-800 cursor-default'
                            : 'bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-blue-400 border-slate-700'
                        }`}
                      >
                        {isSaving
                          ? 'Guardando...'
                          : isSaved
                            ? '✓ Guardado'
                            : 'Guardar lead'}
                      </button>
                    </div>
                  );
                })}

              </div>
            ) : searched ? (
              <div className="text-center py-12 bg-slate-900 border border-slate-800 rounded-xl text-slate-400">
                No se encontraron leads para esa búsqueda.
                Intentá con otra ciudad o rubro.
              </div>
            ) : null}
          </div>
        </>
      )}

      {/* ====================================================== */}
      {/* CARGA MANUAL                                           */}
      {/* ====================================================== */}

      {activeTab === 'manual' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md">

          <div className="mb-6">
            <h2 className="text-xl font-bold text-white">
              ➕ Cargar lead manualmente
            </h2>

            <p className="text-sm text-slate-400 mt-1">
              Completá los datos del prospecto. El nombre es obligatorio.
            </p>
          </div>

          <form
            onSubmit={handleManualSubmit}
            className="space-y-6"
          >

            {/* Información principal */}
            <div>
              <h3 className="text-sm font-semibold text-blue-400 uppercase tracking-wide mb-3">
                Información principal
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Nombre *
                  </label>

                  <input
                    type="text"
                    value={manualLead.name}
                    onChange={(e) =>
                      handleManualChange('name', e.target.value)
                    }
                    placeholder="Nombre de la empresa o contacto"
                    required
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-2.5 focus:border-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Rubro
                  </label>

                  <input
                    type="text"
                    value={manualLead.category}
                    onChange={(e) =>
                      handleManualChange('category', e.target.value)
                    }
                    placeholder="Ej: Ferretería"
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-2.5 focus:border-blue-500 outline-none"
                  />
                </div>

              </div>
            </div>

            {/* Ubicación */}
            <div>
              <h3 className="text-sm font-semibold text-blue-400 uppercase tracking-wide mb-3">
                Ubicación
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Ciudad
                  </label>

                  <input
                    type="text"
                    value={manualLead.city}
                    onChange={(e) =>
                      handleManualChange('city', e.target.value)
                    }
                    placeholder="Ciudad"
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-2.5 focus:border-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Provincia
                  </label>

                  <input
                    type="text"
                    value={manualLead.province}
                    onChange={(e) =>
                      handleManualChange('province', e.target.value)
                    }
                    placeholder="Provincia"
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-2.5 focus:border-blue-500 outline-none"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Dirección
                  </label>

                  <input
                    type="text"
                    value={manualLead.address}
                    onChange={(e) =>
                      handleManualChange('address', e.target.value)
                    }
                    placeholder="Dirección"
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-2.5 focus:border-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Latitud
                  </label>

                  <input
                    type="number"
                    step="any"
                    value={manualLead.latitude}
                    onChange={(e) =>
                      handleManualChange('latitude', e.target.value)
                    }
                    placeholder="-37.84"
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-2.5 focus:border-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Longitud
                  </label>

                  <input
                    type="number"
                    step="any"
                    value={manualLead.longitude}
                    onChange={(e) =>
                      handleManualChange('longitude', e.target.value)
                    }
                    placeholder="-58.25"
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-2.5 focus:border-blue-500 outline-none"
                  />
                </div>

              </div>
            </div>

            {/* Contacto */}
            <div>
              <h3 className="text-sm font-semibold text-blue-400 uppercase tracking-wide mb-3">
                Contacto
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Teléfono
                  </label>

                  <input
                    type="text"
                    value={manualLead.phone}
                    onChange={(e) =>
                      handleManualChange('phone', e.target.value)
                    }
                    placeholder="Teléfono"
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-2.5 focus:border-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Email
                  </label>

                  <input
                    type="email"
                    value={manualLead.email}
                    onChange={(e) =>
                      handleManualChange('email', e.target.value)
                    }
                    placeholder="correo@empresa.com"
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-2.5 focus:border-blue-500 outline-none"
                  />
                </div>

              </div>
            </div>

            {/* Presencia online */}
            <div>
              <h3 className="text-sm font-semibold text-blue-400 uppercase tracking-wide mb-3">
                Presencia online
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Website
                  </label>

                  <input
                    type="url"
                    value={manualLead.website}
                    onChange={(e) =>
                      handleManualChange('website', e.target.value)
                    }
                    placeholder="https://..."
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-2.5 focus:border-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Facebook
                  </label>

                  <input
                    type="url"
                    value={manualLead.facebook}
                    onChange={(e) =>
                      handleManualChange('facebook', e.target.value)
                    }
                    placeholder="https://facebook.com/..."
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-2.5 focus:border-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Instagram
                  </label>

                  <input
                    type="url"
                    value={manualLead.instagram}
                    onChange={(e) =>
                      handleManualChange('instagram', e.target.value)
                    }
                    placeholder="https://instagram.com/..."
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-2.5 focus:border-blue-500 outline-none"
                  />
                </div>

              </div>
            </div>

            {/* Gestión */}
            <div>
              <h3 className="text-sm font-semibold text-blue-400 uppercase tracking-wide mb-3">
                Gestión del lead
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Score
                  </label>

                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={manualLead.score}
                    onChange={(e) =>
                      handleManualChange('score', e.target.value)
                    }
                    placeholder="0 - 100"
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-2.5 focus:border-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Prioridad
                  </label>

                  <select
                    value={manualLead.priority}
                    onChange={(e) =>
                      handleManualChange('priority', e.target.value)
                    }
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-2.5 focus:border-blue-500 outline-none"
                  >
                    <option value="">Sin prioridad</option>
                    <option value="alta">Alta</option>
                    <option value="media">Media</option>
                    <option value="baja">Baja</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Fuente
                  </label>

                  <input
                    type="text"
                    value={manualLead.source}
                    onChange={(e) =>
                      handleManualChange('source', e.target.value)
                    }
                    placeholder="manual"
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-2.5 focus:border-blue-500 outline-none"
                  />
                </div>

              </div>

              <div className="flex flex-wrap gap-6 mt-4">

                <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={manualLead.favorite}
                    onChange={(e) =>
                      handleManualChange(
                        'favorite',
                        e.target.checked
                      )
                    }
                    className="w-4 h-4"
                  />
                  Favorito
                </label>

                <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={manualLead.contacted}
                    onChange={(e) =>
                      handleManualChange(
                        'contacted',
                        e.target.checked
                      )
                    }
                    className="w-4 h-4"
                  />
                  Contactado
                </label>

              </div>
            </div>

            {/* Notas */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Notas
              </label>

              <textarea
                value={manualLead.notes}
                onChange={(e) =>
                  handleManualChange('notes', e.target.value)
                }
                rows={4}
                placeholder="Información adicional del lead..."
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-2.5 focus:border-blue-500 outline-none resize-y"
              />
            </div>

            {/* Acciones */}
            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2 border-t border-slate-800">

              <button
                type="button"
                onClick={() => setManualLead(initialManualLead)}
                disabled={savingManual}
                className="px-5 py-2.5 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 disabled:opacity-50 transition"
              >
                Limpiar
              </button>

              <button
                type="submit"
                disabled={savingManual}
                className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold transition"
              >
                {savingManual
                  ? 'Guardando lead...'
                  : 'Crear lead'}
              </button>

            </div>

          </form>
        </div>
      )}
    </div>
  );
}