"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";

/* ============================================================
   TIPOS
   ============================================================ */

type SearchLead = {
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
};

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

type ManualLeadForm = {
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

const INITIAL_MANUAL_LEAD: ManualLeadForm = {
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
  priority: "media",
  source: "manual",
  favorite: false,
  contacted: false,
  notes: "",
};


type ApiResponse = {
  success: boolean;
  count?: number;
  results?: Lead[];
  result?: Lead;
  duplicate?: boolean;
  existingLeadId?: string;
  message?: string;
  error?: string;
};

/* ============================================================
   FORMULARIO VACÍO
   ============================================================ */

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

/* ============================================================
   COMPONENTE PRINCIPAL
   ============================================================ */


export default function DashboardPage() {
  /* ----------------------------------------------------------
     BUSCADOR
     ---------------------------------------------------------- */

  const [rubro, setRubro] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [provincia, setProvincia] = useState("todas");

  const [searchResults, setSearchResults] = useState<SearchLead[]>(
    []
  );

  const [searchLoading, setSearchLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  /* ----------------------------------------------------------
     GUARDADO DE RESULTADOS
     ---------------------------------------------------------- */

  const [savingSearchId, setSavingSearchId] = useState<string | null>(
    null
  );

  const [savedSearchIds, setSavedSearchIds] = useState<Set<string>>(
    () => new Set()
  );

  const savingSearchIdsRef = useRef<Set<string>>(new Set());

  /* ----------------------------------------------------------
     CRM
     ---------------------------------------------------------- */

  const [leads, setLeads] = useState<Lead[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(true);

  const [crmSearch, setCrmSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("TODAS");
  const [statusFilter, setStatusFilter] = useState("TODOS");

  const [selectedLead, setSelectedLead] = useState<Lead | null>(
    null
  );

  const [editing, setEditing] = useState(false);

  const [form, setForm] = useState<LeadForm>(EMPTY_FORM);

  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);

  const [manualLead, setManualLead] =
  useState<ManualLeadForm>(INITIAL_MANUAL_LEAD);

  const [savingManual, setSavingManual] = useState(false);

  const [activeTab, setActiveTab] =
  useState<"search" | "manual">("search");
  /* ----------------------------------------------------------
     UI
     ---------------------------------------------------------- */

  const [darkMode, setDarkMode] = useState(false);

  const [error, setError] = useState("");

  const [successMessage, setSuccessMessage] = useState("");

  /* ============================================================
     CARGAR LEADS DEL CRM
     ============================================================ */

  const loadLeads = useCallback(async () => {
    try {
      setLoadingLeads(true);
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
      console.error("[Dashboard] Error cargando leads:", err);

      setError(
        err instanceof Error
          ? err.message
          : "No se pudieron cargar los leads."
      );
    } finally {
      setLoadingLeads(false);
    }
  }, []);

  /* ----------------------------------------------------------
     Carga inicial
     ---------------------------------------------------------- */

  useEffect(() => {
  const timer = window.setTimeout(() => {
    void loadLeads();
  }, 0);

  return () => {
    window.clearTimeout(timer);
  };
}, [loadLeads]);

  /* ============================================================
     BUSCAR
     ============================================================ */

  const handleSearch = async (event: FormEvent) => {
    event.preventDefault();

    if (!rubro.trim() || !ciudad.trim()) {
      alert("Por favor completá el rubro y la ciudad.");
      return;
    }

    setSearchLoading(true);
    setSearched(true);
    setError("");
    setSuccessMessage("");

    setSavedSearchIds(new Set());
    savingSearchIdsRef.current.clear();

    try {
      const url =
        `/api/search?rubro=${encodeURIComponent(rubro)}` +
        `&ciudad=${encodeURIComponent(ciudad)}` +
        `&provincia=${encodeURIComponent(provincia)}`;

      const response = await fetch(url);

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || "No se pudo realizar la búsqueda."
        );
      }

      setSearchResults(data.results || []);
    } catch (err) {
      console.error("[Dashboard] Error buscando:", err);

      setSearchResults([]);

      setError(
        err instanceof Error
          ? err.message
          : "No se pudo realizar la búsqueda."
      );
    } finally {
      setSearchLoading(false);
    }
  };

  /* ============================================================
     GUARDAR RESULTADO DE BÚSQUEDA
     ============================================================ */

  const handleSaveSearchLead = async (
    lead: SearchLead
  ) => {
    if (
      savingSearchIdsRef.current.has(lead.id) ||
      savedSearchIds.has(lead.id)
    ) {
      return;
    }

    savingSearchIdsRef.current.add(lead.id);

    setSavingSearchId(lead.id);
    setError("");
    setSuccessMessage("");

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
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
          source: lead.fuentes.join(", "),
        }),
      });

      const data: ApiResponse = await response.json();

      if (data.success) {
        setSavedSearchIds((current) => {
          const next = new Set(current);
          next.add(lead.id);
          return next;
        });

        setSuccessMessage(
          `Lead "${lead.nombre}" creado correctamente.`
        );

        /*
         * Actualizamos inmediatamente el listado CRM.
         */
        await loadLeads();

        return;
      }

      savingSearchIdsRef.current.delete(lead.id);

      if (data.duplicate) {
        alert(
          `⚠️ El lead "${lead.nombre}" ya existe en el CRM.`
        );

        /*
         * Lo recargamos para que el usuario pueda verlo
         * en la sección Mis Leads.
         */
        await loadLeads();
      } else {
        alert(
          data.error ||
            "No se pudo guardar el lead."
        );
      }
    } catch (err) {
      savingSearchIdsRef.current.delete(lead.id);

      console.error(
        "[Dashboard] Error guardando lead:",
        err
      );

      alert(
        "Error de conexión al guardar el lead."
      );
    } finally {
      setSavingSearchId(null);
    }
  };


  /* ============================================================
   CARGA MANUAL DE LEAD
   ============================================================ */

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
    alert("El nombre del lead es obligatorio.");
    return;
  }

  setSavingManual(true);
  setError("");
  setSuccessMessage("");

  try {
    const response = await fetch("/api/leads", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(manualLead),
    });

    const data: ApiResponse = await response.json();

    if (data.success) {
      setSuccessMessage(
        `Lead "${manualLead.name}" creado correctamente.`
      );

      setManualLead(INITIAL_MANUAL_LEAD);

      // Actualizamos inmediatamente el listado del CRM.
      await loadLeads();

      return;
    }

    if (data.duplicate) {
      alert(
        `⚠️ El lead "${manualLead.name}" ya existe en el CRM.`
      );

      await loadLeads();
    } else {
      alert(
        data.error ||
          "No se pudo guardar el lead."
      );
    }
  } catch (err) {
    console.error(
      "[Dashboard] Error guardando lead manual:",
      err
    );

    alert(
      "Error de conexión al guardar el lead."
    );
  } finally {
    setSavingManual(false);
  }
};


  /* ============================================================
     FILTROS CRM
     ============================================================ */

  const filteredLeads = useMemo(() => {
    const normalizedSearch =
      crmSearch.trim().toLowerCase();

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
        (lead.priority || "").toUpperCase() ===
          priorityFilter;

      const matchesStatus =
        statusFilter === "TODOS" ||
        (statusFilter === "CONTACTADOS" &&
          lead.contacted) ||
        (statusFilter === "NO_CONTACTADOS" &&
          !lead.contacted) ||
        (statusFilter === "FAVORITOS" &&
          lead.favorite);

      return (
        matchesSearch &&
        matchesPriority &&
        matchesStatus
      );
    });
  }, [
    leads,
    crmSearch,
    priorityFilter,
    statusFilter,
  ]);

  /* ============================================================
     ESTADÍSTICAS
     ============================================================ */

  const stats = useMemo(() => {
    return {
      total: leads.length,

      alta: leads.filter(
        (lead) =>
          (lead.priority || "").toUpperCase() ===
          "ALTA"
      ).length,

      contactados: leads.filter(
        (lead) => lead.contacted
      ).length,

      favoritos: leads.filter(
        (lead) => lead.favorite
      ).length,
    };
  }, [leads]);

  /* ============================================================
     ACTUALIZAR LEAD
     ============================================================ */

  async function updateLead(
    id: string,
    changes: Partial<Lead>
  ) {
    if (savingRef.current) {
      return null;
    }

    savingRef.current = true;

    try {
      setSaving(true);
      setError("");

      const response = await fetch(
        "/api/crm/leads",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id,
            ...changes,
          }),
        }
      );

      const data: ApiResponse =
        await response.json();

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

      return updatedLead;
    } catch (err) {
      console.error(
        "[Dashboard] Error actualizando lead:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "No se pudo actualizar el lead."
      );

      return null;
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  /* ============================================================
     ABRIR LEAD
     ============================================================ */

  function openLead(lead: Lead) {
    setSelectedLead(lead);
    setEditing(false);
    setError("");

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

  /* ============================================================
     CERRAR LEAD
     ============================================================ */

  function closeLead() {
    setSelectedLead(null);
    setEditing(false);
    setForm(EMPTY_FORM);
    setError("");
  }

  /* ============================================================
     FORMULARIO
     ============================================================ */

  function updateForm<K extends keyof LeadForm>(
    field: K,
    value: LeadForm[K]
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  /* ============================================================
     GUARDAR EDICIÓN
     ============================================================ */

  async function saveEditedLead() {
    if (savingRef.current) {
      return;
    }

    if (!selectedLead) {
      return;
    }

    if (!form.name.trim()) {
      setError(
        "El nombre del lead es obligatorio."
      );
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
      setError(
        "El score debe estar entre 0 y 100."
      );
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
        category:
          form.category.trim() || null,
        city: form.city.trim() || null,
        province:
          form.province.trim() || null,
        address:
          form.address.trim() || null,
        phone:
          form.phone.trim() || null,
        email:
          form.email.trim() || null,
        website:
          form.website.trim() || null,
        facebook:
          form.facebook.trim() || null,
        instagram:
          form.instagram.trim() || null,
        latitude: latitudeValue,
        longitude: longitudeValue,
        score: scoreValue,
        priority:
          form.priority || null,
        source:
          form.source.trim() || null,
        favorite: form.favorite,
        contacted: form.contacted,
        notes:
          form.notes.trim() || null,
      }
    );

    if (updated) {
      setEditing(false);

      setSuccessMessage(
        `Lead "${updated.name}" actualizado correctamente.`
      );
    }
  }

  /* ============================================================
     FAVORITO
     ============================================================ */

  async function toggleFavorite(
    lead: Lead
  ) {
    if (savingRef.current) {
      return;
    }

    await updateLead(lead.id, {
      favorite: !lead.favorite,
    });
  }

  /* ============================================================
     CONTACTADO
     ============================================================ */

  async function toggleContacted(
    lead: Lead
  ) {
    if (savingRef.current) {
      return;
    }

    await updateLead(lead.id, {
      contacted: !lead.contacted,
    });
  }

  /* ============================================================
     ELIMINAR
     ============================================================ */

  async function deleteLead(
    lead: Lead
  ) {
    const confirmed =
      window.confirm(
        `¿Seguro que querés eliminar "${lead.name}"?`
      );

    if (!confirmed) {
      return;
    }

    if (savingRef.current) {
      return;
    }

    savingRef.current = true;

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

      if (
        selectedLead?.id === lead.id
      ) {
        closeLead();
      }

      setSuccessMessage(
        `Lead "${lead.name}" eliminado correctamente.`
      );
    } catch (err) {
      console.error(
        "[Dashboard] Error eliminando lead:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "No se pudo eliminar el lead."
      );
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  /* ============================================================
     LOGOUT
     ============================================================ */

  async function handleLogout() {
    try {
      const response = await fetch(
        "/api/crm/logout",
        {
          method: "POST",
        }
      );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.error ||
            "No se pudo cerrar la sesión."
        );
      }

      window.location.href =
        "/crm/login";
    } catch (err) {
      console.error(
        "[Dashboard] Error cerrando sesión:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "No se pudo cerrar la sesión."
      );
    }
  }

  /* ============================================================
     ESTILOS
     ============================================================ */

  const cardClasses = darkMode
  ? "rounded-xl border border-slate-800 bg-slate-900 shadow-sm"
  : "rounded-xl border border-slate-200 bg-white shadow-sm";

  const inputClasses = darkMode
  ? "w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-900"
  : "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

  /* ============================================================
     RENDER
     ============================================================ */

  return (
    <div className={darkMode ? "min-h-screen bg-slate-950 text-slate-100 p-4 md:p-6 [&_.text-slate-900]:!text-slate-100 [&_.text-slate-800]:!text-slate-200 [&_.text-slate-700]:!text-slate-300 [&_.text-slate-600]:!text-slate-400 [&_.text-black]:!text-slate-100" : "min-h-screen bg-slate-50 text-slate-900 p-4 md:p-6"}>

      <div className="mx-auto max-w-[1600px] space-y-6">

        {/* ======================================================
            HEADER
            ====================================================== */}

        <header
          className={`${cardClasses} p-5`}
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

            <div>
              <h1 className={darkMode ? "text-3xl font-bold text-white" : "text-3xl font-bold text-slate-900"}>
                LeadHunter Argentina
              </h1>

              <p className={darkMode ? "mt-1 text-sm text-slate-400" : "mt-1 text-sm text-slate-500"}>
                Búsqueda, gestión y seguimiento de leads
                en un solo lugar.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">

              <button
                type="button"
                onClick={() =>
                  setDarkMode(
                    (current) => !current
                  )
                }
                className={darkMode ? "rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-700" : "rounded-lg border border-slate-300 bg-slate-100 px-4 py-2 text-sm font-medium text-slate-800 transition hover:bg-slate-200"}
              >
                {darkMode
                  ? "☀️ Modo claro"
                  : "🌙 Modo dark"}
              </button>

              <button
                type="button"
                onClick={() =>
                  void loadLeads()
                }
                disabled={
                  loadingLeads ||
                  saving
                }
                className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-900 transition hover:bg-white disabled:opacity-50"
              >
                {loadingLeads
                  ? "Actualizando..."
                  : "↻ Actualizar"}
              </button>

              <button
                type="button"
                onClick={() =>
                  void handleLogout()
                }
                disabled={saving}
                className="rounded-lg border border-red-900 bg-white px-4 py-2 text-sm font-medium text-red-400 transition hover:bg-red-950 disabled:opacity-50"
              >
                Cerrar sesión
              </button>

            </div>
          </div>
        </header>

        {/* ======================================================
            ERROR
            ====================================================== */}

        {error && (
          <div className="rounded-lg border border-red-900 bg-red-950/50 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* ======================================================
            ÉXITO
            ====================================================== */}

        {successMessage && (
          <div className="flex flex-col gap-3 rounded-xl border border-emerald-800 bg-emerald-950/50 p-4 md:flex-row md:items-center md:justify-between">

            <div>
              <p className="font-semibold text-emerald-300">
                ✓ {successMessage}
              </p>

              <p className="mt-1 text-sm text-emerald-400/80">
                La información ya está actualizada.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setSuccessMessage("")
              }
              className="rounded-lg border border-emerald-800 px-3 py-2 text-sm text-emerald-300 hover:bg-emerald-900/50"
            >
              Cerrar
            </button>

          </div>
        )}

        {/* ======================================================
            BUSCADOR
            ====================================================== */}

                {/* ======================================================
            NAVEGACIÓN PRINCIPAL
            ====================================================== */}

        <div className={`${cardClasses} p-2`}>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">

            <button
              type="button"
              onClick={() => setActiveTab("search")}
              className={`rounded-lg px-4 py-3 text-sm font-semibold transition ${
                activeTab === "search"
                  ? "bg-blue-600 text-white shadow-sm"
                  : darkMode
                    ? "text-slate-300 hover:bg-slate-800"
                    : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              🔎 Buscar leads
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("manual")}
              className={`rounded-lg px-4 py-3 text-sm font-semibold transition ${
                activeTab === "manual"
                  ? "bg-blue-600 text-white shadow-sm"
                  : darkMode
                    ? "text-slate-300 hover:bg-slate-800"
                    : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              ➕ Cargar lead manualmente
            </button>

          </div>
        </div>

        {activeTab === "manual" && (
          <section className={`${cardClasses} p-6`}>

            <div className="mb-6">
              <h2 className={darkMode ? "text-xl font-bold text-white" : "text-xl font-bold text-slate-900"}>
                ➕ Cargar lead manualmente
              </h2>

              <p className={darkMode ? "mt-1 text-sm text-slate-400" : "mt-1 text-sm text-slate-500"}>
                Completá los datos del prospecto y guardalo directamente en el CRM.
              </p>
            </div>

            <form
              onSubmit={handleManualSubmit}
              className="grid grid-cols-1 gap-5 md:grid-cols-2"
            >

              <FormField
                darkMode={darkMode}
                label="Nombre"
                value={manualLead.name}
                onChange={(value) => handleManualChange("name", value)}
                required
              />

              <FormField
                darkMode={darkMode}
                label="Rubro / Categoría"
                value={manualLead.category}
                onChange={(value) => handleManualChange("category", value)}
              />

              <FormField
                darkMode={darkMode}
                label="Ciudad"
                value={manualLead.city}
                onChange={(value) => handleManualChange("city", value)}
              />

              <FormField
                darkMode={darkMode}
                label="Provincia"
                value={manualLead.province}
                onChange={(value) => handleManualChange("province", value)}
              />

              <FormField
                darkMode={darkMode}
                label="Dirección"
                value={manualLead.address}
                onChange={(value) => handleManualChange("address", value)}
              />

              <FormField
                darkMode={darkMode}
                label="Teléfono"
                value={manualLead.phone}
                onChange={(value) => handleManualChange("phone", value)}
              />

              <FormField
                darkMode={darkMode}
                label="Email"
                type="email"
                value={manualLead.email}
                onChange={(value) => handleManualChange("email", value)}
              />

              <FormField
                darkMode={darkMode}
                label="Sitio web"
                value={manualLead.website}
                onChange={(value) => handleManualChange("website", value)}
              />

              <FormField
                darkMode={darkMode}
                label="Facebook"
                value={manualLead.facebook}
                onChange={(value) => handleManualChange("facebook", value)}
              />

              <FormField
                darkMode={darkMode}
                label="Instagram"
                value={manualLead.instagram}
                onChange={(value) => handleManualChange("instagram", value)}
              />

              <FormField
                darkMode={darkMode}
                label="Latitud"
                type="number"
                value={manualLead.latitude}
                onChange={(value) => handleManualChange("latitude", value)}
              />

              <FormField
                darkMode={darkMode}
                label="Longitud"
                type="number"
                value={manualLead.longitude}
                onChange={(value) => handleManualChange("longitude", value)}
              />

              <FormField
                darkMode={darkMode}
                label="Score"
                type="number"
                value={manualLead.score}
                onChange={(value) => handleManualChange("score", value)}
              />

              <div>
                <label className={darkMode ? "mb-2 block text-sm font-medium text-slate-200" : "mb-2 block text-sm font-medium text-slate-700"}>
                  Prioridad
                </label>

                <select
                  value={manualLead.priority}
                  onChange={(event) =>
                    handleManualChange("priority", event.target.value)
                  }
                  className={inputClasses}
                >
                  <option value="alta">Alta</option>
                  <option value="media">Media</option>
                  <option value="baja">Baja</option>
                </select>
              </div>

              <FormField
                darkMode={darkMode}
                label="Fuente"
                value={manualLead.source}
                onChange={(value) => handleManualChange("source", value)}
              />

              <div className="md:col-span-2">

                <label className={darkMode ? "mb-2 block text-sm font-medium text-slate-200" : "mb-2 block text-sm font-medium text-slate-700"}>
                  Notas
                </label>

                <textarea
                  value={manualLead.notes}
                  onChange={(event) =>
                    handleManualChange("notes", event.target.value)
                  }
                  rows={4}
                  placeholder="Notas adicionales sobre el lead..."
                  className={inputClasses}
                />

              </div>

              <div className="md:col-span-2 flex flex-wrap gap-6">

                <label className={darkMode ? "flex items-center gap-2 text-sm text-slate-300" : "flex items-center gap-2 text-sm text-slate-700"}>
                  <input
                    type="checkbox"
                    checked={manualLead.favorite}
                    onChange={(event) =>
                      handleManualChange("favorite", event.target.checked)
                    }
                  />
                  Favorito
                </label>

                <label className={darkMode ? "flex items-center gap-2 text-sm text-slate-300" : "flex items-center gap-2 text-sm text-slate-700"}>
                  <input
                    type="checkbox"
                    checked={manualLead.contacted}
                    onChange={(event) =>
                      handleManualChange("contacted", event.target.checked)
                    }
                  />
                  Contactado
                </label>

              </div>

              <div className="md:col-span-2 flex justify-end">

                <button
                  type="submit"
                  disabled={savingManual}
                  className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {savingManual ? "Guardando..." : "💾 Guardar lead"}
                </button>

              </div>

            </form>

          </section>
        )}

        {activeTab === "search" && (
          <><section className={`${cardClasses} p-6`}>

          <div className="mb-5">
            <h2 className={ darkMode
                ? "text-xl font-bold text-white"
                : "text-xl font-bold text-slate-900"}
            >
            🔎 Buscar empresas y leads
           </h2>

            <p className={darkMode ? "mt-1 text-sm text-slate-400" : "mt-1 text-sm text-slate-500"}>
              Buscá nuevos prospectos y guardalos
              directamente en tu base.
            </p>
          </div>

          <form
            onSubmit={handleSearch}
            className="grid grid-cols-1 gap-4 md:grid-cols-3"
          >

            <div>
              <label className={darkMode
               ? "mb-2 block text-sm font-medium text-slate-200"
               : "mb-2 block text-sm font-medium text-slate-700"}
               >
                Rubro
            </label>

              <input
                type="text"
                value={rubro}
                onChange={(event) =>
                  setRubro(
                    event.target.value
                  )
                }
                placeholder="Ej: gomería, clínica, ferretería"
                className={inputClasses}
              />
            </div>

            
              <div>
              <label className={darkMode
               ? "mb-2 block text-sm font-medium text-slate-200"
               : "mb-2 block text-sm font-medium text-slate-700"}
               >
                Ciudad
            </label>

              <input
                type="text"
                value={ciudad}
                onChange={(event) =>
                  setCiudad(
                    event.target.value
                  )
                }
                placeholder="Ej: Balcarce, Mar del Plata"
                className={inputClasses}
              />
            </div>

            <div>
              <label className={darkMode
               ? "mb-2 block text-sm font-medium text-slate-200"
               : "mb-2 block text-sm font-medium text-slate-700"}
               >
                Provincia
              </label>

              <select
                value={provincia}
                onChange={(event) =>
                  setProvincia(
                    event.target.value
                  )
                }
                className={inputClasses}
              >
                <option value="todas">
                  Todas
                </option>

                <option value="bsas">
                  Buenos Aires
                </option>

                <option value="caba">
                  CABA
                </option>

                <option value="cordoba">
                  Córdoba
                </option>

                <option value="santa-fe">
                  Santa Fe
                </option>
              </select>
            </div>

            <div className="md:col-span-3 flex justify-end">

              <button
                type="submit"
                disabled={searchLoading}
                className="rounded-lg bg-blue-600 px-6 py-2.5 font-semibold text-white transition hover:bg-blue-500 disabled:opacity-50"
              >
                {searchLoading
                  ? "Consultando pipeline..."
                  : "🔎 Buscar leads"}
              </button>

            </div>

          </form>
        </section>

        {/* ======================================================
            RESULTADOS DE BÚSQUEDA
            ====================================================== */}

        {searched && (
          <section>

            <div className="mb-4 flex items-center justify-between">

              <div>
                <h2 className={darkMode
                    ? "text-xl font-bold text-white"
                    : "text-xl font-bold text-slate-900"}
                      >
                      Resultados de búsqueda
                </h2>
                <p className={darkMode ? "mt-1 text-sm text-slate-400" : "mt-1 text-sm text-slate-500"}>
                  {searchResults.length} leads encontrados
                </p>
              </div>

            </div>

            {searchLoading ? (
              <div className={`${cardClasses} p-12 text-center text-slate-500`}>
                <p className="animate-pulse">
                  Ejecutando motores de búsqueda en paralelo...
                </p>
              </div>
            ) : searchResults.length === 0 ? (
              <div className={`${cardClasses} p-12 text-center text-slate-500`}>
                No se encontraron leads para esta búsqueda.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">

                {searchResults.map(
                  (lead) => {
                    const isSaving =
                      savingSearchId ===
                      lead.id;

                    const isSaved =
                      savedSearchIds.has(
                        lead.id
                      );

                    return (
                      <div
                        key={lead.id}
                        className={`flex flex-col justify-between rounded-xl border p-5 ${darkMode ? "bg-slate-900" : "bg-white"} ${
                          isSaved
                            ? "border-emerald-800"
                            : "border-slate-200 hover:border-blue-700"
                        }`}
                      >

                        <div>

                          <div className="mb-3 flex items-start justify-between gap-3">

                            <h3 className={darkMode ? "text-lg font-bold text-white" : "text-lg font-bold text-slate-900"}>
                              {lead.nombre}
                            </h3>

                            <span className={darkMode ? "shrink-0 rounded-full border border-emerald-700 bg-emerald-950 px-2.5 py-1 text-xs font-semibold text-emerald-300" : "shrink-0 rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700"}>
                              {lead.scoreIA}
                            </span>

                          </div>

                          <p className={darkMode
                               ? "mb-2 text-sm text-slate-400"
                               : "mb-2 text-sm text-slate-500"}
                                  >
                                 📍 {lead.ciudad},{" "}
                                     {lead.provincia}
                         </p>

                          <p className={darkMode ? "mb-2 text-sm text-slate-300" : "mb-2 text-sm text-slate-700"}>
                            🏷️ {lead.rubro}
                          </p>

                          <p className={darkMode ? "mb-2 text-sm text-slate-300" : "mb-2 text-sm text-slate-700"}>
                            📞{" "}
                            {lead.telefono ||
                              "No disponible"}
                          </p>

                          <p className={darkMode
                              ? "mb-4 text-sm text-slate-300"
                              : "mb-4 text-sm text-slate-700"}
                            >
                            </p>
                          <div className="mb-4 flex flex-wrap gap-1">

                            {lead.fuentes.map(
                              (
                                fuente,
                                index
                              ) => (
                                <span
                                  key={`${fuente}-${index}`}
                                  className={darkMode ? "rounded-full border border-blue-700 bg-blue-950 px-2.5 py-1 text-xs font-semibold text-blue-300" : "rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700"}
                                >
                                  {fuente}
                                </span>
                              )
                            )}

                          </div>

                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            void handleSaveSearchLead(
                              lead
                            )
                          }
                          disabled={
                            isSaving ||
                            isSaved
                          }
                          className={`w-full rounded-lg border py-2.5 text-sm font-semibold transition ${
                            isSaved
                              ? darkMode ? "cursor-default border-emerald-800 bg-emerald-950 text-emerald-300" : "cursor-default border-emerald-300 bg-emerald-50 text-emerald-700"
                              : darkMode ? "border-blue-800 bg-blue-950 text-blue-300 hover:bg-blue-900 disabled:opacity-50" : "border-blue-300 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                          }`}
                        >
                          {isSaving
                            ? "Guardando..."
                            : isSaved
                              ? "✓ Guardado"
                              : "Guardar lead"}
                        </button>

                      </div>
                    );
                  }
                )}

              </div>
            )}

          </section>
        )}

          </>
        )}
        {/* ======================================================
            SEPARADOR
            ====================================================== */}

        <div className="flex items-center gap-4 py-2">

          <div className="h-px flex-1 bg-slate-100" />

          <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">
            Mis Leads
          </span>

          <div className="h-px flex-1 bg-slate-100" />

        </div>

        {/* ======================================================
            ESTADÍSTICAS
            ====================================================== */}

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

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

        </section>

        {/* ======================================================
            FILTROS CRM
            ====================================================== */}

        <section className={`${cardClasses} p-5`}>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

            <div>
              <label className={darkMode ? "mb-2 block text-sm font-medium text-slate-200" : "mb-2 block text-sm font-medium text-slate-700"}>
                Buscar en mis leads
              </label>

              <input
                type="text"
                value={crmSearch}
                onChange={(event) =>
                  setCrmSearch(
                    event.target.value
                  )
                }
                placeholder="Nombre, ciudad, teléfono..."
                className={inputClasses}
              />
            </div>

            <div>
              <label className={darkMode ? "mb-2 block text-sm font-medium text-slate-200" : "mb-2 block text-sm font-medium text-slate-700"}>
                Prioridad
              </label>

              <select
                value={priorityFilter}
                onChange={(event) =>
                  setPriorityFilter(
                    event.target.value
                  )
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
              <label className={darkMode ? "mb-2 block text-sm font-medium text-slate-200" : "mb-2 block text-sm font-medium text-slate-700"}>
                Estado
              </label>

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value
                  )
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

        </section>

        {/* ======================================================
            TABLA CRM
            ====================================================== */}

        <section className={cardClasses}>

          <div className="border-b border-slate-200 px-5 py-4">

            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">

              <h2 className="text-lg font-semibold text-slate-900">
                Leads guardados
              </h2>

              <span className="text-sm text-slate-500">
                Mostrando{" "}
                {filteredLeads.length}{" "}
                de {leads.length}
              </span>

            </div>

          </div>

          {loadingLeads ? (
            <div className="p-10 text-center text-sm text-slate-500">
              Cargando leads...
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="p-10 text-center text-sm text-slate-500">
              No se encontraron leads.
            </div>
          ) : (
            <div className="overflow-x-auto">

              <table className="min-w-275">

                <thead className={darkMode ? "bg-slate-800" : "bg-slate-100"}>

                  <tr>

                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-slate-700">
                      Lead
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-slate-700">
                      Categoría
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-slate-700">
                      Ubicación
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-slate-700">
                      Contacto
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-slate-700">
                      Score
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-slate-700">
                      Prioridad
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-slate-700">
                      Estado
                    </th>

                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase text-slate-700">
                      Acciones
                    </th>

                  </tr>

                </thead>

                <tbody className="divide-y divide-slate-200">

                  {filteredLeads.map(
                    (lead) => (
                      <tr
                        key={lead.id}
                        className={darkMode ? "hover:bg-slate-800/50" : "hover:bg-slate-100/50"}
                      >

                        <td className="px-5 py-4">

                          <div className="flex items-center gap-3">

                            <button
                              type="button"
                              onClick={() =>
                                void toggleFavorite(
                                  lead
                                )
                              }
                              disabled={saving}
                              className="text-xl text-yellow-400 disabled:opacity-50"
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

                              <div className={darkMode ? "font-semibold text-white" : "font-semibold text-slate-900"}>
                                {lead.name}
                              </div>

                              {lead.email && (
                                <div className="mt-1 text-xs text-slate-500">
                                  {lead.email}
                                </div>
                              )}

                            </div>

                          </div>

                        </td>

                        <td className="px-5 py-4 text-sm text-slate-700">
                          {lead.category ||
                            "-"}
                        </td>

                        <td className="px-5 py-4">

                          <div className={darkMode ? "text-sm font-medium text-white" : "text-sm font-medium text-slate-900"}>
                            {lead.city ||
                              "-"}
                          </div>

                          {lead.province && (
                            <div className="text-xs text-slate-500">
                              {lead.province}
                            </div>
                          )}

                        </td>

                        <td className="px-5 py-4">

                          {lead.phone ? (
                            <a
                              href={`tel:${lead.phone}`}
                              className="text-sm font-semibold text-blue-400 hover:underline"
                            >
                              {lead.phone}
                            </a>
                          ) : (
                            <span className="text-sm text-slate-500">
                              -
                            </span>
                          )}

                        </td>

                        <td className="px-5 py-4">

                          <span className={darkMode ? "font-bold text-white" : "font-bold text-slate-900"}>
                            {lead.score ??
                              "-"}
                          </span>

                          {lead.score !==
                            null && (
                            <span className="text-slate-500">
                              /100
                            </span>
                          )}

                        </td>

                        <td className="px-5 py-4">

                          <PriorityBadge
                            priority={
                              lead.priority
                            }
                          />

                        </td>

                        <td className="px-5 py-4">

                          <button
                            type="button"
                            onClick={() =>
                              void toggleContacted(
                                lead
                              )
                            }
                            disabled={saving}
                            className={
                              lead.contacted
                                ? "rounded-full bg-green-950 px-3 py-1 text-xs font-semibold text-green-300"
                                : "rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500"
                            }
                          >
                            {lead.contacted
                              ? "Contactado"
                              : "No contactado"}
                          </button>

                        </td>

                        <td className="px-5 py-4">

                          <div className="flex justify-end gap-2">

                            <button
                              type="button"
                              onClick={() =>
                                openLead(
                                  lead
                                )
                              }
                              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-800 hover:bg-slate-100"
                            >
                              Ver / Editar
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                void deleteLead(
                                  lead
                                )
                              }
                              disabled={
                                saving
                              }
                              className="rounded-lg border border-red-900 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-950 disabled:opacity-50"
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

        </section>

      </div>

      {/* ========================================================
          MODAL
          ======================================================== */}

      {selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">

          <div className={darkMode ? "max-h-[95vh] w-full max-w-5xl overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl" : "max-h-[95vh] w-full max-w-5xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl"}>

            <div className={darkMode ? "sticky top-0 z-10 flex items-center justify-between border-b border-slate-700 bg-slate-900 px-6 py-4" : "sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4"}>

              <div>

                <h2 className={darkMode ? "text-xl font-bold text-white" : "text-xl font-bold text-slate-900"}>
                  {editing
                    ? "Editar lead"
                    : selectedLead.name}
                </h2>

                <p className="text-sm text-slate-500">
                  {editing
                    ? "Modificá los datos y guardá los cambios."
                    : "Detalle del lead"}
                </p>

              </div>

              <button
                type="button"
                onClick={closeLead}
                className="rounded-lg px-3 py-2 text-2xl text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              >
                ×
              </button>

            </div>

            <div className="p-6">

              {editing ? (
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

                  <FormField
                    darkMode={darkMode}
                    label="Nombre"
                    value={form.name}
                    onChange={(value) =>
                      updateForm(
                        "name",
                        value
                      )
                    }
                    required
                  />

                  <FormField
                    darkMode={darkMode}
                    label="Categoría"
                    value={form.category}
                    onChange={(value) =>
                      updateForm(
                        "category",
                        value
                      )
                    }
                  />

                  <FormField
                    darkMode={darkMode}
                    label="Ciudad"
                    value={form.city}
                    onChange={(value) =>
                      updateForm(
                        "city",
                        value
                      )
                    }
                  />

                  <FormField
                    darkMode={darkMode}
                    label="Provincia"
                    value={form.province}
                    onChange={(value) =>
                      updateForm(
                        "province",
                        value
                      )
                    }
                  />

                  <FormField
                    darkMode={darkMode}
                    label="Dirección"
                    value={form.address}
                    onChange={(value) =>
                      updateForm(
                        "address",
                        value
                      )
                    }
                  />

                  <FormField
                    darkMode={darkMode}
                    label="Teléfono"
                    value={form.phone}
                    onChange={(value) =>
                      updateForm(
                        "phone",
                        value
                      )
                    }
                  />

                  <FormField
                    darkMode={darkMode}
                    label="Email"
                    type="email"
                    value={form.email}
                    onChange={(value) =>
                      updateForm(
                        "email",
                        value
                      )
                    }
                  />

                  <FormField
                    darkMode={darkMode}
                    label="Website"
                    value={form.website}
                    onChange={(value) =>
                      updateForm(
                        "website",
                        value
                      )
                    }
                  />

                  <FormField
                    darkMode={darkMode}
                    label="Facebook"
                    value={form.facebook}
                    onChange={(value) =>
                      updateForm(
                        "facebook",
                        value
                      )
                    }
                  />

                  <FormField
                    darkMode={darkMode}
                    label="Instagram"
                    value={form.instagram}
                    onChange={(value) =>
                      updateForm(
                        "instagram",
                        value
                      )
                    }
                  />

                  <FormField
                    darkMode={darkMode}
                    label="Latitud"
                    type="number"
                    value={form.latitude}
                    onChange={(value) =>
                      updateForm(
                        "latitude",
                        value
                      )
                    }
                  />

                  <FormField
                    darkMode={darkMode}
                    label="Longitud"
                    type="number"
                    value={form.longitude}
                    onChange={(value) =>
                      updateForm(
                        "longitude",
                        value
                      )
                    }
                  />

                  <FormField
                    darkMode={darkMode}
                    label="Score"
                    type="number"
                    value={form.score}
                    onChange={(value) =>
                      updateForm(
                        "score",
                        value
                      )
                    }
                  />

                  <div>

                    <label className="mb-2 block text-sm font-semibold text-slate-800">
                      Prioridad
                    </label>

                    <select
                      value={
                        form.priority
                      }
                      onChange={(
                        event
                      ) =>
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
                    darkMode={darkMode}
                    label="Fuente"
                    value={form.source}
                    onChange={(value) =>
                      updateForm(
                        "source",
                        value
                      )
                    }
                  />

                  <div className="md:col-span-2">

                    <label className="mb-2 block text-sm font-semibold text-slate-800">
                      Notas
                    </label>

                    <textarea
                      value={form.notes}
                      onChange={(
                        event
                      ) =>
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

                    <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700">

                      <input
                        type="checkbox"
                        checked={
                          form.favorite
                        }
                        onChange={(
                          event
                        ) =>
                          updateForm(
                            "favorite",
                            event.target.checked
                          )
                        }
                        className="h-4 w-4"
                      />

                      ⭐ Favorito

                    </label>

                    <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700">

                      <input
                        type="checkbox"
                        checked={
                          form.contacted
                        }
                        onChange={(
                          event
                        ) =>
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
                    value={
                      selectedLead.name
                    }
                  />

                  <DetailItem
                    label="Categoría"
                    value={
                      selectedLead.category
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
                    label="Website"
                    value={
                      selectedLead.website
                    }
                  />

                  <DetailItem
                    label="Facebook"
                    value={
                      selectedLead.facebook
                    }
                  />

                  <DetailItem
                    label="Instagram"
                    value={
                      selectedLead.instagram
                    }
                  />

                  <DetailItem
                    label="Latitud"
                    value={
                      selectedLead.latitude
                    }
                  />

                  <DetailItem
                    label="Longitud"
                    value={
                      selectedLead.longitude
                    }
                  />

                  <DetailItem
                    label="Score"
                    value={
                      selectedLead.score
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
                    label="Favorito"
                    value={
                      selectedLead.favorite
                        ? "Sí"
                        : "No"
                    }
                  />

                  <DetailItem
                    label="Contactado"
                    value={
                      selectedLead.contacted
                        ? "Sí"
                        : "No"
                    }
                  />

                  <div className="md:col-span-2">

                    <DetailItem
                      label="Notas"
                      value={
                        selectedLead.notes
                      }
                    />

                  </div>

                </div>
              )}

            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-200 px-6 py-4 sm:flex-row sm:justify-end">

              {editing ? (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setEditing(false)
                    }
                    disabled={saving}
                    className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                  >
                    Cancelar
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      void saveEditedLead()
                    }
                    disabled={saving}
                    className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-slate-900 hover:bg-blue-500 disabled:opacity-50"
                  >
                    {saving
                      ? "Guardando..."
                      : "Guardar cambios"}
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      void deleteLead(
                        selectedLead
                      )
                    }
                    disabled={saving}
                    className="rounded-lg border border-red-900 px-5 py-2.5 text-sm font-medium text-red-400 hover:bg-red-950 disabled:opacity-50"
                  >
                    Eliminar
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setEditing(true)
                    }
                    className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-slate-900 hover:bg-blue-500"
                  >
                    Editar lead
                  </button>
                </>
              )}

            </div>

          </div>

        </div>
      )}

    </div>
  );
}

/* ============================================================
   STAT CARD
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
          ? "rounded-xl border border-slate-800 bg-slate-900 p-5 shadow-sm"
          : "rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
      }
    >
      <div className="flex items-center justify-between">
        <div>
          <p
            className={
              darkMode
                ? "text-sm text-slate-400"
                : "text-sm text-slate-500"
            }
          >
            {title}
          </p>

          <p
            className={
              darkMode
                ? "mt-2 text-3xl font-bold text-slate-100"
                : "mt-2 text-3xl font-bold text-slate-900"
            }
          >
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
   PRIORITY BADGE
   ============================================================ */

function PriorityBadge({
  priority,
}: {
  priority: string | null;
}) {
  const normalized =
    (priority || "").toUpperCase();

  if (normalized === "ALTA") {
    return (
      <span className="inline-flex rounded-full bg-red-950 px-2.5 py-1 text-xs font-semibold text-red-300">
        ALTA
      </span>
    );
  }

  if (normalized === "MEDIA") {
    return (
      <span className="inline-flex rounded-full bg-yellow-950 px-2.5 py-1 text-xs font-semibold text-yellow-300">
        MEDIA
      </span>
    );
  }

  if (normalized === "BAJA") {
    return (
      <span className="inline-flex rounded-full bg-green-950 px-2.5 py-1 text-xs font-semibold text-green-300">
        BAJA
      </span>
    );
  }

  return (
    <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
      SIN PRIORIDAD
    </span>
  );
}

/* ============================================================
   FORM FIELD
   ============================================================ */

function FormField({
  label,
  value,
  onChange,
  type = "text",
  required = false,
  darkMode = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  darkMode?: boolean;
}) {
  return (
    <div>

      <label className={darkMode ? "mb-2 block text-sm font-semibold text-slate-200" : "mb-2 block text-sm font-semibold text-slate-800"}>

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
          onChange(
            event.target.value
          )
        }
        className={darkMode ? "w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-100 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-900" : "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"}
      />

    </div>
  );
}

/* ============================================================
   DETAIL ITEM
   ============================================================ */

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: string | number | boolean | null;
}) {
  return (
    <div className="min-w-0">

      <div className="mb-1 text-xs font-semibold uppercase text-slate-500">
        {label}
      </div>

      <div className="wrap-break-word text-sm font-medium text-slate-800">

        {value !== null &&
        value !== undefined &&
        value !== ""
          ? String(value)
          : "-"}

      </div>

    </div>
  );
}

