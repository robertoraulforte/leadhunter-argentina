export interface Coordinates {
  lat: number;
  lon: number;
}

const cache = new Map<string, Coordinates>();

export async function getCoordinates(
  city: string
): Promise<Coordinates | null> {

  const key = city.trim().toLowerCase();

  if (cache.has(key)) {
    return cache.get(key)!;
  }

  const url =
    "https://nominatim.openstreetmap.org/search?" +
    new URLSearchParams({
      city,
      country: "Argentina",
      format: "json",
      limit: "1",
    });

  const response = await fetch(url, {
    headers: {
      "User-Agent": "LeadHunterArgentina/1.0",
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as Array<{
    lat: string;
    lon: string;
  }>;

  if (!data.length) {
    return null;
  }

  const coordinates = {
    lat: Number(data[0].lat),
    lon: Number(data[0].lon),
  };

  cache.set(key, coordinates);

  return coordinates;
}