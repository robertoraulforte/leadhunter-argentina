"use client";

import { useEffect, useMemo, useState } from "react";

type Lead = {
  id: string;
  name: string;
  category: string | null;
  city: string | null;
  province: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  facebook: string | null;
  instagram: string | null;
  latitude: number | null;
  longitude: number | null;
  score: number | null;
  priority: string | null;
  source: string | null;
  favorite: boolean;
  contacted: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

type ApiResponse = {
  success: boolean;
  count: number;
  results: Lead[];
  error?: string;
};

export default function CRMPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("TODAS");
  const [statusFilter, setStatusFilter] = useState("TODOS");

  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  async function loadLeads() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/crm/leads", {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`Error HTTP ${response.status}`);
      }

      const data: ApiResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error || "No se pudieron cargar los leads.");
      }

      setLeads(data.results || []);
    } catch (err) {
      console.error("[CRM] Error cargando leads:", err);

      setError(
        err instanceof Error
          ? err.message
          : "No se pudieron cargar los leads."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLeads();
  }, []);

  const filteredLeads = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return leads.filter((lead) => {
      const matchesSearch =
        !normalizedSearch ||
        [
          lead.name,
          lead.category,
          lead.city,
          lead.province,
          lead.phone,
          lead.email,
          lead.website,
        ]
          .filter(Boolean)
          .some((value) =>
            String(value).toLowerCase().includes(normalizedSearch)
          );

      const matchesPriority =
        priorityFilter === "TODAS" ||
        (lead.priority || "").toUpperCase() === priorityFilter;

      const matchesStatus =
        statusFilter === "TODOS" ||
        (statusFilter === "CONTACTADOS" && lead.contacted) ||
        (statusFilter === "NO_CONTACTADOS" && !lead.contacted) ||
        (statusFilter === "FAVORITOS" && lead.favorite);

      return matchesSearch && matchesPriority && matchesStatus;
    });
  }, [leads, search, priorityFilter, statusFilter]);

  const stats = useMemo(() => {
    return {
      total: leads.length,
      alta: leads.filter(
        (lead) => (lead.priority || "").toUpperCase() === "ALTA"
      ).length,
      contactados: leads.filter((lead) => lead.contacted).length,
      favoritos: leads.filter((lead) => lead.favorite).length,
    };
  }, [leads]);

  function priorityClass(priority: string | null) {
    switch ((priority || "").toUpperCase()) {
      case "ALTA":
        return "bg-red-100 text-red-700";
      case "MEDIA":
        return "bg-yellow-100 text-yellow-700";
      case "BAJA":
        return "bg-green-100 text-green-700";
      default:
        return "bg-gray-100 text-gray-600";
    }
  }

  function formatDate(date: string) {
    if (!date) return "-";

    return new Date(date).toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* HEADER */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">CRM</h1>

          <p className="mt-1 text-sm text-gray-500">
            Gestión y seguimiento de leads de LeadHunter Argentina
          </p>
        </div>

        <button
          onClick={loadLeads}
          disabled={loading}
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Actualizando..." : "↻ Actualizar"}
        </button>
      </div>

      {/* ESTADÍSTICAS */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total de leads"
          value={stats.total}
          icon="👥"
        />

        <StatCard
          title="Prioridad alta"
          value={stats.alta}
          icon="🔥"
        />

        <StatCard
          title="Contactados"
          value={stats.contactados}
          icon="📞"
        />

        <StatCard
          title="Favoritos"
          value={stats.favoritos}
          icon="⭐"
        />
      </div>

      {/* FILTROS */}
      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs font-medium text-gray-500">
              Buscar
            </label>

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Nombre, rubro, ciudad, teléfono..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-gray-500 focus:ring-2 focus:ring-gray-200"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">
              Prioridad
            </label>

            <select
              value={priorityFilter}
              onChange={(event) => setPriorityFilter(event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-500"
            >
              <option value="TODAS">Todas</option>
              <option value="ALTA">Alta</option>
              <option value="MEDIA">Media</option>
              <option value="BAJA">Baja</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">
              Estado
            </label>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-500"
            >
              <option value="TODOS">Todos</option>
              <option value="NO_CONTACTADOS">No contactados</option>
              <option value="CONTACTADOS">Contactados</option>
              <option value="FAVORITOS">Favoritos</option>
            </select>
          </div>
        </div>
      </div>

      {/* ERROR */}
      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* TABLA */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <div>
            <h2 className="font-semibold text-gray-900">
              Leads
            </h2>

            <p className="text-xs text-gray-500">
              Mostrando {filteredLeads.length} de {leads.length}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="p-10 text-center text-sm text-gray-500">
            Cargando leads...
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="p-10 text-center">
            <div className="mb-2 text-4xl">📭</div>

            <p className="font-medium text-gray-700">
              No hay leads para mostrar
            </p>

            <p className="mt-1 text-sm text-gray-500">
              Probá cambiando los filtros de búsqueda.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">Lead</th>
                  <th className="px-4 py-3">Ubicación</th>
                  <th className="px-4 py-3">Contacto</th>
                  <th className="px-4 py-3">Score</th>
                  <th className="px-4 py-3">Prioridad</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {filteredLeads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="transition hover:bg-gray-50"
                  >
                    {/* LEAD */}
                    <td className="px-4 py-4">
                      <div className="flex items-start gap-2">
                        <button
                          title={
                            lead.favorite
                              ? "Quitar de favoritos"
                              : "Agregar a favoritos"
                          }
                          className="text-lg"
                        >
                          {lead.favorite ? "⭐" : "☆"}
                        </button>

                        <div>
                          <div className="font-semibold text-gray-900">
                            {lead.name}
                          </div>

                          {lead.category && (
                            <div className="mt-1 text-xs text-gray-500">
                              {lead.category}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* UBICACIÓN */}
                    <td className="px-4 py-4">
                      <div className="text-gray-800">
                        {lead.city || "-"}
                      </div>

                      {lead.province && (
                        <div className="text-xs text-gray-500">
                          {lead.province}
                        </div>
                      )}
                    </td>

                    {/* CONTACTO */}
                    <td className="px-4 py-4">
                      {lead.phone ? (
                        <div className="font-medium text-gray-800">
                          {lead.phone}
                        </div>
                      ) : (
                        <div className="text-gray-400">
                          Sin teléfono
                        </div>
                      )}

                      {lead.email && (
                        <div className="mt-1 max-w-[220px] truncate text-xs text-gray-500">
                          {lead.email}
                        </div>
                      )}
                    </td>

                    {/* SCORE */}
                    <td className="px-4 py-4">
                      <span className="font-bold text-gray-900">
                        {lead.score ?? "-"}
                      </span>

                      {lead.score !== null && (
                        <span className="text-xs text-gray-400">
                          /100
                        </span>
                      )}
                    </td>

                    {/* PRIORIDAD */}
                    <td className="px-4 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${priorityClass(
                          lead.priority
                        )}`}
                      >
                        {lead.priority || "SIN DEFINIR"}
                      </span>
                    </td>

                    {/* ESTADO */}
                    <td className="px-4 py-4">
                      <span
                        className={
                          lead.contacted
                            ? "text-green-600"
                            : "text-gray-500"
                        }
                      >
                        {lead.contacted
                          ? "✓ Contactado"
                          : "○ Pendiente"}
                      </span>
                    </td>

                    {/* FECHA */}
                    <td className="px-4 py-4 text-gray-500">
                      {formatDate(lead.createdAt)}
                    </td>

                    {/* ACCIONES */}
                    <td className="px-4 py-4 text-right">
                      <button
                        onClick={() => setSelectedLead(lead)}
                        className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100"
                      >
                        Ver
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL DETALLE */}
      {selectedLead && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setSelectedLead(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {selectedLead.name}
                </h2>

                <p className="text-sm text-gray-500">
                  Detalle del lead
                </p>
              </div>

              <button
                onClick={() => setSelectedLead(null)}
                className="rounded-lg px-3 py-2 text-gray-500 hover:bg-gray-100"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 gap-5 p-6 md:grid-cols-2">
              <DetailItem
                label="Rubro"
                value={selectedLead.category}
              />

              <DetailItem
                label="Score"
                value={
                  selectedLead.score !== null
                    ? `${selectedLead.score}/100`
                    : null
                }
              />

              <DetailItem
                label="Prioridad"
                value={selectedLead.priority}
              />

              <DetailItem
                label="Estado"
                value={
                  selectedLead.contacted
                    ? "Contactado"
                    : "No contactado"
                }
              />

              <DetailItem
                label="Ciudad"
                value={selectedLead.city}
              />

              <DetailItem
                label="Provincia"
                value={selectedLead.province}
              />

              <DetailItem
                label="Dirección"
                value={selectedLead.address}
              />

              <DetailItem
                label="Teléfono"
                value={selectedLead.phone}
              />

              <DetailItem
                label="Email"
                value={selectedLead.email}
              />

              <DetailItem
                label="Website"
                value={selectedLead.website}
              />

              <DetailItem
                label="Facebook"
                value={selectedLead.facebook}
              />

              <DetailItem
                label="Instagram"
                value={selectedLead.instagram}
              />

              <DetailItem
                label="Fuente"
                value={selectedLead.source}
              />

              <DetailItem
                label="Fecha de creación"
                value={formatDate(selectedLead.createdAt)}
              />

              <div className="md:col-span-2">
                <div className="mb-1 text-xs font-medium uppercase text-gray-400">
                  Notas
                </div>

                <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
                  {selectedLead.notes || "Sin notas"}
                </div>
              </div>
            </div>

            <div className="flex justify-end border-t border-gray-200 px-6 py-4">
              <button
                onClick={() => setSelectedLead(null)}
                className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: number;
  icon: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>

          <p className="mt-2 text-3xl font-bold text-gray-900">
            {value}
          </p>
        </div>

        <div className="text-2xl">{icon}</div>
      </div>
    </div>
  );
}

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: string | number | null;
}) {
  return (
    <div>
      <div className="mb-1 text-xs font-medium uppercase text-gray-400">
        {label}
      </div>

      <div className="break-words text-sm font-medium text-gray-800">
        {value || "-"}
      </div>
    </div>
  );
}