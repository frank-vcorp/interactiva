export const IMPORT_ERROR_MESSAGES: Record<string, string> = {
  UNAUTHORIZED: "Sesión expirada. Vuelve a iniciar sesión en admin.",
  INVALID_INPUT: "Datos incompletos. Selecciona fuente y PDF.",
  INVALID_FILE: "El archivo debe ser un PDF (.pdf).",
  FILE_TOO_LARGE: "El PDF supera el límite de 400 MB.",
  DUPLICATE_PDF: "Este PDF ya fue importado previamente.",
  SERVER_ERROR: "Error interno al procesar la importación.",
};

export function importErrorMessage(
  code?: string,
  fallback?: string,
): string {
  if (code && IMPORT_ERROR_MESSAGES[code]) {
    return IMPORT_ERROR_MESSAGES[code];
  }
  return fallback ?? "No se pudo iniciar la importación.";
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
