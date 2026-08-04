"use client";

import { useState } from "react";

import PageContainer from "@/components/layout/PageContainer";
import StatCard from "@/components/dashboard/StatCard";
import SearchPanel from "@/components/dashboard/SearchPanel";
import ResultsTable from "@/components/dashboard/ResultsTable";

import { Company } from "@/types/company";

export default function Dashboard() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSearch(
    rubro: string,
    ciudad: string
  ) {
    if (!rubro.trim() || !ciudad.trim()) {
      setError("Debe ingresar un rubro y una ciudad.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/search?rubro=${encodeURIComponent(
          rubro
        )}&ciudad=${encodeURIComponent(ciudad)}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error buscando empresas");
      }

      setCompanies(data.results ?? []);
    } catch (err) {
      console.error(err);
      setCompanies([]);
      setError("Ocurrió un error al consultar la API.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageContainer>
      <div className="space-y-8">

        <div>
          <h1 className="text-3xl font-bold">
            LeadHunter Argentina
          </h1>

          <p className="text-gray-500">
            Buscador inteligente de empresas
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">

          <StatCard
            title="Empresas"
            value={companies.length}
            description="Empresas encontradas"
          />

          <StatCard
            title="Leads"
            value={companies.length}
            description="Leads disponibles"
          />

          <StatCard
            title="Favoritos"
            value={0}
            description="Empresas destacadas"
          />

          <StatCard
            title="CRM"
            value={0}
            description="Seguimientos"
          />

        </div>

        <SearchPanel onSearch={handleSearch} />

        {loading && (
          <div className="rounded-xl border bg-blue-50 p-4">
            Buscando empresas...
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        <ResultsTable companies={companies} />

      </div>
    </PageContainer>
  );
}