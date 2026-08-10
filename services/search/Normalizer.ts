import { Company } from "@/types/company";
import { calculateScore } from "@/services/scoring/Scorer";

interface OverpassElement {
  id: number | string;

  type?: string;

  lat?: number;
  lon?: number;

  center?: {
    lat?: number;
    lon?: number;
  };

  tags?: Record<string, string>;

  [key: string]: unknown;
}

function cleanText(
  value?: string
): string {
  return value?.trim() || "";
}

function normalizePhone(
  value?: string
): string {
  if (!value) {
    return "";
  }

  return value
    .replace(/\s+/g, " ")
    .trim();
}

function detectWhatsapp(
  phone: string,
  tags: Record<string, string>
): string {
  /*
   * Primero buscamos un WhatsApp explícito
   * en las etiquetas de OpenStreetMap.
   */
  if (
    tags.whatsapp ||
    tags["contact:whatsapp"]
  ) {
    return (
      tags.whatsapp ||
      tags["contact:whatsapp"] ||
      ""
    );
  }

  /*
   * En Argentina muchos comercios publican
   * solamente su teléfono móvil.
   *
   * No afirmamos que sea WhatsApp con certeza;
   * solamente utilizamos esta heurística para
   * priorización comercial.
   */
  if (!phone) {
    return "";
  }

  const compact =
    phone.replace(/[^\d+]/g, "");

  const argentinaMobile =
    compact.includes("+549") ||
    compact.startsWith("549") ||
    compact.startsWith("15") ||
    compact.startsWith("11") ||
    compact.startsWith("223") ||
    compact.startsWith("2266");

  return argentinaMobile
    ? phone
    : "";
}

function extractWebsite(
  tags: Record<string, string>
): string {
  return cleanText(
    tags.website ||
      tags["contact:website"] ||
      tags.url
  );
}

function extractEmail(
  tags: Record<string, string>
): string {
  return cleanText(
    tags.email ||
      tags["contact:email"]
  );
}

function extractAddress(
  tags: Record<string, string>
): string {
  const street =
    cleanText(tags["addr:street"]);

  const houseNumber =
    cleanText(tags["addr:housenumber"]);

  if (street && houseNumber) {
    return `${street} ${houseNumber}`;
  }

  return (
    cleanText(tags["addr:full"]) ||
    street ||
    cleanText(tags.address)
  );
}

function extractCity(
  tags: Record<string, string>
): string {
  return (
    cleanText(tags["addr:city"]) ||
    cleanText(tags["addr:town"]) ||
    cleanText(tags["addr:municipality"]) ||
    cleanText(tags["addr:village"])
  );
}

function extractProvince(
  tags: Record<string, string>
): string {
  return (
    cleanText(tags["addr:state"]) ||
    cleanText(tags["addr:province"])
  );
}

function extractCategory(
  tags: Record<string, string>
): string {
  return (
    cleanText(tags.shop) ||
    cleanText(tags.office) ||
    cleanText(tags.craft) ||
    cleanText(tags.amenity) ||
    cleanText(tags.tourism) ||
    cleanText(tags.healthcare) ||
    cleanText(tags["business:type"]) ||
    "Comercio"
  );
}

function extractLatitude(
  element: OverpassElement
): number {
  if (
    typeof element.lat === "number"
  ) {
    return element.lat;
  }

  if (
    typeof element.center?.lat === "number"
  ) {
    return element.center.lat;
  }

  return 0;
}

function extractLongitude(
  element: OverpassElement
): number {
  if (
    typeof element.lon === "number"
  ) {
    return element.lon;
  }

  if (
    typeof element.center?.lon === "number"
  ) {
    return element.center.lon;
  }

  return 0;
}

export function normalize(
  elements: unknown[]
): Company[] {
  if (!Array.isArray(elements)) {
    return [];
  }

  const validElements =
    elements as OverpassElement[];

  return validElements
    .filter(
      (element) =>
        element &&
        element.tags &&
        cleanText(element.tags.name)
    )
    .map((element) => {
      const tags =
        element.tags || {};

      const name =
        cleanText(tags.name);

      const phone =
        normalizePhone(
          tags.phone ||
            tags["contact:phone"] ||
            tags["contact:mobile"]
        );

      const website =
        extractWebsite(tags);

      const email =
        extractEmail(tags);

      const whatsapp =
        detectWhatsapp(
          phone,
          tags
        );

      const address =
        extractAddress(tags);

      const city =
        extractCity(tags);

      const province =
        extractProvince(tags);

      const category =
        extractCategory(tags);

      const latitude =
        extractLatitude(element);

      const longitude =
        extractLongitude(element);

      const companyData: Partial<Company> = {
        id: String(element.id),

        name,

        category,

        address,

        city,

        province,

        phone,

        website,

        email,

        whatsapp,

        latitude,

        longitude,

        source: "overpass",
      };

      const score =
        calculateScore(
          companyData
        );

      return {
        id: companyData.id || "",

        name:
          companyData.name || "Sin nombre",

        category:
          companyData.category || "Comercio",

        address:
          companyData.address || "",

        city:
          companyData.city || "",

        province:
          companyData.province || "",

        phone:
          companyData.phone || "",

        website:
          companyData.website || "",

        email:
          companyData.email || "",

        whatsapp:
          companyData.whatsapp || "",

        latitude:
          companyData.latitude || 0,

        longitude:
          companyData.longitude || 0,

        source:
          companyData.source || "overpass",

        score,
      };
    });
}