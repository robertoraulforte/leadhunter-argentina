import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const lead = await prisma.lead.create({
      data: {
        name: body.name,
        category: body.category ?? null,
        city: body.city ?? null,
        province: body.province ?? null,
        address: body.address ?? null,

        phone: body.phone ?? null,
        email: body.email ?? null,

        website: body.website ?? null,
        facebook: body.facebook ?? null,
        instagram: body.instagram ?? null,

        latitude:
          body.latitude !== undefined && body.latitude !== null
            ? Number(body.latitude)
            : null,

        longitude:
          body.longitude !== undefined && body.longitude !== null
            ? Number(body.longitude)
            : null,

        score:
          body.score !== undefined && body.score !== null
            ? Number(body.score)
            : null,

        priority: body.priority ?? null,
        source: body.source ?? null,

        favorite: body.favorite ?? false,
        contacted: body.contacted ?? false,

        notes: body.notes ?? null,
      },
    });

    return NextResponse.json({
      success: true,
      lead,
    });
  } catch (error) {
    console.error("[API Leads Error]:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Error al guardar el lead.",
      },
      {
        status: 500,
      }
    );
  }
}