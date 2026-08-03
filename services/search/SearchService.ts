import { OverpassProvider } from "@/services/apis/OverpassProvider";
import { Company } from "@/types/company";

export class SearchService {
  private provider = new OverpassProvider();

  async execute(rubro: string, ciudad: string): Promise<Company[]> {
    return this.provider.search(rubro, ciudad);
  }

  async search(rubro: string, ciudad: string): Promise<Company[]> {
    return this.execute(rubro, ciudad);
  }
}