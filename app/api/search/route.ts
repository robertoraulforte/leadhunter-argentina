import { NextResponse } from "next/server";
import { SearchService } from "@/services/search/SearchService";

export async function GET(request: Request) {

  const { searchParams } = new URL(request.url);

  const rubro = searchParams.get("rubro") || "";
  const ciudad = searchParams.get("ciudad") || "";

  if (!rubro || !ciudad) {
    return NextResponse.json(
      {
        error: "Debe indicar rubro y ciudad"
      },
      {
        status: 400
      }
    );
  }

  try {

    const companies = await SearchService.search(
      rubro,
      ciudad
    );

    return NextResponse.json({
      success: true,
      results: companies
    });

  } catch (error) {

    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error: "Error buscando empresas"
      },
      {
        status: 500
      }
    );

  }
}