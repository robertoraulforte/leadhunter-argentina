import { NextResponse } from "next/server";
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
