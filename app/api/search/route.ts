import { NextRequest, NextResponse } from "next/server";
import { SearchService } from "@/services/search/SearchService";

export async function GET(
  request: NextRequest
) {

  const { searchParams } =
    new URL(request.url);

  const rubro =
    searchParams.get("rubro");

  const ciudad =
    searchParams.get("ciudad");

  if (!rubro || !ciudad) {

    return NextResponse.json(
      {
        error:
          "Debe indicar rubro y ciudad."
      },
      {
        status: 400
      }
    );

  }

  try {

    const results =
      await SearchService.search(
        rubro,
        ciudad
      );

    return NextResponse.json({
      success: true,
      results
    });

  } catch (error) {

    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error:
          "Error interno del servidor."
      },
      {
        status: 500
      }
    );

  }

}