import { buildQuery } from "./OverpassQuery";
import { normalize } from "@/services/search/Normalizer";
import { dedupe } from "@/services/search/Deduper";

export class OverpassProvider {
  // Endpoints ultrarrápidos y de alta disponibilidad
  private endpoints = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.private.coffee/api/interpreter",
    "https://lz4.overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
  ];

  async search(
    lat: number,
    lon: number,
    category: string
  ) {
    const query = buildQuery(lat, lon, category);
    let lastErrorText = "";
    let lastStatus = 0;

    for (const endpoint of this.endpoints) {
      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Accept": "application/json",
            "User-Agent": "LeadHunterArgentina/1.0",
          },
          body: `data=${encodeURIComponent(query)}`,
          signal: AbortSignal.timeout(7000), // 7 segundos max por endpoint
        });

        if (response.ok) {
          const data = await response.json();
          const companies = normalize(data.elements);
          return dedupe(companies);
        }

        lastStatus = response.status;
        lastErrorText = await response.text();

        console.warn(`[OverpassProvider] Falló ${endpoint} con status ${response.status}`);
      } catch {
        console.warn(`[OverpassProvider] Timeout o error de red conectando a ${endpoint}`);
      }
    }

    console.error("====================================");
    console.error("OVERPASS ERROR (ALL ENDPOINTS FAILED)");
    console.error("LAST STATUS:", lastStatus);
    console.error("LAST BODY:");
    console.error(lastErrorText);
    console.error("====================================");

    throw new Error(`Overpass HTTP ${lastStatus || "Timeout/Network Error"}`);
  }
}