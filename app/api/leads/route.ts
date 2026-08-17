import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Normaliza un texto para comparaciones.
 */
function normalizeText(value: unknown): string {
    return String(value ?? "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, " ");
}

/**
 * Normaliza teléfono eliminando caracteres no numéricos.
 */
function normalizePhone(value: unknown): string {
    return String(value ?? "").replace(/\D/g, "");
}

/**
 * Normaliza URL para poder comparar variantes del mismo sitio.
 */
function normalizeUrl(value: unknown): string {
    let url = String(value ?? "")
        .trim()
        .toLowerCase();

    if (!url) {
        return "";
    }

    url = url.replace(/^https?:\/\//, "");
    url = url.replace(/^www\./, "");
    url = url.replace(/\/+$/, "");

    return url;
}

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
 * Antes de crear el registro se realiza una comprobación
 * de duplicados utilizando:
 *
 * 1. Email
 * 2. Teléfono
 * 3. Website
 * 4. Nombre + ciudad
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

        const name = String(body.name).trim();
        const category = body.category
            ? String(body.category).trim()
            : null;

        const city = body.city
            ? String(body.city).trim()
            : null;

        const province = body.province
            ? String(body.province).trim()
            : null;

        const phone = body.phone
            ? String(body.phone).trim()
            : null;

        const email = body.email
            ? String(body.email).trim()
            : null;

        const website = body.website
            ? String(body.website).trim()
            : null;

        const normalizedEmail = normalizeText(email);
        const normalizedPhone = normalizePhone(phone);
        const normalizedWebsite = normalizeUrl(website);
        const normalizedName = normalizeText(name);
        const normalizedCity = normalizeText(city);

        /*
         * =========================================================
         * DETECCIÓN DE DUPLICADOS
         * =========================================================
         */

        const existingLeads = await prisma.lead.findMany({
            select: {
                id: true,
                name: true,
                city: true,
                province: true,
                phone: true,
                email: true,
                website: true,
            },
        });

        const duplicate = existingLeads.find((existing) => {
            /*
             * 1. Email
             *
             * Si ambos tienen email y coinciden, consideramos
             * que es el mismo lead.
             */
            if (
                normalizedEmail &&
                normalizeText(existing.email) === normalizedEmail
            ) {
                return true;
            }

            /*
             * 2. Teléfono
             *
             * Comparamos solamente los números.
             */
            if (
                normalizedPhone &&
                normalizePhone(existing.phone) === normalizedPhone
            ) {
                return true;
            }

            /*
             * 3. Website
             *
             * https://www.empresa.com
             * empresa.com/
             *
             * se consideran el mismo sitio.
             */
            if (
                normalizedWebsite &&
                normalizeUrl(existing.website) === normalizedWebsite
            ) {
                return true;
            }

            /*
             * 4. Nombre + ciudad
             *
             * Es nuestro último recurso para detectar duplicados.
             * No usamos solamente el nombre porque pueden existir
             * empresas con nombres iguales en ciudades diferentes.
             */
            if (
                normalizedName &&
                normalizedCity &&
                normalizeText(existing.name) === normalizedName &&
                normalizeText(existing.city) === normalizedCity
            ) {
                return true;
            }

            return false;
        });

        if (duplicate) {
            console.log(
                `[Leads API] Lead duplicado detectado: "${name}" -> ${duplicate.id}`
            );

            return NextResponse.json(
                {
                    success: false,
                    duplicate: true,
                    existingLeadId: duplicate.id,
                    error: "Este lead ya existe en el CRM.",
                },
                {
                    status: 409,
                }
            );
        }

        /**
         * Convierte valores opcionales a número.
         */
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

        /*
         * =========================================================
         * CREACIÓN
         * =========================================================
         */

        const lead = await prisma.lead.create({
            data: {
                name,

                category,

                city,

                province,

                address:
                    body.address
                        ? String(body.address).trim()
                        : null,

                phone,

                email,

                website,

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

        console.log(
            `[Leads API] Lead creado correctamente: ${lead.id}`
        );

        return NextResponse.json(
            {
                success: true,
                duplicate: false,
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