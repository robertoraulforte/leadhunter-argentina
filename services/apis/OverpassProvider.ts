import { Company } from "@/types/company";
import { SearchProvider } from "@/services/search/SearchProvider";

export class OverpassProvider implements SearchProvider {
  async search(
    rubro: string,
    ciudad: string
  ): Promise<Company[]> {

    console.log("Buscando:", rubro, ciudad);

    return [];
  }
}