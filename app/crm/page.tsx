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
  count?: number;
  results?: Lead[];
  result?: Lead;
  message?: string;
  error?: string;
};

type EditForm = {
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
  score: string;
  priority: string;
  source: string;
  notes: string;
};

export default function CRMPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("TODAS");
  const [statusFilter, setStatusFilter] = useState("TODOS");

  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);

  const [editForm, setEditForm] = useState<EditForm>({
    name: "",
    category: "",
    city: "",
    province: "",
    address: "",
    phone: "",
    email: "",
    website: "",
    facebook: "",
    instagram: "",
    score: "",
    priority: "",
    source: "",
    notes: "",
  });

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
        throw new Error(
          data.error || "No se pudieron cargar los leads."
        );
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
    const controller = new AbortController();

    async function fetchInitialLeads() {
      try {
        const response = await fetch("/api/crm/leads", {
          method: "GET",
          cache: "no-store",
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Error HTTP ${response.status}`);
        }

        const data: ApiResponse = await response.json();

        if (!data.success) {
          throw new Error(
            data.error || "No se pudieron cargar los leads."
          );
        }

        setLeads(data.results || []);
        setError("");
      } catch (err) {
        if (
          err instanceof DOMException &&
          err.name === "AbortError"
        ) {
          return;
        }

        console.error("[CRM] Error cargando leads:", err);

        setError(
          err instanceof Error
            ? err.message
            : "No se pudieron cargar los leads."
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    fetchInitialLeads();

    return () => {
      controller.abort();
    };
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
            String(value)
              .toLowerCase()
              .includes(normalizedSearch)
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
        (lead) =>
          (lead.priority || "").toUpperCase() === "ALTA"
      ).length,

      contactados: leads.filter(
        (lead) => lead.contacted
      ).length,

      favoritos: leads.filter(
        (lead) => lead.favorite
      ).length,
    };
  }, [leads]);

  function openLead(lead: Lead) {
    setSelectedLead(lead);
    setEditingLead(null);
  }

  function closeLead() {
    if (saving) {
      return;
    }

    setSelectedLead(null);
    setEditingLead(null);
  }

  function startEditing(lead: Lead) {
    setSelectedLead(null);
    setEditingLead(lead);

    setEditForm({
      name: lead.name || "",
      category: lead.category || "",
      city: lead.city || "",
      province: lead.province || "",
      address: lead.address || "",
      phone: lead.phone || "",
      email: lead.email || "",
      website: lead.website || "",
      facebook: lead.facebook || "",
      instagram: lead.instagram || "",
      score:
        lead.score !== null && lead.score !== undefined
          ? String(lead.score)
          : "",
      priority: lead.priority || "",
      source: lead.source || "",
      notes: lead.notes || "",
    });

    setError("");
  }

  function cancelEditing() {
    if (saving) {
      return;
    }

    setEditingLead(null);
  }

  function updateForm(
    field: keyof EditForm,
    value: string
  ) {
    setEditForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function saveLead() {
    if (!editingLead) {
      return;
    }

    if (!editForm.name.trim()) {
      setError("El nombre del lead es obligatorio.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const scoreValue =
        editForm.score.trim() === ""
          ? null
          : Number(editForm.score);

      if (
        scoreValue !== null &&
        (Number.isNaN(scoreValue) ||
          scoreValue < 0 ||
          scoreValue > 100)
      ) {
        throw new Error(
          "El score debe ser un número entre 0 y 100."
        );
      }

      const response = await fetch("/api/crm/leads", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: editingLead.id,

          name: editForm.name.trim(),
          category: editForm.category.trim() || null,
          city: editForm.city.trim() || null,
          province: editForm.province.trim() || null,
          address: editForm.address.trim() || null,
          phone: editForm.phone.trim() || null,
          email: editForm.email.trim() || null,
          website: editForm.website.trim() || null,
          facebook: editForm.facebook.trim() || null,
          instagram: editForm.instagram.trim() || null,

          score: scoreValue,

          priority:
            editForm.priority.trim() || null,

          source:
            editForm.source.trim() || null,

          notes:
            editForm.notes.trim() || null,
        }),
      });

      const data: ApiResponse = await response.json();

      if (
        !response.ok ||
        !data.success ||
        !data.result
      ) {
        throw new Error(
          data.error ||
            "No se pudo actualizar el lead."
        );
      }

      const updatedLead = data.result;

      setLeads((current) =>
        current.map((lead) =>
          lead.id === updatedLead.id
            ? updatedLead
            : lead
        )
      );

      setEditingLead(null);
      setSelectedLead(updatedLead);
    } catch (err) {
      console.error(
        "[CRM] Error actualizando lead:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "No se pudo actualizar el lead."
      );
    } finally {
      setSaving(false);
    }
  }

  async function updateLead(
    id: string,
    changes: Partial<Lead>
  ) {
    try {
      setSaving(true);
      setError("");

      const response = await fetch("/api/crm/leads", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id,
          ...changes,
        }),
      });

      const data: ApiResponse = await response.json();

      if (
        !response.ok ||
        !data.success ||
        !data.result
      ) {
        throw new Error(
          data.error ||
            "No se pudo actualizar el lead."
        );
      }

      const updatedLead = data.result;

      setLeads((current) =>
        current.map((lead) =>
          lead.id === updatedLead.id
            ? updatedLead
            : lead
        )
      );

      setSelectedLead((current) =>
        current?.id === updatedLead.id
          ? updatedLead
          : current
      );
    } catch (err) {
      console.error(
        "[CRM] Error actualizando lead:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "No se pudo actualizar el lead."
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleFavorite(lead: Lead) {
    await updateLead(lead.id, {
      favorite: !lead.favorite,
    });
  }

  async function toggleContacted(lead: Lead) {
    await updateLead(lead.id, {
      contacted: !lead.contacted,
    });
  }

  async function deleteLead(lead: Lead) {
    const confirmed = window.confirm(
      `¿Seguro que querés eliminar "${lead.name}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setSaving(true);
      setError("");

      const response = await fetch(
        "/api/crm/leads",
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: lead.id,
          }),
        }
      );

      const data: ApiResponse =
        await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error ||
            "No se pudo eliminar el lead."
        );
      }

      setLeads((current) =>
        current.filter(
          (item) => item.id !== lead.id
        )
      );

      setSelectedLead((current) =>
        current?.id === lead.id
          ? null
          : current
      );

      setEditingLead((current) =>
        current?.id === lead.id
          ? null
          : current
      );
    } catch (err) {
      console.error(
        "[CRM] Error eliminando lead:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "No se pudo eliminar el lead."
      );
    } finally {
      setSaving(false);
    }
  }

  function priorityClass(
    priority: string | null
  ) {
    switch (
      (priority || "").toUpperCase()
    ) {
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
    if (!date) {
      return "-";
    }

    return new Date(date).toLocaleDateString(
      "es-AR",
      {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">

      {/* HEADER */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            CRM
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Gestión y seguimiento de leads de
            LeadHunter Argentina
          </p>
        </div>

        <button
          type="button"
          onClick={loadLeads}
          disabled={loading || saving}
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading
            ? "Actualizando..."
            : "↻ Actualizar"}
        </button>
      </div>

      {/* ERROR */}
      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* ESTADISTICAS */}
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
      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Buscar
            </label>

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Nombre, ciudad, teléfono, email..."
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-gray-500 focus:ring-2 focus:ring-gray-200"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Prioridad
            </label>

            <select
              value={priorityFilter}
              onChange={(event) =>
                setPriorityFilter(
                  event.target.value
                )
              }
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-200"
            >
              <option value="TODAS">
                Todas
              </option>
              <option value="ALTA">
                Alta
              </option>
              <option value="MEDIA">
                Media
              </option>
              <option value="BAJA">
                Baja
              </option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Estado
            </label>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value
                )
              }
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-200"
            >
              <option value="TODOS">
                Todos
              </option>
              <option value="NO_CONTACTADOS">
                No contactados
              </option>
              <option value="CONTACTADOS">
                Contactados
              </option>
              <option value="FAVORITOS">
                Favoritos
              </option>
            </select>
          </div>

        </div>
      </div>

      {/* TABLA */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">

        <div className="border-b border-gray-200 px-5 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Leads
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Mostrando {filteredLeads.length} de{" "}
            {leads.length}
          </p>
        </div>

        {loading ? (
          <div className="p-10 text-center text-sm text-gray-500">
            Cargando leads...
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="p-10 text-center text-sm text-gray-500">
            No hay leads que coincidan con los
            filtros.
          </div>
        ) : (
          <div className="overflow-x-auto">

            <table className="min-w-full">

              <thead className="bg-gray-50">

                <tr className="border-b border-gray-200 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">

                  <th className="px-5 py-3">
                    Lead
                  </th>

                  <th className="px-5 py-3">
                    Categoría
                  </th>

                  <th className="px-5 py-3">
                    Ubicación
                  </th>

                  <th className="px-5 py-3">
                    Contacto
                  </th>

                  <th className="px-5 py-3">
                    Score
                  </th>

                  <th className="px-5 py-3">
                    Prioridad
                  </th>

                  <th className="px-5 py-3">
                    Estado
                  </th>

                  <th className="px-5 py-3">
                    Fecha
                  </th>

                  <th className="px-5 py-3 text-right">
                    Acciones
                  </th>

                </tr>

              </thead>

              <tbody className="divide-y divide-gray-100">

                {filteredLeads.map(
                  (lead) => (
                    <tr
                      key={lead.id}
                      className="transition hover:bg-gray-50"
                    >

                      {/* LEAD */}
                      <td className="px-5 py-4">

                        <div className="flex items-start gap-3">

                          <button
                            type="button"
                            onClick={() =>
                              toggleFavorite(lead)
                            }
                            disabled={saving}
                            title={
                              lead.favorite
                                ? "Quitar favorito"
                                : "Agregar favorito"
                            }
                            className="mt-0.5 text-xl leading-none disabled:opacity-50"
                          >
                            {lead.favorite
                              ? "★"
                              : "☆"}
                          </button>

                          <div>
                            <div className="font-semibold text-gray-900">
                              {lead.name}
                            </div>

                            {lead.email && (
                              <div className="mt-1 text-xs text-gray-500">
                                {lead.email}
                              </div>
                            )}
                          </div>

                        </div>

                      </td>

                      {/* CATEGORIA */}
                      <td className="px-5 py-4 text-sm text-gray-700">
                        {lead.category || "-"}
                      </td>

                      {/* UBICACION */}
                      <td className="px-5 py-4">

                        <div className="text-sm font-medium text-gray-800">
                          {lead.city || "-"}
                        </div>

                        {lead.province && (
                          <div className="text-xs text-gray-500">
                            {lead.province}
                          </div>
                        )}

                      </td>

                      {/* CONTACTO */}
                      <td className="px-5 py-4">

                        {lead.phone ? (
                          <a
                            href={`tel:${lead.phone}`}
                            className="text-sm font-semibold text-blue-600 hover:underline"
                          >
                            {lead.phone}
                          </a>
                        ) : (
                          <span className="text-sm text-gray-400">
                            -
                          </span>
                        )}

                      </td>

                      {/* SCORE */}
                      <td className="px-5 py-4">

                        <div className="font-bold text-gray-900">
                          {lead.score ?? "-"}

                          {lead.score !== null && (
                            <span className="font-normal text-gray-400">
                              /100
                            </span>
                          )}
                        </div>

                      </td>

                      {/* PRIORIDAD */}
                      <td className="px-5 py-4">

                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${priorityClass(
                            lead.priority
                          )}`}
                        >
                          {lead.priority ||
                            "SIN PRIORIDAD"}
                        </span>

                      </td>

                      {/* ESTADO */}
                      <td className="px-5 py-4">

                        <button
                          type="button"
                          onClick={() =>
                            toggleContacted(lead)
                          }
                          disabled={saving}
                          className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                            lead.contacted
                              ? "bg-green-100 text-green-700 hover:bg-green-200"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          {lead.contacted
                            ? "Contactado"
                            : "No contactado"}
                        </button>

                      </td>

                      {/* FECHA */}
                      <td className="px-5 py-4 text-sm text-gray-500">
                        {formatDate(
                          lead.createdAt
                        )}
                      </td>

                      {/* ACCIONES */}
                      <td className="px-5 py-4">

                        <div className="flex justify-end gap-2">

                          <button
                            type="button"
                            onClick={() =>
                              openLead(lead)
                            }
                            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100"
                          >
                            Ver
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              startEditing(lead)
                            }
                            className="rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-700"
                          >
                            Editar
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              deleteLead(lead)
                            }
                            disabled={saving}
                            className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                          >
                            Eliminar
                          </button>

                        </div>

                      </td>

                    </tr>
                  )
                )}

              </tbody>

            </table>

          </div>
        )}

      </div>

      {/* =====================================================
          MODAL DETALLE
          ===================================================== */}

      {selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">

            {/* HEADER */}
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5">

              <div className="min-w-0 pr-4">

                <h2 className="break-words text-xl font-bold text-gray-900">
                  {selectedLead.name}
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Detalle del lead
                </p>

              </div>

              <button
                type="button"
                onClick={closeLead}
                disabled={saving}
                className="rounded-lg px-3 py-2 text-2xl leading-none text-gray-500 hover:bg-gray-100 disabled:opacity-50"
              >
                ×
              </button>

            </div>

            {/* DATOS */}
            <div className="grid grid-cols-1 gap-5 p-6 sm:grid-cols-2">

              <DetailItem
                label="Categoría"
                value={
                  selectedLead.category
                }
              />

              <DetailItem
                label="Teléfono"
                value={
                  selectedLead.phone
                }
              />

              <DetailItem
                label="Email"
                value={
                  selectedLead.email
                }
              />

              <DetailItem
                label="Ciudad"
                value={
                  selectedLead.city
                }
              />

              <DetailItem
                label="Provincia"
                value={
                  selectedLead.province
                }
              />

              <DetailItem
                label="Dirección"
                value={
                  selectedLead.address
                }
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
                value={
                  selectedLead.priority
                }
              />

              <DetailItem
                label="Fuente"
                value={
                  selectedLead.source
                }
              />

              <DetailItem
                label="Fecha"
                value={formatDate(
                  selectedLead.createdAt
                )}
              />

              {selectedLead.website && (
                <DetailLink
                  label="Website"
                  value={
                    selectedLead.website
                  }
                />
              )}

              {selectedLead.facebook && (
                <DetailLink
                  label="Facebook"
                  value={
                    selectedLead.facebook
                  }
                />
              )}

              {selectedLead.instagram && (
                <DetailLink
                  label="Instagram"
                  value={
                    selectedLead.instagram
                  }
                />
              )}

              <div className="sm:col-span-2">

                <div className="mb-2 text-xs font-medium uppercase text-gray-400">
                  Notas
                </div>

                <div className="whitespace-pre-wrap rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
                  {selectedLead.notes ||
                    "Sin notas."}
                </div>

              </div>

            </div>

            {/* ACCIONES */}
            <div className="flex flex-wrap gap-3 border-t border-gray-200 px-6 py-4">

              <button
                type="button"
                disabled={saving}
                onClick={() =>
                  startEditing(selectedLead)
                }
                className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
              >
                ✎ Editar datos
              </button>

              <button
                type="button"
                disabled={saving}
                onClick={() =>
                  toggleFavorite(selectedLead)
                }
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
              >
                {selectedLead.favorite
                  ? "★ Quitar favorito"
                  : "☆ Agregar favorito"}
              </button>

              <button
                type="button"
                disabled={saving}
                onClick={() =>
                  toggleContacted(
                    selectedLead
                  )
                }
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
              >
                {selectedLead.contacted
                  ? "Marcar no contactado"
                  : "✓ Marcar contactado"}
              </button>

              <button
                type="button"
                disabled={saving}
                onClick={() =>
                  deleteLead(selectedLead)
                }
                className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                Eliminar lead
              </button>

            </div>

          </div>

        </div>
      )}

      {/* =====================================================
          MODAL EDICIÓN
          ===================================================== */}

      {editingLead && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-3 sm:p-6">

          <div className="flex max-h-[95vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">

            {/* HEADER */}
            <div className="flex shrink-0 items-center justify-between border-b border-gray-200 bg-white px-5 py-4 sm:px-7">

              <div className="min-w-0 pr-4">

                <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">
                  Editar lead
                </h2>

                <p className="mt-1 break-words text-sm text-gray-500">
                  {editingLead.name}
                </p>

              </div>

              <button
                type="button"
                onClick={cancelEditing}
                disabled={saving}
                className="rounded-lg px-3 py-2 text-2xl leading-none text-gray-500 hover:bg-gray-100 disabled:opacity-50"
              >
                ×
              </button>

            </div>

            {/* FORMULARIO */}
            <div className="overflow-y-auto bg-gray-50 px-5 py-6 sm:px-7">

              <div className="space-y-6">

                {/* INFORMACION PRINCIPAL */}
                <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">

                  <h3 className="mb-4 text-base font-semibold text-gray-900">
                    Información principal
                  </h3>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

                    <FormField
                      label="Nombre"
                      required
                      value={editForm.name}
                      onChange={(value) =>
                        updateForm(
                          "name",
                          value
                        )
                      }
                      placeholder="Nombre del negocio"
                    />

                    <FormField
                      label="Categoría"
                      value={
                        editForm.category
                      }
                      onChange={(value) =>
                        updateForm(
                          "category",
                          value
                        )
                      }
                      placeholder="Ej. ferretería"
                    />

                    <FormField
                      label="Teléfono"
                      value={
                        editForm.phone
                      }
                      onChange={(value) =>
                        updateForm(
                          "phone",
                          value
                        )
                      }
                      placeholder="Ej. 2266412345"
                    />

                    <FormField
                      label="Email"
                      type="email"
                      value={
                        editForm.email
                      }
                      onChange={(value) =>
                        updateForm(
                          "email",
                          value
                        )
                      }
                      placeholder="correo@empresa.com"
                    />

                  </div>

                </section>

                {/* UBICACION */}
                <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">

                  <h3 className="mb-4 text-base font-semibold text-gray-900">
                    Ubicación
                  </h3>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

                    <FormField
                      label="Ciudad"
                      value={
                        editForm.city
                      }
                      onChange={(value) =>
                        updateForm(
                          "city",
                          value
                        )
                      }
                      placeholder="Ej. Balcarce"
                    />

                    <FormField
                      label="Provincia"
                      value={
                        editForm.province
                      }
                      onChange={(value) =>
                        updateForm(
                          "province",
                          value
                        )
                      }
                      placeholder="Ej. Buenos Aires"
                    />

                    <div className="md:col-span-2">

                      <FormField
                        label="Dirección"
                        value={
                          editForm.address
                        }
                        onChange={(value) =>
                          updateForm(
                            "address",
                            value
                          )
                        }
                        placeholder="Dirección del negocio"
                      />

                    </div>

                  </div>

                </section>

                {/* WEB Y REDES */}
                <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">

                  <h3 className="mb-4 text-base font-semibold text-gray-900">
                    Web y redes sociales
                  </h3>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

                    <FormField
                      label="Website"
                      type="url"
                      value={
                        editForm.website
                      }
                      onChange={(value) =>
                        updateForm(
                          "website",
                          value
                        )
                      }
                      placeholder="https://..."
                    />

                    <FormField
                      label="Facebook"
                      type="url"
                      value={
                        editForm.facebook
                      }
                      onChange={(value) =>
                        updateForm(
                          "facebook",
                          value
                        )
                      }
                      placeholder="https://facebook.com/..."
                    />

                    <FormField
                      label="Instagram"
                      type="url"
                      value={
                        editForm.instagram
                      }
                      onChange={(value) =>
                        updateForm(
                          "instagram",
                          value
                        )
                      }
                      placeholder="https://instagram.com/..."
                    />

                    <FormField
                      label="Fuente"
                      value={
                        editForm.source
                      }
                      onChange={(value) =>
                        updateForm(
                          "source",
                          value
                        )
                      }
                      placeholder="Ej. Google, OSM, CRM..."
                    />

                  </div>

                </section>

                {/* SCORING */}
                <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">

                  <h3 className="mb-4 text-base font-semibold text-gray-900">
                    Clasificación
                  </h3>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

                    <FormField
                      label="Score"
                      type="number"
                      min="0"
                      max="100"
                      value={
                        editForm.score
                      }
                      onChange={(value) =>
                        updateForm(
                          "score",
                          value
                        )
                      }
                      placeholder="0 - 100"
                    />

                    <div>

                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Prioridad
                      </label>

                      <select
                        value={
                          editForm.priority
                        }
                        onChange={(event) =>
                          updateForm(
                            "priority",
                            event.target.value
                          )
                        }
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-200"
                      >
                        <option value="">
                          Sin prioridad
                        </option>

                        <option value="ALTA">
                          Alta
                        </option>

                        <option value="MEDIA">
                          Media
                        </option>

                        <option value="BAJA">
                          Baja
                        </option>

                      </select>

                    </div>

                  </div>

                </section>

                {/* NOTAS */}
                <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">

                  <h3 className="mb-4 text-base font-semibold text-gray-900">
                    Notas
                  </h3>

                  <textarea
                    value={
                      editForm.notes
                    }
                    onChange={(event) =>
                      updateForm(
                        "notes",
                        event.target.value
                      )
                    }
                    rows={6}
                    placeholder="Agregar información, observaciones, seguimiento comercial..."
                    className="w-full resize-y rounded-lg border border-gray-300 bg-white px-3 py-3 text-sm leading-6 text-gray-900 outline-none placeholder:text-gray-400 focus:border-gray-500 focus:ring-2 focus:ring-gray-200"
                  />

                </section>

              </div>

            </div>

            {/* FOOTER */}
            <div className="flex shrink-0 flex-col-reverse gap-3 border-t border-gray-200 bg-white px-5 py-4 sm:flex-row sm:justify-end sm:px-7">

              <button
                type="button"
                onClick={cancelEditing}
                disabled={saving}
                className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={saveLead}
                disabled={
                  saving ||
                  !editForm.name.trim()
                }
                className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving
                  ? "Guardando..."
                  : "Guardar cambios"}
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}

/* ============================================================
   COMPONENTE: STAT CARD
   ============================================================ */

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

          <p className="text-sm text-gray-500">
            {title}
          </p>

          <p className="mt-2 text-3xl font-bold text-gray-900">
            {value}
          </p>

        </div>

        <div className="text-2xl">
          {icon}
        </div>

      </div>

    </div>
  );
}

/* ============================================================
   COMPONENTE: CAMPO DE FORMULARIO
   ============================================================ */

function FormField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
  min,
  max,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
  min?: string;
  max?: string;
}) {
  return (
    <div>

      <label className="mb-2 block text-sm font-medium text-gray-700">
        {label}

        {required && (
          <span className="ml-1 text-red-500">
            *
          </span>
        )}
      </label>

      <input
        type={type}
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        min={min}
        max={max}
        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-gray-500 focus:ring-2 focus:ring-gray-200"
      />

    </div>
  );
}

/* ============================================================
   COMPONENTE: DETALLE
   ============================================================ */

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: string | number | null;
}) {
  return (
    <div>

      <div className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-400">
        {label}
      </div>

      <div className="wrap-break-word text-sm font-medium text-gray-800">
        {value || "-"}
      </div>

    </div>
  );
}

/* ============================================================
   COMPONENTE: LINK
   ============================================================ */

function DetailLink({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>

      <div className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-400">
        {label}
      </div>

      <a
        href={value}
        target="_blank"
        rel="noopener noreferrer"
        className="wrap-break-word text-sm font-medium text-blue-600 hover:underline"
      >
        {value}
      </a>

    </div>
  );
}