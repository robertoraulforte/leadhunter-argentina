import { Company } from "@/types/company";
import { OverpassProvider } from "@/services/apis/OverpassProvider";
import { getCoordinates } from "@/services/apis/Geocoder";

const provider = new OverpassProvider();

export class SearchService {
  static async search(
    rubro: string,
    ciudad: string
  ): Promise<Company[]> {

    const coordinates = await getCoordinates(ciudad);

    if (!coordinates) {
      return [];
    }

    return provider.search(
      coordinates.lat,
      coordinates.lon,
      rubro
    );
  }
}