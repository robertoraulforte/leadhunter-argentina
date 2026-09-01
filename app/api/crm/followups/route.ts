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

export async function GET(request: NextRequest) {
    const authError = await requireApiCrmAuth();

    if (authError) {
        return authError;
    }

    try {
        const { searchParams } = new URL(request.url);
        const leadId = searchParams.get("leadId");

        if (!leadId || leadId.trim() === "") {
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

        const followUps = await prisma.followUp.findMany({
            where: {
                leadId: leadId.trim(),
            },
            orderBy: [
                {
                    completed: "asc",
                },
                {
                    date: "asc",
                },
            ],
        });

        return NextResponse.json({
            success: true,
            count: followUps.length,
            results: followUps,
        });
    } catch (error) {
        console.error("[CRM FollowUps API] Error obteniendo seguimientos:", error);

        return NextResponse.json(
            {
                success: false,
                error: "No se pudieron obtener los seguimientos.",
            },
            {
                status: 500,
            }
        );
    }
}

export async function POST(request: NextRequest) {
    const authError = await requireApiCrmAuth();

    if (authError) {
        return authError;
    }

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

        if (!body.leadId || String(body.leadId).trim() === "") {
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

        if (!body.date || String(body.date).trim() === "") {
            return NextResponse.json(
                {
                    success: false,
                    error: "La fecha del seguimiento es obligatoria.",
                },
                {
                    status: 400,
                }
            );
        }

        if (!body.type || String(body.type).trim() === "") {
            return NextResponse.json(
                {
                    success: false,
                    error: "El tipo de seguimiento es obligatorio.",
                },
                {
                    status: 400,
                }
            );
        }

        if (!body.description || String(body.description).trim() === "") {
            return NextResponse.json(
                {
                    success: false,
                    error: "La descripción del seguimiento es obligatoria.",
                },
                {
                    status: 400,
                }
            );
        }

        const leadId = String(body.leadId).trim();

        const existingLead = await prisma.lead.findUnique({
            where: {
                id: leadId,
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

        const date = new Date(String(body.date));

        if (Number.isNaN(date.getTime())) {
            return NextResponse.json(
                {
                    success: false,
                    error: "La fecha del seguimiento no es válida.",
                },
                {
                    status: 400,
                }
            );
        }

        const followUp = await prisma.followUp.create({
            data: {
                leadId,
                date,
                type: String(body.type).trim(),
                description: String(body.description).trim(),
                completed: body.completed === true,
            },
        });

        return NextResponse.json(
            {
                success: true,
                message: "Seguimiento creado correctamente.",
                result: followUp,
            },
            {
                status: 201,
            }
        );
    } catch (error) {
        console.error("[CRM FollowUps API] Error creando seguimiento:", error);

        return NextResponse.json(
            {
                success: false,
                error: "No se pudo crear el seguimiento.",
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
                    error: "El ID del seguimiento es obligatorio.",
                },
                {
                    status: 400,
                }
            );
        }

        const id = String(body.id).trim();

        const existingFollowUp = await prisma.followUp.findUnique({
            where: {
                id,
            },
        });

        if (!existingFollowUp) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Seguimiento no encontrado.",
                },
                {
                    status: 404,
                }
            );
        }

        const data: {
            date?: Date;
            type?: string;
            description?: string;
            completed?: boolean;
        } = {};

        if (body.date !== undefined) {
            const date = new Date(String(body.date));

            if (Number.isNaN(date.getTime())) {
                return NextResponse.json(
                    {
                        success: false,
                        error: "La fecha del seguimiento no es válida.",
                    },
                    {
                        status: 400,
                    }
                );
            }

            data.date = date;
        }

        if (body.type !== undefined) {
            const type = String(body.type).trim();

            if (!type) {
                return NextResponse.json(
                    {
                        success: false,
                        error: "El tipo de seguimiento no puede estar vacío.",
                    },
                    {
                        status: 400,
                    }
                );
            }

            data.type = type;
        }

        if (body.description !== undefined) {
            const description = String(body.description).trim();

            if (!description) {
                return NextResponse.json(
                    {
                        success: false,
                        error: "La descripción no puede estar vacía.",
                    },
                    {
                        status: 400,
                    }
                );
            }

            data.description = description;
        }

        if (body.completed !== undefined) {
            data.completed = body.completed === true;
        }

        const followUp = await prisma.followUp.update({
            where: {
                id,
            },
            data,
        });

        return NextResponse.json({
            success: true,
            message: "Seguimiento actualizado correctamente.",
            result: followUp,
        });
    } catch (error) {
        console.error("[CRM FollowUps API] Error actualizando seguimiento:", error);

        return NextResponse.json(
            {
                success: false,
                error: "No se pudo actualizar el seguimiento.",
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
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id || id.trim() === "") {
            return NextResponse.json(
                {
                    success: false,
                    error: "El ID del seguimiento es obligatorio.",
                },
                { status: 400 }
            );
        }

        const cleanId = id.trim();

        const existingFollowUp = await prisma.followUp.findUnique({
            where: {
                id: cleanId,
            },
        });

        if (!existingFollowUp) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Seguimiento no encontrado.",
                },
                { status: 404 }
            );
        }

        await prisma.followUp.delete({
            where: {
                id: cleanId,
            },
        });

        return NextResponse.json({
            success: true,
            message: "Seguimiento eliminado correctamente.",
        });
    } catch (error) {
        console.error("[CRM FollowUps API] Error eliminando seguimiento:", error);
        return NextResponse.json(
            {
                success: false,
                error: "Error interno al eliminar el seguimiento.",
            },
            { status: 500 }
        );
    }
}
