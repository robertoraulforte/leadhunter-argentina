"use client";

import { useState } from "react";
import SearchPanel from "@/components/dashboard/SearchPanel";
import { Company } from "@/types/company";

export default function DashboardPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (rubro: string, ciudad: string) => {
    if (!rubro.trim() || !ciudad.trim()) {
      setError("Por favor, ingresá tanto el rubro como la ciudad.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/search?rubro=${encodeURIComponent(rubro)}&ciudad=${encodeURIComponent(ciudad)}`
      );

      if (!response.ok) {
        throw new Error("Error al obtener los datos de la API");
      }

      const result = await response.json();

      if (Array.isArray(result)) {
        setCompanies(result);
      } else if (result && Array.isArray(result.data)) {
        setCompanies(result.data);
      } else if (result && Array.isArray(result.companies)) {
        setCompanies(result.companies);
      } else {
        setCompanies([]);
        if (result?.error) {
          throw new Error(result.error);
        }
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Ocurrió un error inesperado");
      }
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">LeadHunter Argentina</h1>

      <SearchPanel onSearch={handleSearch} />

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-md border border-red-200">
          {error}
        </div>
      )}

      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Resultados</h2>

        {loading ? (
          <p className="text-gray-500 animate-pulse">Buscando empresas en Overpass...</p>
        ) : !Array.isArray(companies) || companies.length === 0 ? (
          <p className="text-gray-500">No se encontraron resultados aún.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="p-3 font-semibold">Empresa</th>
                  <th className="p-3 font-semibold">Dirección</th>
                  <th className="p-3 font-semibold">Sitio Web</th>
                  <th className="p-3 font-semibold">WhatsApp</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {companies.map((company) => (
                  <tr key={company.id} className="hover:bg-gray-50">
                    <td className="p-3 font-medium">{company.name}</td>
                    <td className="p-3">{company.address || "—"}</td>
                    <td className="p-3">
                      {company.website ? (
                        <a
                          href={company.website}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {company.website}
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="p-3">{company.whatsapp || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}