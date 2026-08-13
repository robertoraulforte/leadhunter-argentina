import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
        console.error("[CRM API] Error obteniendo leads:", error);

        return NextResponse.json(
            {
                success: false,
                error: "No se pudieron obtener los leads del CRM.",
            },
            {
                status: 500,
            }
        );
    }
}

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

        if (!body.name || String(body.name).trim() === "") {
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

        const lead = await prisma.lead.create({
            data: {
                name: String(body.name).trim(),

                category: body.category
                    ? String(body.category)
                    : null,

                city: body.city
                    ? String(body.city)
                    : null,

                province: body.province
                    ? String(body.province)
                    : null,

                address: body.address
                    ? String(body.address)
                    : null,

                phone: body.phone
                    ? String(body.phone)
                    : null,

                email: body.email
                    ? String(body.email)
                    : null,

                website: body.website
                    ? String(body.website)
                    : null,

                facebook: body.facebook
                    ? String(body.facebook)
                    : null,

                instagram: body.instagram
                    ? String(body.instagram)
                    : null,

                latitude:
                    body.latitude !== undefined &&
                    body.latitude !== null
                        ? Number(body.latitude)
                        : null,

                longitude:
                    body.longitude !== undefined &&
                    body.longitude !== null
                        ? Number(body.longitude)
                        : null,

                score:
                    body.score !== undefined &&
                    body.score !== null
                        ? Number(body.score)
                        : null,

                priority: body.priority
                    ? String(body.priority)
                    : null,

                source: body.source
                    ? String(body.source)
                    : null,

                favorite:
                    body.favorite === true,

                contacted:
                    body.contacted === true,

                notes: body.notes
                    ? String(body.notes)
                    : null,
            },
        });

        return NextResponse.json(
            {
                success: true,
                message: "Lead guardado correctamente.",
                result: lead,
            },
            {
                status: 201,
            }
        );
    } catch (error) {
        console.error("[CRM API] Error creando lead:", error);

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

export async function PATCH(request: NextRequest) {
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

        if (!body.id || String(body.id).trim() === "") {
            return NextResponse.json(
                {
                    success: false,
                    error: "El ID del lead es obligatorio.",
                },
                {
                    status: 400,
                }
            );
        }

        const id = String(body.id).trim();

        const existingLead = await prisma.lead.findUnique({
            where: {
                id,
            },
        });

        if (!existingLead) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Lead no encontrado.",
                },
                {
                    status: 404,
                }
            );
        }

        const data: {
            name?: string;
            category?: string | null;
            city?: string | null;
            province?: string | null;
            address?: string | null;
            phone?: string | null;
            email?: string | null;
            website?: string | null;
            facebook?: string | null;
            instagram?: string | null;
            latitude?: number | null;
            longitude?: number | null;
            score?: number | null;
            priority?: string | null;
            source?: string | null;
            favorite?: boolean;
            contacted?: boolean;
            notes?: string | null;
        } = {};

        if (body.name !== undefined) {
            const name = String(body.name).trim();

            if (!name) {
                return NextResponse.json(
                    {
                        success: false,
                        error: "El nombre no puede estar vacío.",
                    },
                    {
                        status: 400,
                    }
                );
            }

            data.name = name;
        }

        if (body.category !== undefined) {
            data.category = body.category
                ? String(body.category)
                : null;
        }

        if (body.city !== undefined) {
            data.city = body.city
                ? String(body.city)
                : null;
        }

        if (body.province !== undefined) {
            data.province = body.province
                ? String(body.province)
                : null;
        }

        if (body.address !== undefined) {
            data.address = body.address
                ? String(body.address)
                : null;
        }

        if (body.phone !== undefined) {
            data.phone = body.phone
                ? String(body.phone)
                : null;
        }

        if (body.email !== undefined) {
            data.email = body.email
                ? String(body.email)
                : null;
        }

        if (body.website !== undefined) {
            data.website = body.website
                ? String(body.website)
                : null;
        }

        if (body.facebook !== undefined) {
            data.facebook = body.facebook
                ? String(body.facebook)
                : null;
        }

        if (body.instagram !== undefined) {
            data.instagram = body.instagram
                ? String(body.instagram)
                : null;
        }

        if (body.latitude !== undefined) {
            data.latitude =
                body.latitude === null || body.latitude === ""
                    ? null
                    : Number(body.latitude);
        }

        if (body.longitude !== undefined) {
            data.longitude =
                body.longitude === null || body.longitude === ""
                    ? null
                    : Number(body.longitude);
        }

        if (body.score !== undefined) {
            data.score =
                body.score === null || body.score === ""
                    ? null
                    : Number(body.score);
        }

        if (body.priority !== undefined) {
            data.priority = body.priority
                ? String(body.priority)
                : null;
        }

        if (body.source !== undefined) {
            data.source = body.source
                ? String(body.source)
                : null;
        }

        if (body.favorite !== undefined) {
            data.favorite = body.favorite === true;
        }

        if (body.contacted !== undefined) {
            data.contacted = body.contacted === true;
        }

        if (body.notes !== undefined) {
            data.notes = body.notes
                ? String(body.notes)
                : null;
        }

        const lead = await prisma.lead.update({
            where: {
                id,
            },
            data,
        });

        return NextResponse.json({
            success: true,
            message: "Lead actualizado correctamente.",
            result: lead,
        });
    } catch (error) {
        console.error("[CRM API] Error actualizando lead:", error);

        return NextResponse.json(
            {
                success: false,
                error: "No se pudo actualizar el lead.",
            },
            {
                status: 500,
            }
        );
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const body = await request.json();

        if (!body || typeof body !== "object" || !body.id) {
            return NextResponse.json(
                {
                    success: false,
                    error: "El ID del lead es obligatorio.",
                },
                {
                    status: 400,
                }
            );
        }

        const id = String(body.id).trim();

        const existingLead = await prisma.lead.findUnique({
            where: {
                id,
            },
        });

        if (!existingLead) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Lead no encontrado.",
                },
                {
                    status: 404,
                }
            );
        }

        await prisma.lead.delete({
            where: {
                id,
            },
        });

        return NextResponse.json({
            success: true,
            message: "Lead eliminado correctamente.",
        });
    } catch (error) {
        console.error("[CRM API] Error eliminando lead:", error);

        return NextResponse.json(
            {
                success: false,
                error: "No se pudo eliminar el lead.",
            },
            {
                status: 500,
            }
        );
    }
}