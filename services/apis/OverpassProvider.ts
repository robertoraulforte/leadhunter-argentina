import { Company } from "@/types/company";

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

export class OverpassProvider {
  async search(
    rubro: string,
    ciudad: string
  ): Promise<Company[]> {

    // Traducción automática
    const category =
      CategoryTranslator.translate(rubro);

    // Obtener coordenadas
    const coordinates =
      await getCoordinates(ciudad);

    if (!coordinates) {
      console.error(
        `[Geocoder] No se encontraron coordenadas para ${ciudad}`
      );
      return [];
    }

    // Construir consulta
    const query = OverpassQuery.build(
      coordinates.lat,
      coordinates.lon,
      category
    );

    // Intentar todos los servidores
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

        const normalized =
          normalize(data.elements ?? []);

        const companies =
          dedupe(normalized);

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