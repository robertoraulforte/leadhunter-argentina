export interface Coordinates {
  lat: number;
  lon: number;
}

export async function getCoordinates(
  city: string
): Promise<Coordinates | null> {

  const url =
    `https://nominatim.openstreetmap.org/search?` +
    `city=${encodeURIComponent(city)}` +
    `&country=Argentina` +
    `&format=json&limit=1`;

  const response = await fetch(url, {
    headers: {
      "User-Agent": "LeadHunter Argentina"
    }
  });

  if (!response.ok) {
    return null;
  }

  const data = await response.json();

  if (!data.length) {
    return null;
  }

  return {
    lat: Number(data[0].lat),
    lon: Number(data[0].lon),
  };
}