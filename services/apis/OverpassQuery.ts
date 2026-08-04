export class OverpassQuery {
  static build(
    lat: number,
    lon: number,
    category: string
  ): string {

    return `
[out:json][timeout:25];

(
  node["shop"="${category}"](around:10000,${lat},${lon});
  way["shop"="${category}"](around:10000,${lat},${lon});
  relation["shop"="${category}"](around:10000,${lat},${lon});

  node["amenity"="${category}"](around:10000,${lat},${lon});
  way["amenity"="${category}"](around:10000,${lat},${lon});
  relation["amenity"="${category}"](around:10000,${lat},${lon});
);

out center tags;
`;
  }
}