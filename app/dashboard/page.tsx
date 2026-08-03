"use client";

import { useState } from "react";
import SearchPanel from "@/components/dashboard/SearchPanel";
import { Company } from "@/types/company";

const ITEMS_PER_PAGE = 10;

export default function DashboardPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const handleSearch = async (rubro: string, ciudad: string) => {
    if (!rubro.trim() || !ciudad.trim()) {
      setError("Por favor, ingresá tanto el rubro como la ciudad.");
      return;
    }

    setLoading(true);
    setError(null);
    setCurrentPage(1);

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

  const totalPages = Math.ceil(companies.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedCompanies = companies.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-white">LeadHunter Argentina</h1>
      </div>

      <SearchPanel onSearch={handleSearch} />

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
          {error}
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Resultados</h2>
          {companies.length > 0 && (
            <span className="text-sm bg-blue-50 text-blue-700 px-3 py-1 rounded-full font-medium">
              {companies.length} {companies.length === 1 ? "empresa encontrada" : "empresas encontradas"}
            </span>
          )}
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-600">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent mb-3"></div>
            <p className="animate-pulse">Buscando empresas en la zona...</p>
          </div>
        ) : !Array.isArray(companies) || companies.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            No se encontraron resultados para la búsqueda actual.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-gray-200 bg-gray-50 text-gray-700 uppercase text-xs">
                  <tr>
                    <th className="p-4 font-semibold">Empresa</th>
                    <th className="p-4 font-semibold">Dirección</th>
                    <th className="p-4 font-semibold">Sitio Web</th>
                    <th className="p-4 font-semibold">WhatsApp / Teléfono</th>
                    <th className="p-4 font-semibold text-center">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-gray-800">
                  {paginatedCompanies.map((company) => (
                    <tr key={company.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4 font-medium text-gray-900">{company.name}</td>
                      <td className="p-4 text-gray-600">{company.address || "—"}</td>
                      <td className="p-4">
                        {company.website ? (
                          <a
                            href={company.website.startsWith("http") ? company.website : `https://${company.website}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-600 hover:underline font-medium"
                          >
                            Visitar sitio ↗
                          </a>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="p-4 text-gray-600">
                        {company.whatsapp || company.phone || "—"}
                      </td>
                      <td className="p-4 text-center">
                        <span className="inline-flex items-center justify-center bg-gray-100 text-gray-800 text-xs font-semibold px-2.5 py-1 rounded">
                          {company.score ?? 0}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="p-4 border-t border-gray-200 flex items-center justify-between bg-gray-50 text-sm">
                <span className="text-gray-600">
                  Página {currentPage} de {totalPages}
                </span>
                <div className="space-x-2">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 rounded border border-gray-300 bg-white text-gray-700 disabled:opacity-50 hover:bg-gray-100"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 rounded border border-gray-300 bg-white text-gray-700 disabled:opacity-50 hover:bg-gray-100"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}