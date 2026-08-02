import { Company } from "@/types/company";
import { OverpassProvider } from "@/services/apis/OverpassProvider";

const provider = new OverpassProvider();

export class SearchService {
  static async search(
    rubro: string,
    ciudad: string
  ): Promise<Company[]> {

    return provider.search(
      rubro,
      ciudad
    );

  }
}