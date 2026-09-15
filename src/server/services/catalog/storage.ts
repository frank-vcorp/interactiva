import { createHash } from "crypto";
import { mkdir, writeFile, readFile, rm, access } from "fs/promises";
import path from "path";

export const STORAGE_ROOT = path.join(process.cwd(), "storage", "imports");

export function getEditionPdfPath(editionId: string): string {
  return path.join(STORAGE_ROOT, editionId, "original.pdf");
}

export async function ensureEditionDir(editionId: string): Promise<string> {
  const dir = path.join(STORAGE_ROOT, editionId);
  await mkdir(dir, { recursive: true });
  return dir;
}

export async function saveEditionPdf(
  editionId: string,
  data: Buffer,
): Promise<{ path: string; sha256: string }> {
  await ensureEditionDir(editionId);
  const pdfPath = getEditionPdfPath(editionId);
  await writeFile(pdfPath, data);
  const sha256 = createHash("sha256").update(data).digest("hex");
  return { path: pdfPath, sha256 };
}

export async function readEditionPdf(editionId: string): Promise<Buffer> {
  return readFile(getEditionPdfPath(editionId));
}

export function sha256Buffer(data: Buffer): string {
  return createHash("sha256").update(data).digest("hex");
}

export async function editionPdfExists(editionId: string): Promise<boolean> {
  try {
    await access(getEditionPdfPath(editionId));
    return true;
  } catch {
    return false;
  }
}

/** Elimina el directorio del PDF de una edición. Devuelve false si no existía. */
export async function deleteEditionPdf(editionId: string): Promise<boolean> {
  const dir = path.join(STORAGE_ROOT, editionId);
  try {
    await access(dir);
    await rm(dir, { recursive: true, force: true });
    return true;
  } catch {
    return false;
  }
}
