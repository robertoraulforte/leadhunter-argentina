import { Company } from "@/types/company";

export function dedupe(
  companies: Company[]
) {

  const map = new Map();

  companies.forEach((company) => {

    map.set(
      company.name.toLowerCase(),
      company
    );

  });

  return [...map.values()];

}