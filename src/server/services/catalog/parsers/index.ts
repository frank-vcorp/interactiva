import type { CatalogSource } from "../types";
import { parseEbcPage } from "./ebc";
import { parseLobatoPage } from "./lobato";

export function parseCatalogPage(
  source: CatalogSource,
  text: string,
  pageNumber: number,
) {
  if (source === "lobato") return parseLobatoPage(text, pageNumber);
  return parseEbcPage(text, pageNumber);
}
