import { Company } from "@/types/company";

type ResultsTableProps = {
  companies: Company[];
};

export default function ResultsTable({
  companies,
}: ResultsTableProps) {
  return (
    <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-3 text-left">Empresa</th>
            <th className="p-3 text-left">Ciudad</th>
            <th className="p-3 text-left">Provincia</th>
            <th className="p-3 text-left">Sitio Web</th>
            <th className="p-3 text-left">Score</th>
          </tr>
        </thead>

        <tbody>
          {companies.map((company) => (
            <tr
              key={company.id}
              className="border-t hover:bg-gray-50"
            >
              <td className="p-3">{company.name}</td>
              <td className="p-3">{company.city}</td>
              <td className="p-3">{company.province}</td>

              <td className="p-3">
                {company.website ? (
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600"
                  >
                    Ver sitio
                  </a>
                ) : (
                  "No tiene"
                )}
              </td>

              <td className="p-3 font-bold">
                {company.score}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}