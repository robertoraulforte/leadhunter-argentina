import { NextResponse } from "next/server";
import { destroyCrmSession } from "@/lib/crm-auth";

export async function POST() {
  try {
    await destroyCrmSession();

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("[CRM LOGOUT]", error);

    return NextResponse.json(
      {
        success: false,
        error: "No se pudo cerrar la sesión.",
      },
      { status: 500 }
    );
  }
}
