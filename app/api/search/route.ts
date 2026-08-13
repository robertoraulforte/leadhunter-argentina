import { NextRequest, NextResponse } from "next/server";

import { SearchService } from "@/js/services/SearchService";
import { DeduplicatorService } from "@/js/services/DeduplicatorService";
import { ScoringService } from "@/js/services/ScoringService";
import { LeadEnricherService } from "@/js/services/LeadEnricherService";

import { OverpassProvider } from "@/js/providers/OverpassProvider";
import { DuckDuckGoProvider } from "@/js/providers/DuckDuckGoProvider";

export async function GET(request: NextRequest) {
    const totalStart = performance.now();

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

        const searchStart = performance.now();

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

        const searchTime =
            performance.now() - searchStart;

        console.log(
            `[API Search] SearchService: ${(searchTime / 1000).toFixed(2)}s`
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

        const dedupStart = performance.now();

        const deduplicatedLeads =
            DeduplicatorService.process(
                rawLeads
            );

        const dedupTime =
            performance.now() - dedupStart;

        console.log(
            `[API Search] Deduplicator: ${(dedupTime / 1000).toFixed(2)}s`
        );

        console.log(
            `[API Search] Leads después de deduplicar: ${deduplicatedLeads.length}`
        );

        /*
         * ========================================
         * FASE 3
         * ENRIQUECIMIENTO WEB
         * ========================================
         */

        const enrichmentStart =
            performance.now();

        const enrichedLeads =
            await LeadEnricherService.process(
                deduplicatedLeads
            );

        const enrichmentTime =
            performance.now() - enrichmentStart;

        console.log(
            `[API Search] Enrichment: ${(enrichmentTime / 1000).toFixed(2)}s`
        );

        console.log(
            `[API Search] Leads enriquecidos: ${enrichedLeads.length}`
        );

        /*
         * ========================================
         * FASE 4
         * SCORING
         * ========================================
         */

        const scoringStart =
            performance.now();

        const finalLeads =
            ScoringService.process(
                enrichedLeads
            );

        const scoringTime =
            performance.now() - scoringStart;

        console.log(
            `[API Search] Scoring: ${(scoringTime / 1000).toFixed(2)}s`
        );

        /*
         * ========================================
         * TIEMPO TOTAL
         * ========================================
         */

        const totalTime =
            performance.now() - totalStart;

        console.log(
            `[API Search] TOTAL: ${(totalTime / 1000).toFixed(2)}s`
        );

        console.log(
            `[API Search] ========================================`
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
                    finalLeads.length,

                timing: {
                    searchMs:
                        Math.round(searchTime),

                    deduplicatorMs:
                        Math.round(dedupTime),

                    enrichmentMs:
                        Math.round(enrichmentTime),

                    scoringMs:
                        Math.round(scoringTime),

                    totalMs:
                        Math.round(totalTime)
                }
            }
        });

    } catch (error) {

        const totalTime =
            performance.now() - totalStart;

        console.error(
            "[API Search Error]:",
            error
        );

        console.error(
            `[API Search] Falló después de ${(totalTime / 1000).toFixed(2)}s`
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