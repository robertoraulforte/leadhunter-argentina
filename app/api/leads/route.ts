import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/leads
 *
 * Obtiene todos los leads guardados.
 */
export async function GET() {
    try {
        const leads = await prisma.lead.findMany({
            orderBy: [
                {
                    score: "desc",
                },
                {
                    createdAt: "desc",
                },
            ],
        });

        return NextResponse.json({
            success: true,
            count: leads.length,
            results: leads,
        });
    } catch (error) {
        console.error(
            "[Leads API] Error obteniendo leads:",
            error
        );

        return NextResponse.json(
            {
                success: false,
                error: "No se pudieron obtener los leads.",
            },
            {
                status: 500,
            }
        );
    }
}

/**
 * POST /api/leads
 *
 * Único punto de creación de leads.
 *
 * Es utilizado tanto por:
 * - resultados del buscador
 * - carga manual desde el Dashboard
 *
 * El lead creado queda disponible automáticamente
 * para el CRM porque se guarda directamente en Prisma.
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        if (!body || typeof body !== "object") {
            return NextResponse.json(
                {
                    success: false,
                    error: "Datos inválidos.",
                },
                {
                    status: 400,
                }
            );
        }

        if (
            !body.name ||
            String(body.name).trim() === ""
        ) {
            return NextResponse.json(
                {
                    success: false,
                    error: "El nombre del lead es obligatorio.",
                },
                {
                    status: 400,
                }
            );
        }

        const parseOptionalNumber = (
            value: unknown
        ): number | null => {
            if (
                value === undefined ||
                value === null ||
                value === ""
            ) {
                return null;
            }

            const number = Number(value);

            return Number.isFinite(number)
                ? number
                : null;
        };

        const lead = await prisma.lead.create({
            data: {
                name: String(body.name).trim(),

                category:
                    body.category
                        ? String(body.category).trim()
                        : null,

                city:
                    body.city
                        ? String(body.city).trim()
                        : null,

                province:
                    body.province
                        ? String(body.province).trim()
                        : null,

                address:
                    body.address
                        ? String(body.address).trim()
                        : null,

                phone:
                    body.phone
                        ? String(body.phone).trim()
                        : null,

                email:
                    body.email
                        ? String(body.email).trim()
                        : null,

                website:
                    body.website
                        ? String(body.website).trim()
                        : null,

                facebook:
                    body.facebook
                        ? String(body.facebook).trim()
                        : null,

                instagram:
                    body.instagram
                        ? String(body.instagram).trim()
                        : null,

                latitude: parseOptionalNumber(
                    body.latitude
                ),

                longitude: parseOptionalNumber(
                    body.longitude
                ),

                score: parseOptionalNumber(
                    body.score
                ),

                priority:
                    body.priority
                        ? String(body.priority).trim()
                        : null,

                source:
                    body.source
                        ? String(body.source).trim()
                        : null,

                favorite:
                    body.favorite === true,

                contacted:
                    body.contacted === true,

                notes:
                    body.notes
                        ? String(body.notes).trim()
                        : null,
            },
        });

        return NextResponse.json(
            {
                success: true,
                message: "Lead creado correctamente.",
                result: lead,
            },
            {
                status: 201,
            }
        );
    } catch (error) {
        console.error(
            "[Leads API] Error creando lead:",
            error
        );

        return NextResponse.json(
            {
                success: false,
                error: "No se pudo guardar el lead.",
            },
            {
                status: 500,
            }
        );
    }
}
