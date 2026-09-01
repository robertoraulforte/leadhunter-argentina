import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isCrmAuthenticated } from "@/lib/crm-auth";

async function requireApiCrmAuth() {
    const authenticated = await isCrmAuthenticated();

    if (!authenticated) {
        return NextResponse.json(
            {
                success: false,
                error: "No autorizado.",
            },
            {
                status: 401,
            }
        );
    }

    return null;
}

export async function GET() {
    const authError = await requireApiCrmAuth();

    if (authError) {
        return authError;
    }

    try {
        const leads = await prisma.lead.findMany({
            include: {
                followUps: {
                    orderBy: {
                        createdAt: "asc",
                    },
                },
            },
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

export async function PATCH(request: NextRequest) {
    const authError = await requireApiCrmAuth();

    if (authError) {
        return authError;
    }

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
            where: { id },
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

        const data: any = {};

        if (body.name !== undefined) data.name = String(body.name).trim();
        if (body.category !== undefined) data.category = body.category ? String(body.category) : null;
        if (body.city !== undefined) data.city = body.city ? String(body.city) : null;
        if (body.province !== undefined) data.province = body.province ? String(body.province) : null;
        if (body.address !== undefined) data.address = body.address ? String(body.address) : null;
        if (body.phone !== undefined) data.phone = body.phone ? String(body.phone) : null;
        if (body.email !== undefined) data.email = body.email ? String(body.email) : null;
        if (body.website !== undefined) data.website = body.website ? String(body.website) : null;
        if (body.facebook !== undefined) data.facebook = body.facebook ? String(body.facebook) : null;
        if (body.instagram !== undefined) data.instagram = body.instagram ? String(body.instagram) : null;
        if (body.latitude !== undefined) data.latitude = body.latitude === null || body.latitude === "" ? null : Number(body.latitude);
        if (body.longitude !== undefined) data.longitude = body.longitude === null || body.longitude === "" ? null : Number(body.longitude);
        if (body.score !== undefined) data.score = body.score === null || body.score === "" ? null : Number(body.score);
        if (body.priority !== undefined) data.priority = body.priority ? String(body.priority) : null;
        if (body.source !== undefined) data.source = body.source ? String(body.source) : null;
        if (body.favorite !== undefined) data.favorite = body.favorite === true;
        if (body.contacted !== undefined) data.contacted = body.contacted === true;
        if (body.notes !== undefined) data.notes = body.notes ? String(body.notes) : null;

        const lead = await prisma.lead.update({
            where: { id },
            data,
            include: {
                followUps: {
                    orderBy: {
                        createdAt: "asc",
                    },
                },
            },
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
    const authError = await requireApiCrmAuth();

    if (authError) {
        return authError;
    }

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

        await prisma.lead.delete({
            where: { id },
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
