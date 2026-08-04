import { Company } from "@/types/company";
import { SearchProvider } from "./SearchProvider";
import { OverpassQuery } from "./OverpassQuery";
import { getCoordinates } from "./Geocoder";
import { CategoryTranslator } from "./CategoryTranslator";
import { normalize } from "@/services/search/Normalizer";
import { dedupe } from "@/services/search/Deduper";

const OVERPASS_ENDPOINTS = [
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass-api.de/api/interpreter",
  "https://lz4.overpass-api.de/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
];

export class OverpassProvider implements SearchProvider {

  readonly name = "Overpass";

  async search(
    rubro: string,
    ciudad: string
  ): Promise<Company[]> {

    const category =
      CategoryTranslator.translate(rubro);

    const coordinates =
      await getCoordinates(ciudad);

    if (!coordinates) {
      console.error(
        `[Geocoder] No se encontraron coordenadas para ${ciudad}`
      );
      return [];
    }

    const query = OverpassQuery.build(
      coordinates.lat,
      coordinates.lon,
      category
    );

    console.log("========== OVERPASS QUERY ==========");
    console.log(query);
    console.log("===================================");

    for (const endpoint of OVERPASS_ENDPOINTS) {

      try {

        console.log(
          `[Overpass] Consultando ${endpoint}`
        );

        const controller =
          new AbortController();

        const timeout =
          setTimeout(
            () => controller.abort(),
            8000
          );

        const response = await fetch(
          endpoint,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/x-www-form-urlencoded",
              "Accept":
                "application/json",
              "User-Agent":
                "LeadHunterArgentina/1.0",
            },
            body:
              `data=${encodeURIComponent(query)}`,
            signal:
              controller.signal,
          }
        );

        clearTimeout(timeout);

        if (!response.ok) {

          console.warn(
            `[Overpass] ${endpoint} devolvió ${response.status}`
          );

          continue;
        }

        const data =
          await response.json();

        const companies =
          dedupe(
            normalize(data.elements ?? [])
          );

        console.log(
          `[Overpass] ${companies.length} empresas encontradas`
        );

        return companies;

      } catch (error) {

        console.warn(
          `[Overpass] Error en ${endpoint}`,
          error
        );

      }

    }

    console.error(
      "[Overpass] Ningún servidor respondió correctamente."
    );

    return [];
  }
}