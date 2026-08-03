import { Company } from "@/types/company";

export function calculateScore(company: Partial<Company>): number {
  let score = 0;

  // 1. WhatsApp / Teléfono de contacto (Alto valor para ventas directas)
  if (company.whatsapp) {
    score += 35;
  } else if (company.phone) {
    score += 20;
  }

  // 2. Presencia Web (Si NO tiene sitio web, es un lead ideal para venderle landing/web!)
  if (!company.website) {
    score += 30; // Lead de alta oportunidad
  } else {
    score += 10; // Ya tiene web, menor prioridad inicial
  }

  // 3. Ubicación y Dirección Completa
  if (company.address && company.address.trim() !== "") {
    score += 20;
  }

  // 4. Nombre identificable
  if (company.name && company.name !== "Sin nombre") {
    score += 15;
  }

  return Math.min(score, 100);
}