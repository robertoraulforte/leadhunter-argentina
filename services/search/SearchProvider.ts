import { Company } from "@/types/company";

export interface SearchProvider {
  search(
    rubro: string,
    ciudad: string
  ): Promise<Company[]>;
}