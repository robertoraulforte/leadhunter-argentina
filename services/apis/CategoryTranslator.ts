const MAP: Record<string, string> = {
  "gomeria": "tyres",
  "gomería": "tyres",
  "neumaticos": "tyres",
  "neumáticos": "tyres",

  "restaurant": "restaurant",
  "restaurante": "restaurant",
  "bar": "bar",
  "cafe": "cafe",
  "café": "cafe",

  "hotel": "hotel",

  "farmacia": "pharmacy",

  "ferreteria": "hardware",
  "ferretería": "hardware",

  "veterinaria": "veterinary",

  "supermercado": "supermarket",

  "panaderia": "bakery",
  "panadería": "bakery",

  "libreria": "books",
  "librería": "books",

  "kiosco": "convenience",

  "peluqueria": "hairdresser",
  "peluquería": "hairdresser",
};

export class CategoryTranslator {
  static translate(category: string): string {

    const key = category
      .trim()
      .toLowerCase();

    return MAP[key] ?? key;
  }
}