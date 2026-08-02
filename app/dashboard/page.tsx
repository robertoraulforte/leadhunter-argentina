import PageContainer from "@/components/layout/PageContainer";
import StatCard from "@/components/dashboard/StatCard";
import SearchPanel from "@/components/dashboard/SearchPanel";
import ResultsTable from "@/components/dashboard/ResultsTable";

import { mockCompanies } from "@/lib/mockCompanies";

export default function Dashboard() {
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
            value={mockCompanies.length}
            description="Leads encontrados"
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

        <SearchPanel />

        <ResultsTable companies={mockCompanies} />

      </div>
    </PageContainer>
  );
}