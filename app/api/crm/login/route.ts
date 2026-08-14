import { NextResponse } from "next/server";
import {
  createCrmSession,
  verifyAdminPassword,
} from "@/lib/crm-auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const password =
      typeof body?.password === "string"
        ? body.password
        : "";

    if (!password) {
      return NextResponse.json(
        {
          success: false,
          error: "La contraseña es obligatoria.",
        },
        { status: 400 }
      );
    }

    if (!verifyAdminPassword(password)) {
      return NextResponse.json(
        {
          success: false,
          error: "Contraseña incorrecta.",
        },
        { status: 401 }
      );
    }

    await createCrmSession();

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("[CRM LOGIN]", error);

    return NextResponse.json(
      {
        success: false,
        error: "Error interno del servidor.",
      },
      { status: 500 }
    );
  }
}
