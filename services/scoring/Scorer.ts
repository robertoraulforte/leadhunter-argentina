import { Company } from "@/types/company";

export function calculateScore(
  company: Partial<Company>
): number {
  let score = 0;

  /*
   * ==========================================
   * 1. CONTACTABILIDAD
   * ==========================================
   */

  // WhatsApp es especialmente valioso para
  // contacto comercial directo.
  if (company.whatsapp) {
    score += 25;
  } else if (company.phone) {
    score += 18;
  }

  /*
   * ==========================================
   * 2. OPORTUNIDAD WEB
   * ==========================================
   */

  // No tener sitio es una de las señales
  // más importantes para vender una web.
  if (!company.website) {
    score += 30;
  } else {
    // Si ya tiene web, sigue siendo un prospecto,
    // pero inicialmente tiene menor prioridad.
    score += 5;
  }

  /*
   * ==========================================
   * 3. INFORMACIÓN DEL NEGOCIO
   * ==========================================
   */

  if (
    company.name &&
    company.name.trim() !== "" &&
    company.name !== "Sin nombre"
  ) {
    score += 10;
  }

  if (
    company.category &&
    company.category.trim() !== ""
  ) {
    score += 5;
  }

  if (
    company.address &&
    company.address.trim() !== ""
  ) {
    score += 8;
  }

  if (
    company.city &&
    company.city.trim() !== ""
  ) {
    score += 5;
  }

  /*
   * ==========================================
   * 4. REDES / PRESENCIA DIGITAL
   * ==========================================
   *
   * Si en futuras etapas enriquecemos el lead
   * con redes sociales, estos puntos permitirán
   * detectar negocios activos pero sin web propia.
   */

  if (company.email) {
    score += 4;
  }

  /*
   * ==========================================
   * 5. AJUSTES COMERCIALES
   * ==========================================
   */

  // Un negocio con teléfono + sin web
  // es especialmente interesante.
  if (company.phone && !company.website) {
    score += 5;
  }

  // WhatsApp + sin web = prospecto prioritario.
  if (company.whatsapp && !company.website) {
    score += 5;
  }

  /*
   * ==========================================
   * SCORE FINAL
   * ==========================================
   */

  return Math.min(score, 100);
}