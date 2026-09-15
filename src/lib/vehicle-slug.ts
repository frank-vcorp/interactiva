export function parseVehicleSlug(slug: string): {
  ebcRecordId?: string;
  lobatoRecordId?: string;
  singleRecordId?: string;
  singleSource?: "ebc" | "lobato";
} | null {
  const decoded = decodeURIComponent(slug);

  if (decoded.startsWith("par/")) {
    const parts = decoded.split("/");
    if (parts.length >= 3) {
      return { ebcRecordId: parts[1], lobatoRecordId: parts[2] };
    }
    return null;
  }

  if (decoded.startsWith("ebc/")) {
    return { singleRecordId: decoded.slice(4), singleSource: "ebc" };
  }

  if (decoded.startsWith("lobato/")) {
    return { singleRecordId: decoded.slice(7), singleSource: "lobato" };
  }

  return null;
}
