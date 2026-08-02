import { Company } from "@/types/company";

type Props = {
  companies: Company[];
};

export default function ResultsTable({
  companies,
}: Props) {
  return (
    <div className="rounded-xl border bg-white p-6 shadow-sm">

      <h2 className="mb-5 text-xl font-semibold">
        Resultados
      </h2>

      {companies.length === 0 ? (
        <p>No hay resultados.</p>
      ) : (
        <table className="w-full">

          <thead>

            <tr>

              <th>Empresa</th>

              <th>Ciudad</th>

              <th>Web</th>

            </tr>

          </thead>

          <tbody>

            {companies.map((company) => (

              <tr key={company.id}>

                <td>{company.name}</td>

                <td>{company.city}</td>

                <td>{company.website || "-"}</td>

              </tr>

            ))}

          </tbody>

        </table>
      )}

    </div>
  );
}