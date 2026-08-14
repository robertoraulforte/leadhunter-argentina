import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "crm_auth";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 días

function getAdminPassword(): string {
  const password = process.env.CRM_ADMIN_PASSWORD;

  if (!password) {
    throw new Error(
      "CRM_ADMIN_PASSWORD no está configurada en las variables de entorno."
    );
  }

  return password;
}

function createSignature(timestamp: string): string {
  return createHmac("sha256", getAdminPassword())
    .update(timestamp)
    .digest("hex");
}

function createToken(): string {
  const timestamp = Date.now().toString();
  const signature = createSignature(timestamp);

  return `${timestamp}.${signature}`;
}

function verifyToken(token: string): boolean {
  try {
    const parts = token.split(".");

    if (parts.length !== 2) {
      return false;
    }

    const [timestamp, signature] = parts;

    const timestampNumber = Number(timestamp);

    if (!Number.isFinite(timestampNumber)) {
      return false;
    }

    const age = Date.now() - timestampNumber;

    if (age < 0 || age > SESSION_MAX_AGE * 1000) {
      return false;
    }

    const expectedSignature = createSignature(timestamp);

    const providedBuffer = Buffer.from(signature, "utf8");
    const expectedBuffer = Buffer.from(expectedSignature, "utf8");

    if (providedBuffer.length !== expectedBuffer.length) {
      return false;
    }

    return timingSafeEqual(providedBuffer, expectedBuffer);
  } catch {
    return false;
  }
}

export function verifyAdminPassword(password: string): boolean {
  const expected = getAdminPassword();

  const providedBuffer = Buffer.from(password, "utf8");
  const expectedBuffer = Buffer.from(expected, "utf8");

  if (providedBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(providedBuffer, expectedBuffer);
}

export async function createCrmSession(): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.set({
    name: COOKIE_NAME,
    value: createToken(),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function destroyCrmSession(): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.set({
    name: COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function isCrmAuthenticated(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;

    if (!token) {
      return false;
    }

    return verifyToken(token);
  } catch {
    return false;
  }
}

export async function requireCrmAuth(): Promise<void> {
  const authenticated = await isCrmAuthenticated();

  if (!authenticated) {
    const { redirect } = await import("next/navigation");

    redirect("/crm/login");
  }
}
