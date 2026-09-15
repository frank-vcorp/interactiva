import { execFile } from "child_process";
import { mkdtemp, readFile, rm } from "fs/promises";
import os from "os";
import path from "path";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

export async function getPdfPageCount(pdfPath: string): Promise<number> {
  const { stdout } = await execFileAsync("pdfinfo", [pdfPath], {
    maxBuffer: 1024 * 1024,
  });
  const match = stdout.match(/Pages:\s+(\d+)/i);
  if (!match) throw new Error("No se pudo leer el número de páginas del PDF.");
  return Number.parseInt(match[1], 10);
}

export async function ocrPdfPage(
  pdfPath: string,
  pageNumber: number,
  dpi = 200,
): Promise<string> {
  const tmpDir = await mkdtemp(path.join(os.tmpdir(), "interactiva-ocr-"));
  const prefix = path.join(tmpDir, "page");
  try {
    await execFileAsync(
      "pdftoppm",
      [
        "-f",
        String(pageNumber),
        "-l",
        String(pageNumber),
        "-png",
        "-r",
        String(dpi),
        pdfPath,
        prefix,
      ],
      { maxBuffer: 10 * 1024 * 1024 },
    );
    const imagePath = `${prefix}-${pageNumber}.png`;
    const { stdout } = await execFileAsync(
      "tesseract",
      [imagePath, "stdout", "-l", "spa"],
      { maxBuffer: 10 * 1024 * 1024 },
    );
    return stdout;
  } finally {
    await rm(tmpDir, { recursive: true, force: true });
  }
}

export async function ocrPdfCover(pdfPath: string): Promise<string> {
  return ocrPdfPage(pdfPath, 1);
}

export async function fileExists(p: string): Promise<boolean> {
  try {
    await readFile(p);
    return true;
  } catch {
    return false;
  }
}

export async function assertOcrToolsAvailable(): Promise<void> {
  for (const cmd of ["pdfinfo", "pdftoppm", "tesseract"]) {
    try {
      await execFileAsync(cmd, ["--version"], { maxBuffer: 1024 * 1024 });
    } catch {
      throw new Error(
        `Herramienta OCR requerida no disponible: ${cmd}. Instala poppler-utils y tesseract-ocr-spa.`,
      );
    }
  }
}
