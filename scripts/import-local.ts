import { readFile } from "fs/promises";
import path from "path";
import {
  createImportFromUpload,
  processEdition,
} from "../src/server/services/catalog/import-service";
import type { CatalogSource } from "../src/server/services/catalog/types";

function parseArgs() {
  const args = process.argv.slice(2);
  let source: CatalogSource | null = null;
  let file: string | null = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--source" && args[i + 1]) {
      source = args[i + 1] as CatalogSource;
      i++;
    } else if (args[i] === "--file" && args[i + 1]) {
      file = args[i + 1];
      i++;
    }
  }

  if (!source || !file || !["ebc", "lobato"].includes(source)) {
    throw new Error(
      "Uso: pnpm import:local --source ebc|lobato --file path/to/catalog.pdf",
    );
  }

  return { source, file: path.resolve(file) };
}

async function main() {
  const { source, file } = parseArgs();
  const buffer = await readFile(file);
  const created = await createImportFromUpload(source, buffer);
  if ("error" in created) {
    throw new Error(created.error);
  }

  console.log(`Importación creada: ${created.edition.id}`);
  console.log("Procesando OCR… (puede tardar mucho tiempo)");

  await processEdition(created.edition.id);
  console.log("Procesamiento terminado.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
