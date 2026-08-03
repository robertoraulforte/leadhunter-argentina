import { buildQuery } from "./OverpassQuery";
import { normalize } from "@/services/search/Normalizer";
import { dedupe } from "@/services/search/Deduper";

export class OverpassProvider {
  async search(
    lat: number,
    lon: number,
    category: string
  ) {
    const query = buildQuery(lat, lon, category);

    const response = await fetch(
      "https://overpass-api.de/api/interpreter",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Accept": "application/json",
          "User-Agent": "LeadHunterArgentina/1.0",
        },
        body: `data=${encodeURIComponent(query)}`,
      }
    );

    if (!response.ok) {
      const text = await response.text();

      console.error("====================================");
      console.error("OVERPASS ERROR");
      console.error("STATUS:", response.status);
      console.error("BODY:");
      console.error(text);
      console.error("====================================");

      throw new Error(`Overpass HTTP ${response.status}`);
    }

    const data = await response.json();

    const companies = normalize(data.elements);

    return dedupe(companies);
  }
}