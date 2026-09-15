/** Sin actividad tras subir el PDF — el OCR no arrancó. */
export const OCR_LOADED_STALE_MS = 3 * 60 * 1000;

/** Sin avance de páginas — el job murió o se colgó. */
export const OCR_PROCESSING_STALE_MS = 10 * 60 * 1000;

export function getEditionUpdatedAtMs(updatedAt: string | Date): number {
  return typeof updatedAt === "string"
    ? new Date(updatedAt).getTime()
    : updatedAt.getTime();
}

export function isEditionOcrStale(
  status: string,
  updatedAt: string | Date,
): boolean {
  const age = Date.now() - getEditionUpdatedAtMs(updatedAt);
  if (status === "loaded") return age > OCR_LOADED_STALE_MS;
  if (status === "processing") return age > OCR_PROCESSING_STALE_MS;
  return false;
}

export const STALE_EDITION_MESSAGE =
  "El OCR se detuvo sin completarse (sin actividad reciente). Vuelve a subir el PDF o pulsa «Reintentar OCR».";

export const CANCEL_EDITION_MESSAGE =
  "Procesamiento cancelado manualmente. Vuelve a subir el PDF o pulsa «Reintentar OCR».";
