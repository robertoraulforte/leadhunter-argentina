import { NextRequest, NextResponse } from "next/server";

import { SearchService } from "@/js/services/SearchService";
import { DeduplicatorService } from "@/js/services/DeduplicatorService";
import { ScoringService } from "@/js/services/ScoringService";
import { LeadEnricherService } from "@/js/services/LeadEnricherService";

import { OverpassProvider } from "@/js/providers/OverpassProvider";
import { DuckDuckGoProvider } from "@/js/providers/DuckDuckGoProvider";

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);

    const rubro = searchParams.get("rubro");
    const ciudad = searchParams.get("ciudad");
    const provincia =
        searchParams.get("provincia") || "todas";

    const tamano =
        searchParams.get("tamano") || "todos";

    const necesidad =
        searchParams.get("necesidad") || "cualquiera";

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

        /*
         * ========================================
         * FASE 1
         * BÚSQUEDA MULTIPROVEEDOR
         * ========================================
         */

        const searchService =
            new SearchService();

        searchService.registerProvider(
            new OverpassProvider()
        );

        searchService.registerProvider(
            new DuckDuckGoProvider()
        );

        const filters = {
            rubro,
            ciudad,
            provincia,
            tamano,
            necesidad
        };

        const rawLeads =
            await searchService.searchAll(
                filters
            );

        console.log(
            `[API Search] Leads en bruto: ${rawLeads.length}`
        );

        /*
         * ========================================
         * FASE 2
         * DEDUPLICACIÓN
         * ========================================
         */

        const deduplicatedLeads =
            DeduplicatorService.process(
                rawLeads
            );

        console.log(
            `[API Search] Leads después de deduplicar: ${deduplicatedLeads.length}`
        );

        /*
         * ========================================
         * FASE 3
         * ENRIQUECIMIENTO WEB
         * ========================================
         *
         * Visitamos los sitios encontrados
         * para intentar obtener:
         *
         * - teléfono
         * - email
         * - WhatsApp
         * - Facebook
         * - Instagram
         * - LinkedIn
         */

        const enrichedLeads =
            await LeadEnricherService.process(
                deduplicatedLeads
            );

        console.log(
            `[API Search] Leads enriquecidos: ${enrichedLeads.length}`
        );

        /*
         * ========================================
         * FASE 4
         * SCORING
         * ========================================
         *
         * IMPORTANTE:
         * El scoring ocurre DESPUÉS del
         * enriquecimiento.
         */

        const finalLeads =
            ScoringService.process(
                enrichedLeads
            );

        /*
         * ========================================
         * RESPUESTA
         * ========================================
         */

        return NextResponse.json({
            success: true,

            count: finalLeads.length,

            results: finalLeads,

            meta: {
                raw: rawLeads.length,

                deduplicated:
                    deduplicatedLeads.length,

                enriched:
                    enrichedLeads.length,

                scored:
                    finalLeads.length
            }
        });

    } catch (error) {

        console.error(
            "[API Search Error]:",
            error
        );

        return NextResponse.json(
            {
                success: false,
                error:
                    "Error interno del servidor al procesar la búsqueda."
            },
            {
                status: 500
            }
        );
    }
}