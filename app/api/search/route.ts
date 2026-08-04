import { NextRequest, NextResponse } from "next/server";

// Importación de las clases del Pipeline
import { SearchService } from "@/js/services/SearchService";
import { DeduplicatorService } from "@/js/services/DeduplicatorService";
import { ScoringService } from "@/js/services/ScoringService";

// Importación de los Proveedores
import { OverpassProvider } from "@/js/providers/OverpassProvider";
import { DuckDuckGoProvider } from "@/js/providers/DuckDuckGoProvider";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const rubro = searchParams.get("rubro");
  const ciudad = searchParams.get("ciudad");
  const provincia = searchParams.get("provincia") || "todas";
  const tamano = searchParams.get("tamano") || "todos";
  const necesidad = searchParams.get("necesidad") || "cualquiera";

  if (!rubro || !ciudad) {
    return NextResponse.json(
      {
        success: false,
        error: "Debe indicar rubro y ciudad."
      },
      {
        status: 400
      }
    );
  }

  try {
    // 1. Inicializar el Orquestador y registrar proveedores
    const searchService = new SearchService();
    searchService.registerProvider(new OverpassProvider());
    searchService.registerProvider(new DuckDuckGoProvider());

    // 2. Empaquetar filtros
    const filters = {
      rubro,
      ciudad,
      provincia,
      tamano,
      necesidad
    };

    // 3. Ejecutar Pipeline en 3 Fases:
    // Fase A: Búsqueda paralela multiproveedor
    const rawLeads = await searchService.searchAll(filters);

    // Fase B: Deduplicación y fusión de datos
    const deduplicatedLeads = DeduplicatorService.process(rawLeads);

    // Fase C: Evaluación e Scoring con IA / Reglas
    const finalLeads = ScoringService.process(deduplicatedLeads);

    // 4. Retornar respuesta estructurada
    return NextResponse.json({
      success: true,
      count: finalLeads.length,
      results: finalLeads
    });

  } catch (error) {
    console.error("[API Search Error]:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Error interno del servidor al procesar la búsqueda."
      },
      {
        status: 500
      }
    );
  }
}