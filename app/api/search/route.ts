import { NextResponse } from "next/server";
import { OverpassProvider } from "@/services/apis/OverpassProvider";

const provider = new OverpassProvider();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const rubro = searchParams.get("rubro") || "";
  const ciudad = searchParams.get("ciudad") || "";

  if (!rubro || !ciudad) {
    return NextResponse.json(
      { error: "Debe indicar rubro y ciudad" },
      { status: 400 }
    );
  }

  const companies = await provider.search(
    rubro,
    ciudad
  );

  return NextResponse.json({
    success: true,
    results: companies,
  });
}