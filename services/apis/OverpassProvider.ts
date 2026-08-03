import { OverpassQuery } from "./OverpassQuery";
import { normalize } from "@/services/search/Normalizer";
import { dedupe } from "@/services/search/Deduper";
import { Company } from "@/types/company";

const OVERPASS_ENDPOINTS = [
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass-api.de/api/interpreter",
  "https://lz4.overpass-api.de/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
];

export class OverpassProvider {
  async search(rubro: string, ciudad: string): Promise<Company[]> {
    const query = OverpassQuery.build(rubro, ciudad);

    for (const endpoint of OVERPASS_ENDPOINTS) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);

        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: `data=${encodeURIComponent(query)}`,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const data = (await response.json()) as { elements?: unknown[] };
          const normalized = normalize(data.elements || []);
          return dedupe(normalized);
        }
      } catch {
        console.warn(`[OverpassProvider] Falló endpoint ${endpoint}, reintentando...`);
      }
    }

    console.error("[OverpassProvider] Todos los servidores de Overpass fallaron o expiraron.");
    return [];
  }
}