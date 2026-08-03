"use client";

import { useState } from "react";

type SearchPanelProps = {
  onSearch: (rubro: string, ciudad: string) => void;
};

export default function SearchPanel({
  onSearch,
}: SearchPanelProps) {
  const [rubro, setRubro] = useState("");
  const [ciudad, setCiudad] = useState("");

  return (
    <div className="rounded-xl border bg-white p-6 shadow-sm space-y-4">

      <h2 className="text-xl font-semibold">
        Buscar empresas
      </h2>

      <div>
        <label className="block text-sm font-medium mb-1">
          Rubro
        </label>

        <input
          className="w-full rounded border p-2"
          value={rubro}
          onChange={(e) => setRubro(e.target.value)}
          placeholder="Ej: tyres"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Ciudad
        </label>

        <input
          className="w-full rounded border p-2"
          value={ciudad}
          onChange={(e) => setCiudad(e.target.value)}
          placeholder="Ej: Balcarce"
        />
      </div>

      <button
        onClick={() => onSearch(rubro, ciudad)}
        className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
      >
        Buscar
      </button>

    </div>
  );
}