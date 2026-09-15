const WHATSAPP_REGEX = /^\+?52?\d{10}$/;

export function normalizeWhatsApp(input: string): string {
  const digits = input.replace(/\D/g, "");
  if (digits.length === 10) return `52${digits}`;
  if (digits.length === 12 && digits.startsWith("52")) return digits;
  throw new Error("WhatsApp inválido. Usa 10 dígitos de México.");
}

export function formatWhatsAppDisplay(normalized: string): string {
  if (normalized.length !== 12 || !normalized.startsWith("52")) {
    return normalized;
  }
  const local = normalized.slice(2);
  return `+52 ${local.slice(0, 2)} ${local.slice(2, 6)} ${local.slice(6)}`;
}

export function isValidWhatsAppInput(input: string): boolean {
  try {
    const normalized = normalizeWhatsApp(input);
    return WHATSAPP_REGEX.test(normalized);
  } catch {
    return false;
  }
}
