import { Company } from "@/types/company";
import { calculateScore } from "@/services/scoring/Scorer";

interface OverpassElement {
  id: number | string;
  tags?: Record<string, string>;
  [key: string]: unknown;
}

export function normalize(elements: unknown[]): Company[] {
  if (!Array.isArray(elements)) return [];

  const validElements = elements as OverpassElement[];

  return validElements
    .filter((el) => el.tags && el.tags.name)
    .map((el) => {
      const tags = el.tags || {};

      const addressParts = [
        tags["addr:street"],
        tags["addr:housenumber"]
      ].filter(Boolean).join(" ");

      const rawPhone = tags.phone || tags["contact:phone"] || tags["contact:mobile"] || "";
      const rawWebsite = tags.website || tags["contact:website"] || "";

      const companyData: Partial<Company> = {
        id: String(el.id),
        name: tags.name,
        address: addressParts || tags["addr:full"] || undefined,
        website: rawWebsite || undefined,
        phone: rawPhone || undefined,
        whatsapp: (rawPhone.includes("+54") || rawPhone.startsWith("11") || rawPhone.startsWith("223") || rawPhone.startsWith("2266")) ? rawPhone : undefined,
        category: tags.shop || tags.amenity || "Comercio",
      };

      const score = calculateScore(companyData);

      return {
        ...companyData,
        score,
      } as Company;
    });
}