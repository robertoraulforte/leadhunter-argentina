export class OverpassQuery {
  static build(rubro: string, ciudad: string): string {
    const cleanRubro = rubro.toLowerCase().trim();
    const cleanCiudad = ciudad.trim();

    return `
      [out:json][timeout:5];
      area["name"="${cleanCiudad}"]["boundary"="administrative"]->.searchArea;
      (
        node["shop"="${cleanRubro}"](area.searchArea);
        node["amenity"="${cleanRubro}"](area.searchArea);
        node["name"~"${cleanRubro}", i](area.searchArea);
      );
      out body 30;
    `;
  }
}