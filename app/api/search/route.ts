import { NextRequest, NextResponse } from "next/server";

import { SearchService } from "@/js/services/SearchService";
import { OverpassProvider } from "@/js/providers/OverpassProvider";
import { DeduplicatorService } from "@/js/services/DeduplicatorService";
import { ScoringService } from "@/js/services/ScoringService";

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    const { searchParams } = new URL(request.url);

    const rubro = searchParams.get("rubro")?.trim() || "";
    const ciudad = searchParams.get("ciudad")?.trim() || "";
    const provincia =
      searchParams.get("provincia")?.trim() || "todas";

    if (!rubro || !ciudad) {
      return NextResponse.json(
        {
          success: false,
          error: "El rubro y la ciudad son obligatorios.",
        },
        { status: 400 }
      );
    }

    const filters = {
      rubro,
      ciudad,
      provincia,
    };

    console.log(
      `[API Search] Buscando "${rubro}" en "${ciudad}"`
    );

    /*
     * =========================================================
     * SEARCH SERVICE
     * =========================================================
     *
     * DuckDuckGo queda desactivado temporalmente.
     *
     * Por ahora utilizamos solamente Overpass.
     */

    const searchService = new SearchService();

    searchService.registerProvider(
      new OverpassProvider()
    );

    const rawLeads =
      await searchService.searchAll(filters);

    console.log(
      `[API Search] SearchService: ${
        (Date.now() - startTime) / 1000
      }s`
    );

    console.log(
      `[API Search] Leads en bruto: ${rawLeads.length}`
    );

    /*
     * =========================================================
     * DEDUPLICACIÃ“N
     * =========================================================
     */

    const deduplicatedLeads =
      DeduplicatorService.process(rawLeads);

    console.log(
      `[API Search] Leads despuÃ©s de deduplicar: ${deduplicatedLeads.length}`
    );

    /*
     * =========================================================
     * SCORING
     * =========================================================
     *
     * LeadEnricherService queda fuera temporalmente porque
     * actualmente no expone un mÃ©todo enrich().
     *
     * No modificamos ese servicio.
     */

    const scoredLeads =
      ScoringService.process(
        deduplicatedLeads
      );

    console.log(
      `[API Search] Leads con scoring: ${scoredLeads.length}`
    );

    /*
     * =========================================================
     * RESPUESTA PARA EL DASHBOARD
     * =========================================================
     */

    const results = scoredLeads.map((lead) => ({
      id: lead.id,

      nombre:
        lead.nombre ||
        "Empresa",

      provincia:
        lead.provincia ||
        "",

      ciudad:
        lead.ciudad ||
        ciudad,

      rubro:
        lead.rubro ||
        rubro,

      email:
        lead.email ||
        null,

      telefono:
        lead.telefono ||
        null,

      scoreIA:
        lead.scoreIA ??
        0,

      prioridad:
        lead.prioridad ||
        "media",

      fuentes:
        Array.isArray(lead.fuentes)
          ? lead.fuentes
          : [],
    }));
    console.log(
      `[API Search] TOTAL: ${
        (Date.now() - startTime) / 1000
      }s`
    );

    console.log(
      "[API Search] ========================================"
    );

    return NextResponse.json({
      success: true,
      results,
      total: results.length,
    });

  } catch (error) {
    console.error(
      "[API Search] Error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Error interno del servidor.",
      },
      { status: 500 }
    );
  }
}



