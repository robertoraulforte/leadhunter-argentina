/**
 * Normaliza texto para comparaciones.
 */
export function normalizeText(value: unknown): string {
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
export function normalizePhone(value: unknown): string {
  return String(value ?? "").replace(/\D/g, "");
}

/**
 * Normaliza URL para comparar variantes
 * del mismo sitio.
 */
export function normalizeUrl(value: unknown): string {
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