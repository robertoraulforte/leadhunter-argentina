import { Company } from "@/types/company";

export interface SearchProvider {

  readonly name: string;

  search(
    rubro: string,
    ciudad: string
  ): Promise<Company[]>;

}