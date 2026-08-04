import { Company } from "@/types/company";

import { OverpassProvider } from "@/services/apis/OverpassProvider";
import { DuckDuckGoProvider } from "@/services/apis/DuckDuckGoProvider";

import { dedupe } from "./Deduper";

export class SearchService {

  static async search(
    rubro: string,
    ciudad: string
  ): Promise<Company[]> {

    const providers = [
      new OverpassProvider(),
      new DuckDuckGoProvider(),
    ];

    let companies: Company[] = [];

    for (const provider of providers) {

      try {

        console.log(
          `[SearchService] Ejecutando ${provider.name}...`
        );

        const results = await provider.search(
          rubro,
          ciudad
        );

        console.log(
          `[SearchService] ${provider.name}: ${results.length} resultados`
        );

        companies.push(...results);

      } catch (error) {

        console.error(
          `[SearchService] Error en ${provider.name}`,
          error
        );

      }

    }

    companies = dedupe(companies);

    console.log(
      `[SearchService] Total final: ${companies.length} empresas`
    );

    return companies;

  }

}