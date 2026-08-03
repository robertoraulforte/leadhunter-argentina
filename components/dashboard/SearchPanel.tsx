"use client";

import { useState } from "react";

type SearchPanelProps = {
  onSearch: (rubro: string, ciudad: string) => void;
};

export default function SearchPanel({ onSearch }: SearchPanelProps) {
  const [rubro, setRubro] = useState("");
  const [ciudad, setCiudad] = useState("");

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
      <h2 className="text-xl font-semibold text-gray-900">
        Buscar empresas
      </h2>

      <div>
        <label className="block text-sm font-medium mb-1 text-gray-700">
          Rubro
        </label>
        <input
          className="w-full rounded border border-gray-300 bg-white p-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={rubro}
          onChange={(e) => setRubro(e.target.value)}
          placeholder="Ej: tyres o gomeria"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1 text-gray-700">
          Ciudad
        </label>
        <input
          className="w-full rounded border border-gray-300 bg-white p-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={ciudad}
          onChange={(e) => setCiudad(e.target.value)}
          placeholder="Ej: Balcarce"
        />
      </div>

      <button
        onClick={() => onSearch(rubro, ciudad)}
        className="rounded bg-blue-600 px-4 py-2 text-white font-medium hover:bg-blue-700 transition-colors"
      >
        Buscar
      </button>
    </div>
  );
}