"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

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

type LeadForm = {
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
};

const EMPTY_FORM: LeadForm = {
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
  latitude: "",
  longitude: "",
  score: "",
  priority: "",
  source: "",
  favorite: false,
  contacted: false,
  notes: "",
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
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<LeadForm>(EMPTY_FORM);

  const [darkMode, setDarkMode] = useState(false);

  const loadLeads = useCallback(async () => {
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
  }, []);

  /*
   * Carga inicial.
   *
   * El setState ocurre dentro de callbacks asincrónicos de fetch,
   * no directamente en el cuerpo del efecto.
   */
  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadLeads();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [loadLeads]);

  const filteredLeads = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return leads.filter((lead) => {
      const searchableValues = [
        lead.name,
        lead.category,
        lead.city,
        lead.province,
        lead.phone,
        lead.email,
        lead.website,
        lead.facebook,
        lead.instagram,
        lead.source,
      ];

      const matchesSearch =
        !normalizedSearch ||
        searchableValues
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

  function priorityClass(priority: string | null) {
    switch ((priority || "").toUpperCase()) {
      case "ALTA":
        return darkMode
          ? "bg-red-950 text-red-300"
          : "bg-red-100 text-red-700";

      case "MEDIA":
        return darkMode
          ? "bg-yellow-950 text-yellow-300"
          : "bg-yellow-100 text-yellow-700";

      case "BAJA":
        return darkMode
          ? "bg-green-950 text-green-300"
          : "bg-green-100 text-green-700";

      default:
        return darkMode
          ? "bg-gray-700 text-gray-300"
          : "bg-gray-100 text-gray-600";
    }
  }

  function formatDate(date: string) {
    if (!date) {
      return "-";
    }

    return new Date(date).toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
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

      if (!response.ok || !data.success || !data.result) {
        throw new Error(
          data.error || "No se pudo actualizar el lead."
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

      return updatedLead;
    } catch (err) {
      console.error("[CRM] Error actualizando lead:", err);

      setError(
        err instanceof Error
          ? err.message
          : "No se pudo actualizar el lead."
      );

      return null;
    } finally {
      setSaving(false);
    }
  }

  function openLead(lead: Lead) {
    setSelectedLead(lead);
    setEditing(false);

    setForm({
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
      latitude:
        lead.latitude !== null
          ? String(lead.latitude)
          : "",
      longitude:
        lead.longitude !== null
          ? String(lead.longitude)
          : "",
      score:
        lead.score !== null
          ? String(lead.score)
          : "",
      priority: lead.priority || "",
      source: lead.source || "",
      favorite: lead.favorite,
      contacted: lead.contacted,
      notes: lead.notes || "",
    });
  }

  function closeLead() {
    setSelectedLead(null);
    setEditing(false);
    setForm(EMPTY_FORM);
  }

  function updateForm<K extends keyof LeadForm>(
    field: K,
    value: LeadForm[K]
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function saveEditedLead() {
    if (!selectedLead) {
      return;
    }

    if (!form.name.trim()) {
      setError("El nombre del lead es obligatorio.");
      return;
    }

    const scoreValue =
      form.score.trim() === ""
        ? null
        : Number(form.score);

    if (
      scoreValue !== null &&
      (Number.isNaN(scoreValue) ||
        scoreValue < 0 ||
        scoreValue > 100)
    ) {
      setError("El score debe estar entre 0 y 100.");
      return;
    }

    const latitudeValue =
      form.latitude.trim() === ""
        ? null
        : Number(form.latitude);

    const longitudeValue =
      form.longitude.trim() === ""
        ? null
        : Number(form.longitude);

    const updated = await updateLead(
      selectedLead.id,
      {
        name: form.name.trim(),
        category: form.category.trim() || null,
        city: form.city.trim() || null,
        province: form.province.trim() || null,
        address: form.address.trim() || null,
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
        website: form.website.trim() || null,
        facebook: form.facebook.trim() || null,
        instagram: form.instagram.trim() || null,
        latitude: latitudeValue,
        longitude: longitudeValue,
        score: scoreValue,
        priority: form.priority || null,
        source: form.source.trim() || null,
        favorite: form.favorite,
        contacted: form.contacted,
        notes: form.notes.trim() || null,
      }
    );

    if (updated) {
      setEditing(false);

      setForm({
        name: updated.name || "",
        category: updated.category || "",
        city: updated.city || "",
        province: updated.province || "",
        address: updated.address || "",
        phone: updated.phone || "",
        email: updated.email || "",
        website: updated.website || "",
        facebook: updated.facebook || "",
        instagram: updated.instagram || "",
        latitude:
          updated.latitude !== null
            ? String(updated.latitude)
            : "",
        longitude:
          updated.longitude !== null
            ? String(updated.longitude)
            : "",
        score:
          updated.score !== null
            ? String(updated.score)
            : "",
        priority: updated.priority || "",
        source: updated.source || "",
        favorite: updated.favorite,
        contacted: updated.contacted,
        notes: updated.notes || "",
      });
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

      const response = await fetch("/api/crm/leads", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: lead.id,
        }),
      });

      const data: ApiResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || "No se pudo eliminar el lead."
        );
      }

      setLeads((current) =>
        current.filter(
          (item) => item.id !== lead.id
        )
      );

      if (selectedLead?.id === lead.id) {
        closeLead();
      }
    } catch (err) {
      console.error("[CRM] Error eliminando lead:", err);

      setError(
        err instanceof Error
          ? err.message
          : "No se pudo eliminar el lead."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    try {
      const response = await fetch("/api/crm/logout", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || "No se pudo cerrar la sesión."
        );
      }

      window.location.href = "/crm/login";
    } catch (err) {
      console.error("[CRM] Error cerrando sesión:", err);

      setError(
        err instanceof Error
          ? err.message
          : "No se pudo cerrar la sesión."
      );
    }
  }
  const pageClasses = darkMode
    ? "min-h-screen bg-gray-950 text-gray-100 p-6"
    : "min-h-screen bg-gray-50 text-gray-900 p-6";

  const cardClasses = darkMode
    ? "rounded-xl border border-gray-800 bg-gray-900 shadow-sm"
    : "rounded-xl border border-gray-200 bg-white shadow-sm";

  const inputClasses = darkMode
    ? "w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-gray-100 outline-none placeholder:text-gray-500 focus:border-gray-400 focus:ring-2 focus:ring-gray-700"
    : "w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-gray-500 focus:ring-2 focus:ring-gray-200";

  return (
    <div className={pageClasses}>

      {/* HEADER */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

        <div>
          <h1
            className={`text-3xl font-bold ${
              darkMode
                ? "text-white"
                : "text-gray-900"
            }`}
          >
            CRM
          </h1>

          <p
            className={`mt-1 text-sm ${
              darkMode
                ? "text-gray-400"
                : "text-gray-500"
            }`}
          >
            Gestión y seguimiento de leads de
            LeadHunter Argentina
          </p>
        </div>

        <div className="flex gap-2">

          {/* DARK MODE */}
          <button
            type="button"
            onClick={() =>
              setDarkMode((current) => !current)
            }
            className={
              darkMode
                ? "rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-sm font-medium text-gray-100 transition hover:bg-gray-700"
                : "rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
            }
          >
            {darkMode
              ? "☀️ Modo claro"
              : "🌙 Modo dark"}
          </button>

          {/* LOGOUT */}
          <button
            type="button"
            onClick={() => void handleLogout()}
            disabled={saving || loading}
            className={
              darkMode
                ? "rounded-lg border border-red-900 bg-gray-900 px-4 py-2 text-sm font-medium text-red-400 transition hover:bg-red-950 disabled:cursor-not-allowed disabled:opacity-50"
                : "rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
            }
          >
            Cerrar sesión
          </button>
          {/* REFRESH */}
          <button
            type="button"
            onClick={() => void loadLeads()}
            disabled={loading || saving}
            className={
              darkMode
                ? "rounded-lg bg-white px-4 py-2 text-sm font-medium text-gray-900 transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
                : "rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
            }
          >
            {loading
              ? "Actualizando..."
              : "↻ Actualizar"}
          </button>

        </div>
      </div>

      {/* ERROR */}
      {error && (
        <div
          className={
            darkMode
              ? "mb-6 rounded-lg border border-red-900 bg-red-950/50 px-4 py-3 text-sm text-red-300"
              : "mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          }
        >
          {error}
        </div>
      )}

      {/* ESTADISTICAS */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

        <StatCard
          title="Total de leads"
          value={stats.total}
          icon="👥"
          darkMode={darkMode}
        />

        <StatCard
          title="Prioridad alta"
          value={stats.alta}
          icon="🔥"
          darkMode={darkMode}
        />

        <StatCard
          title="Contactados"
          value={stats.contactados}
          icon="📞"
          darkMode={darkMode}
        />

        <StatCard
          title="Favoritos"
          value={stats.favoritos}
          icon="⭐"
          darkMode={darkMode}
        />

      </div>

      {/* FILTROS */}
      <div className={`${cardClasses} mb-6 p-5`}>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

          <div>
            <label className="mb-2 block text-sm font-medium">
              Buscar
            </label>

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Nombre, ciudad, teléfono..."
              className={inputClasses}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Prioridad
            </label>

            <select
              value={priorityFilter}
              onChange={(event) =>
                setPriorityFilter(event.target.value)
              }
              className={inputClasses}
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
            <label className="mb-2 block text-sm font-medium">
              Estado
            </label>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value)
              }
              className={inputClasses}
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
      <div className={cardClasses}>

        <div
          className={`border-b px-5 py-4 ${
            darkMode
              ? "border-gray-800"
              : "border-gray-200"
          }`}
        >
          <div className="flex items-center justify-between">

            <h2 className="text-lg font-semibold">
              Leads
            </h2>

            <span
              className={`text-sm ${
                darkMode
                  ? "text-gray-400"
                  : "text-gray-500"
              }`}
            >
              Mostrando {filteredLeads.length} de{" "}
              {leads.length}
            </span>

          </div>
        </div>

        {loading ? (
          <div className="p-10 text-center text-sm opacity-60">
            Cargando leads...
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="p-10 text-center text-sm opacity-60">
            No se encontraron leads.
          </div>
        ) : (
          <div className="overflow-x-auto">

            <table className="min-w-262.5">

              <thead
                className={
                  darkMode
                    ? "bg-gray-800"
                    : "bg-gray-50"
                }
              >
                <tr>

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase">
                    Lead
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase">
                    Categoría
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase">
                    Ubicación
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase">
                    Contacto
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase">
                    Score
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase">
                    Prioridad
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase">
                    Estado
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase">
                    Fecha
                  </th>

                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase">
                    Acciones
                  </th>

                </tr>
              </thead>

              <tbody
                className={
                  darkMode
                    ? "divide-y divide-gray-800"
                    : "divide-y divide-gray-200"
                }
              >

                {filteredLeads.map((lead) => (

                  <tr
                    key={lead.id}
                    className={
                      darkMode
                        ? "hover:bg-gray-800/60"
                        : "hover:bg-gray-50"
                    }
                  >

                    {/* LEAD */}
                    <td className="px-5 py-4">

                      <div className="flex items-center gap-3">

                        <button
                          type="button"
                          onClick={() =>
                            void toggleFavorite(lead)
                          }
                          disabled={saving}
                          className="text-xl disabled:opacity-50"
                          title={
                            lead.favorite
                              ? "Quitar favorito"
                              : "Agregar favorito"
                          }
                        >
                          {lead.favorite
                            ? "★"
                            : "☆"}
                        </button>

                        <div>
                          <div className="font-semibold">
                            {lead.name}
                          </div>

                          {lead.email && (
                            <div className="mt-1 text-xs opacity-60">
                              {lead.email}
                            </div>
                          )}
                        </div>

                      </div>

                    </td>

                    {/* CATEGORIA */}
                    <td className="px-5 py-4 text-sm">
                      {lead.category || "-"}
                    </td>

                    {/* UBICACION */}
                    <td className="px-5 py-4">

                      <div className="text-sm font-medium">
                        {lead.city || "-"}
                      </div>

                      {lead.province && (
                        <div className="text-xs opacity-60">
                          {lead.province}
                        </div>
                      )}

                    </td>

                    {/* CONTACTO */}
                    <td className="px-5 py-4">

                      {lead.phone ? (
                        <a
                          href={`tel:${lead.phone}`}
                          className={
                            darkMode
                              ? "text-sm font-semibold text-blue-400 hover:underline"
                              : "text-sm font-semibold text-blue-600 hover:underline"
                          }
                        >
                          {lead.phone}
                        </a>
                      ) : (
                        <span className="text-sm opacity-40">
                          -
                        </span>
                      )}

                    </td>

                    {/* SCORE */}
                    <td className="px-5 py-4">

                      <span className="font-bold">
                        {lead.score ?? "-"}
                      </span>

                      {lead.score !== null && (
                        <span className="opacity-40">
                          /100
                        </span>
                      )}

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
                          void toggleContacted(lead)
                        }
                        disabled={saving}
                        className={
                          lead.contacted
                            ? darkMode
                              ? "rounded-full bg-green-950 px-3 py-1 text-xs font-semibold text-green-300"
                              : "rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700"
                            : darkMode
                              ? "rounded-full bg-gray-800 px-3 py-1 text-xs font-semibold text-gray-400"
                              : "rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600"
                        }
                      >
                        {lead.contacted
                          ? "Contactado"
                          : "No contactado"}
                      </button>

                    </td>

                    {/* FECHA */}
                    <td className="px-5 py-4 text-sm opacity-60">
                      {formatDate(lead.createdAt)}
                    </td>

                    {/* ACCIONES */}
                    <td className="px-5 py-4">

                      <div className="flex justify-end gap-2">

                        <button
                          type="button"
                          onClick={() =>
                            openLead(lead)
                          }
                          className={
                            darkMode
                              ? "rounded-lg border border-gray-700 px-3 py-1.5 text-xs font-medium hover:bg-gray-800"
                              : "rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium hover:bg-gray-100"
                          }
                        >
                          Ver / Editar
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            void deleteLead(lead)
                          }
                          disabled={saving}
                          className={
                            darkMode
                              ? "rounded-lg border border-red-900 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-950 disabled:opacity-50"
                              : "rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                          }
                        >
                          Eliminar
                        </button>

                      </div>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>
        )}

      </div>

      {/* MODAL */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">

          <div
            className={
              darkMode
                ? "max-h-[95vh] w-full max-w-5xl overflow-y-auto rounded-2xl border border-gray-800 bg-gray-900 shadow-2xl"
                : "max-h-[95vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
            }
          >

            {/* MODAL HEADER */}
            <div
              className={`sticky top-0 z-10 flex items-center justify-between border-b px-6 py-4 ${
                darkMode
                  ? "border-gray-800 bg-gray-900"
                  : "border-gray-200 bg-white"
              }`}
            >

              <div>
                <h2 className="text-xl font-bold">
                  {editing
                    ? "Editar lead"
                    : selectedLead.name}
                </h2>

                <p className="text-sm opacity-60">
                  {editing
                    ? "Modificá los datos y guardá los cambios."
                    : "Detalle del lead"}
                </p>
              </div>

              <button
                type="button"
                onClick={closeLead}
                className="rounded-lg px-3 py-2 text-2xl opacity-60 hover:bg-gray-500/10"
              >
                ×
              </button>

            </div>

            {/* FORMULARIO */}
            <div className="p-6">

              {editing ? (

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

                  <FormField
                    label="Nombre"
                    value={form.name}
                    onChange={(value) =>
                      updateForm("name", value)
                    }
                    darkMode={darkMode}
                    required
                  />

                  <FormField
                    label="Categoría"
                    value={form.category}
                    onChange={(value) =>
                      updateForm("category", value)
                    }
                    darkMode={darkMode}
                  />

                  <FormField
                    label="Ciudad"
                    value={form.city}
                    onChange={(value) =>
                      updateForm("city", value)
                    }
                    darkMode={darkMode}
                  />

                  <FormField
                    label="Provincia"
                    value={form.province}
                    onChange={(value) =>
                      updateForm("province", value)
                    }
                    darkMode={darkMode}
                  />

                  <FormField
                    label="Dirección"
                    value={form.address}
                    onChange={(value) =>
                      updateForm("address", value)
                    }
                    darkMode={darkMode}
                  />

                  <FormField
                    label="Teléfono"
                    value={form.phone}
                    onChange={(value) =>
                      updateForm("phone", value)
                    }
                    darkMode={darkMode}
                  />

                  <FormField
                    label="Email"
                    type="email"
                    value={form.email}
                    onChange={(value) =>
                      updateForm("email", value)
                    }
                    darkMode={darkMode}
                  />

                  <FormField
                    label="Website"
                    value={form.website}
                    onChange={(value) =>
                      updateForm("website", value)
                    }
                    darkMode={darkMode}
                  />

                  <FormField
                    label="Facebook"
                    value={form.facebook}
                    onChange={(value) =>
                      updateForm("facebook", value)
                    }
                    darkMode={darkMode}
                  />

                  <FormField
                    label="Instagram"
                    value={form.instagram}
                    onChange={(value) =>
                      updateForm("instagram", value)
                    }
                    darkMode={darkMode}
                  />

                  <FormField
                    label="Latitud"
                    type="number"
                    value={form.latitude}
                    onChange={(value) =>
                      updateForm("latitude", value)
                    }
                    darkMode={darkMode}
                  />

                  <FormField
                    label="Longitud"
                    type="number"
                    value={form.longitude}
                    onChange={(value) =>
                      updateForm("longitude", value)
                    }
                    darkMode={darkMode}
                  />

                  <FormField
                    label="Score"
                    type="number"
                    value={form.score}
                    onChange={(value) =>
                      updateForm("score", value)
                    }
                    darkMode={darkMode}
                  />

                  <div>

                    <label className="mb-2 block text-sm font-semibold">
                      Prioridad
                    </label>

                    <select
                      value={form.priority}
                      onChange={(event) =>
                        updateForm(
                          "priority",
                          event.target.value
                        )
                      }
                      className={inputClasses}
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

                  <FormField
                    label="Fuente"
                    value={form.source}
                    onChange={(value) =>
                      updateForm("source", value)
                    }
                    darkMode={darkMode}
                  />

                  <div className="md:col-span-2">

                    <label className="mb-2 block text-sm font-semibold">
                      Notas
                    </label>

                    <textarea
                      value={form.notes}
                      onChange={(event) =>
                        updateForm(
                          "notes",
                          event.target.value
                        )
                      }
                      rows={5}
                      className={inputClasses}
                      placeholder="Notas del lead..."
                    />

                  </div>

                  <div className="flex flex-wrap gap-6 md:col-span-2">

                    <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">

                      <input
                        type="checkbox"
                        checked={form.favorite}
                        onChange={(event) =>
                          updateForm(
                            "favorite",
                            event.target.checked
                          )
                        }
                        className="h-4 w-4"
                      />

                      ⭐ Favorito

                    </label>

                    <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">

                      <input
                        type="checkbox"
                        checked={form.contacted}
                        onChange={(event) =>
                          updateForm(
                            "contacted",
                            event.target.checked
                          )
                        }
                        className="h-4 w-4"
                      />

                      📞 Contactado

                    </label>

                  </div>

                </div>

              ) : (

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">

                  <DetailItem
                    label="Nombre"
                    value={selectedLead.name}
                  />

                  <DetailItem
                    label="Categoría"
                    value={selectedLead.category}
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
                    label="Latitud"
                    value={selectedLead.latitude}
                  />

                  <DetailItem
                    label="Longitud"
                    value={selectedLead.longitude}
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
                    label="Fuente"
                    value={selectedLead.source}
                  />

                  <DetailItem
                    label="Estado"
                    value={
                      selectedLead.contacted
                        ? "Contactado"
                        : "No contactado"
                    }
                  />

                  <div className="md:col-span-2">

                    <div className="mb-2 text-xs font-semibold uppercase opacity-50">
                      Notas
                    </div>

                    <div
                      className={
                        darkMode
                          ? "whitespace-pre-wrap rounded-lg border border-gray-800 bg-gray-950 p-4 text-sm"
                          : "whitespace-pre-wrap rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm"
                      }
                    >
                      {selectedLead.notes || "Sin notas"}
                    </div>

                  </div>

                </div>

              )}

            </div>

            {/* MODAL FOOTER */}
            <div
              className={`flex flex-wrap justify-between gap-3 border-t px-6 py-4 ${
                darkMode
                  ? "border-gray-800"
                  : "border-gray-200"
              }`}
            >

              <div className="flex flex-wrap gap-2">

                <button
                  type="button"
                  disabled={saving}
                  onClick={() =>
                    void toggleFavorite(
                      selectedLead
                    )
                  }
                  className={
                    darkMode
                      ? "rounded-lg border border-gray-700 px-4 py-2 text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
                      : "rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-100 disabled:opacity-50"
                  }
                >
                  {selectedLead.favorite
                    ? "★ Quitar favorito"
                    : "☆ Agregar favorito"}
                </button>

                <button
                  type="button"
                  disabled={saving}
                  onClick={() =>
                    void toggleContacted(
                      selectedLead
                    )
                  }
                  className={
                    darkMode
                      ? "rounded-lg border border-gray-700 px-4 py-2 text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
                      : "rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-100 disabled:opacity-50"
                  }
                >
                  {selectedLead.contacted
                    ? "Marcar no contactado"
                    : "✓ Marcar contactado"}
                </button>

              </div>

              <div className="flex flex-wrap gap-2">

                {editing ? (

                  <>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() =>
                        setEditing(false)
                      }
                      className={
                        darkMode
                          ? "rounded-lg border border-gray-700 px-4 py-2 text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
                          : "rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-100 disabled:opacity-50"
                      }
                    >
                      Cancelar
                    </button>

                    <button
                      type="button"
                      disabled={saving}
                      onClick={() =>
                        void saveEditedLead()
                      }
                      className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      {saving
                        ? "Guardando..."
                        : "Guardar cambios"}
                    </button>
                  </>

                ) : (

                  <button
                    type="button"
                    onClick={() =>
                      setEditing(true)
                    }
                    className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    ✏️ Editar lead
                  </button>

                )}

                <button
                  type="button"
                  disabled={saving}
                  onClick={() =>
                    void deleteLead(
                      selectedLead
                    )
                  }
                  className={
                    darkMode
                      ? "rounded-lg border border-red-900 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-950 disabled:opacity-50"
                      : "rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                  }
                >
                  Eliminar
                </button>

                <button
                  type="button"
                  onClick={closeLead}
                  className={
                    darkMode
                      ? "rounded-lg bg-gray-800 px-4 py-2 text-sm font-medium hover:bg-gray-700"
                      : "rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium hover:bg-gray-200"
                  }
                >
                  Cerrar
                </button>

              </div>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}

/* ============================================================
   COMPONENTE FORM FIELD
   ============================================================ */

function FormField({
  label,
  value,
  onChange,
  darkMode,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  darkMode: boolean;
  type?: string;
  required?: boolean;
}) {
  const inputClasses = darkMode
    ? "w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-gray-100 outline-none placeholder:text-gray-500 focus:border-gray-400 focus:ring-2 focus:ring-gray-700"
    : "w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-gray-500 focus:ring-2 focus:ring-gray-200";

  return (
    <div>
      <label className="mb-2 block text-sm font-semibold">
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
        className={inputClasses}
      />
    </div>
  );
}

/* ============================================================
   COMPONENTE STAT CARD
   ============================================================ */

function StatCard({
  title,
  value,
  icon,
  darkMode,
}: {
  title: string;
  value: number;
  icon: string;
  darkMode: boolean;
}) {
  return (
    <div
      className={
        darkMode
          ? "rounded-xl border border-gray-800 bg-gray-900 p-5 shadow-sm"
          : "rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
      }
    >
      <div className="flex items-center justify-between">

        <div>

          <p
            className={
              darkMode
                ? "text-sm text-gray-400"
                : "text-sm text-gray-500"
            }
          >
            {title}
          </p>

          <p className="mt-2 text-3xl font-bold">
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
   COMPONENTE DETALLE
   ============================================================ */

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: string | number | null;
}) {
  return (
    <div className="min-w-0">

      <div className="mb-1 text-xs font-semibold uppercase opacity-50">
        {label}
      </div>

      <div className="wrap-break-word text-sm font-medium">
        {value !== null &&
        value !== undefined &&
        value !== ""
          ? value
          : "-"}

      </div>

    </div>
  );
}




