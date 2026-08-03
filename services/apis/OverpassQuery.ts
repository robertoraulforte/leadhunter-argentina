const RUBRO_MAP: Record<string, string[]> = {
  gomeria: ["tyres", "car_repair"],
  gomería: ["tyres", "car_repair"],
  neumaticos: ["tyres", "car_repair"],
  neumáticos: ["tyres", "car_repair"],
  taller: ["car_repair"],
  mecanica: ["car_repair"],
  mecánica: ["car_repair"],
  lavadero: ["car_wash"],
  ferreteria: ["hardware", "doityourself"],
  ferretería: ["hardware", "doityourself"],
  supermercado: ["supermarket", "convenience"],
  almacen: ["convenience", "supermarket"],
  almacén: ["convenience", "supermarket"],
  panaderia: ["bakery"],
  panadería: ["bakery"],
  farmacia: ["pharmacy"],
  restaurante: ["restaurant"],
  bar: ["bar", "pub"],
  cafeteria: ["cafe"],
  cafetería: ["cafe"],
  peluqueria: ["hairdresser"],
  peluquería: ["hairdresser"],
};

export function mapRubro(input: string): string[] {
  const clean = input.trim().toLowerCase();
  return RUBRO_MAP[clean] || [clean];
}

export function buildQuery(lat: number, lon: number, category: string, radius: number = 10000): string {
  const categories = mapRubro(category);

  // Mapeamos únicamente tags exactos para que la consulta sea instantánea
  const queries = categories
    .flatMap((cat) => [
      `node["shop"="${cat}"](around:${radius},${lat},${lon});`,
      `way["shop"="${cat}"](around:${radius},${lat},${lon});`,
      `node["amenity"="${cat}"](around:${radius},${lat},${lon});`,
      `way["amenity"="${cat}"](around:${radius},${lat},${lon});`,
    ])
    .join("\n  ");

  return `[out:json][timeout:10];
(
  ${queries}
);
out center body;
>;
out skel qt;`;
}