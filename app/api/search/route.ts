import { NextResponse } from "next/server";
import { SearchService } from "@/services/search/SearchService";

const searchService = new SearchService();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rubro = searchParams.get("rubro") || "";
  const ciudad = searchParams.get("ciudad") || "";

  if (!rubro || !ciudad) {
    return NextResponse.json({ error: "Faltan parámetros rubro o ciudad" }, { status: 400 });
  }

  try {
    const results = await searchService.execute(rubro, ciudad);
    return NextResponse.json(results);
  } catch (error) {
    console.error("Error en la búsqueda:", error);
    return NextResponse.json([], { status: 200 });
  }
}