import { Company } from "@/types/company";

interface OverpassElement {
  lat?: number;
  lon?: number;
  center?: {
    lat: number;
    lon: number;
  };
  tags?: {
    name?: string;
    shop?: string;
    phone?: string;
    website?: string;
    email?: string;
    ["addr:street"]?: string;
    ["addr:city"]?: string;
  };
}

export function normalize(
  elements: OverpassElement[]
): Company[] {
  return elements.map((item, index) => {
    const tags = item.tags ?? {};

    return {
      id: String(index),
      name: tags.name ?? "Sin nombre",
      category: tags.shop ?? "",
      address: tags["addr:street"] ?? "",
      city: tags["addr:city"] ?? "",
      province: "",
      phone: tags.phone ?? "",
      website: tags.website ?? "",
      email: tags.email ?? "",
      whatsapp: "",
      latitude: item.lat ?? item.center?.lat ?? 0,
      longitude: item.lon ?? item.center?.lon ?? 0,
      source: "OpenStreetMap",
      score: 0,
    };
  });
}