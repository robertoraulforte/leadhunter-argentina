import { Company } from "@/types/company";

type ResultsTableProps = {
  companies: Company[];
};

export default function ResultsTable({
  companies,
}: ResultsTableProps) {
  if (companies.length === 0) {
    return (
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        No hay resultados.
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
      <table className="min-w-full">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-3 text-left">Empresa</th>
            <th className="p-3 text-left">Dirección</th>
            <th className="p-3 text-left">Sitio Web</th>
          </tr>
        </thead>

        <tbody>
          {companies.map((company) => (
            <tr
              key={company.id}
              className="border-t"
            >
              <td className="p-3">
                {company.name}
              </td>

              <td className="p-3">
                {company.address || "-"}
              </td>

              <td className="p-3">
                {company.website ? (
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 underline"
                  >
                    Sitio web
                  </a>
                ) : (
                  "-"
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}