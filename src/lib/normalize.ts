/**
 * Helpers de normalización de datos de entrada.
 *
 * Reglas:
 * - No destruir información: los nombres se guardan como el usuario los tipeó.
 * - Solo normalizar lo que tiene una convención clara (email, teléfono).
 * - Aplicar trim() siempre para evitar espacios accidentales.
 */

/**
 * Normaliza el nombre de una persona.
 * - Trim al inicio y fin.
 * - Colapsa espacios múltiples en uno solo.
 * - NO cambia mayúsculas (respeta McDonald, van der Berg, O'Brien, etc.).
 */
export function normalizeName(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

/**
 * Normaliza un email a lowercase + trim.
 * Los emails son case-insensitive en la práctica y lowercase evita duplicados.
 */
export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

/**
 * Normaliza un teléfono dejando solo dígitos y opcionalmente un "+" inicial.
 * Ejemplos:
 *   "+591 789-45612"    → "+59178945612"
 *   "(591) 78945612"    → "59178945612"
 *   "+591-789-45612"    → "+59178945612"
 */
export function normalizePhone(value: string): string {
  const trimmed = value.trim();
  const hasPlus = trimmed.startsWith('+');
  const digits = trimmed.replace(/\D/g, '');
  return hasPlus ? `+${digits}` : digits;
}

/**
 * Normaliza un texto largo (notas, descripciones).
 * - Trim al inicio y fin.
 * - Colapsa 3+ saltos de línea consecutivos en 2 (evita espacios gigantes).
 */
export function normalizeMultilineText(value?: string): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return trimmed.replace(/\n{3,}/g, '\n\n');
}

/**
 * Normaliza un texto corto (direcciones, hábitos, condiciones).
 * - Trim al inicio y fin.
 * - Colapsa espacios múltiples en uno.
 */
export function normalizeShortText(value?: string): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim().replace(/\s+/g, ' ');
  return trimmed || undefined;
}