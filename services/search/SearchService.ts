import { mockCompanies } from "@/lib/mockCompanies";

export async function searchCompanies(
  category: string,
  city: string,
  province: string
) {
  return mockCompanies.filter((company) => {
    return (
      (category === "" ||
        company.category.toLowerCase().includes(category.toLowerCase())) &&
      (city === "" ||
        company.city.toLowerCase().includes(city.toLowerCase())) &&
      (province === "" ||
        company.province.toLowerCase().includes(province.toLowerCase()))
    );
  });
}