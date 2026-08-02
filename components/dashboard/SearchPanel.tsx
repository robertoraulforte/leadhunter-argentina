"use client";

import { useState } from "react";

type Props = {
  onSearch: (rubro: string, ciudad: string) => void;
};

export default function SearchPanel({ onSearch }: Props) {
  const [rubro, setRubro] = useState("");
  const [ciudad, setCiudad] = useState("");

  return (
    <div className="rounded-xl border bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-xl font-semibold">
        Buscar Empresas
      </h2>

      <div className="grid gap-4 md:grid-cols-2">

        <input
          className="rounded border p-3"
          placeholder="Rubro"
          value={rubro}
          onChange={(e) => setRubro(e.target.value)}
        />

        <input
          className="rounded border p-3"
          placeholder="Ciudad"
          value={ciudad}
          onChange={(e) => setCiudad(e.target.value)}
        />

      </div>

      <button
        className="mt-5 rounded bg-blue-600 px-6 py-3 text-white"
        onClick={() => onSearch(rubro, ciudad)}
      >
        Buscar
      </button>
    </div>
  );
}