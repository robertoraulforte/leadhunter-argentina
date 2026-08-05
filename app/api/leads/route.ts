import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const lead = await prisma.lead.create({
      data: {
        name: body.name,
        category: body.category,
        city: body.city,
        province: body.province,
        address: body.address,
        phone: body.phone,
        email: body.email,
      },
    });

    return NextResponse.json({ success: true, lead });
  } catch (error) {
    console.error("[API Leads Error]:", error);
    return NextResponse.json(
      { success: false, error: "Error al guardar el lead." },
      { status: 500 }
    );
  }
}