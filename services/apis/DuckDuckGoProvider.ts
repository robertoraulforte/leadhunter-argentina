import { Company } from "@/types/company";
import { SearchProvider } from "./SearchProvider";

export class DuckDuckGoProvider implements SearchProvider {

  readonly name = "DuckDuckGo";

  async search(
    rubro: string,
    ciudad: string
  ): Promise<Company[]> {

    const query = `${rubro} ${ciudad} Argentina`;

    console.log(
      `[DuckDuckGo] Búsqueda: ${query}`
    );

    // En el próximo paso implementaremos
    // el parser HTML.

    return [];
  }
}