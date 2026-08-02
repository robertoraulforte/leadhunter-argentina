"use client";

import { useState } from "react";

import PageContainer from "@/components/layout/PageContainer";
import StatCard from "@/components/dashboard/StatCard";
import SearchPanel from "@/components/dashboard/SearchPanel";
import ResultsTable from "@/components/dashboard/ResultsTable";

import { mockCompanies } from "@/lib/mockCompanies";
import { SearchService } from "@/services/search/SearchService";
import { Company } from "@/types/company";

export default function Dashboard() {
  const [companies, setCompanies] = useState<Company[]>([]);

  const handleSearch = async (
    rubro: string,
    ciudad: string
  ) => {
    try {
      const results = await SearchService.search(
        rubro,
        ciudad
      );

      setCompanies(results);
    } catch (error) {
      console.error("Error buscando empresas:", error);
    }
  };

  return (
    <PageContainer>
      <div className="space-y-8">

        <div>
          <h1 className="text-3xl font-bold">
            Dashboard
          </h1>

          <p className="text-gray-500">
            Bienvenido a LeadHunter Argentina
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">

          <StatCard
            title="Empresas"
            value={mockCompanies.length}
            description="Empresas registradas"
          />

          <StatCard
            title="Leads"
            value={companies.length}
            description="Resultados de búsqueda"
          />

          <StatCard
            title="Favoritos"
            value={0}
            description="Empresas destacadas"
          />

          <StatCard
            title="CRM"
            value={0}
            description="Seguimientos activos"
          />

        </div>

        <SearchPanel onSearch={handleSearch} />

        <ResultsTable companies={companies} />

      </div>
    </PageContainer>
  );
}