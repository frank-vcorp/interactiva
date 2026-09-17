"use client";

import { useEffect, useState } from "react";

type Props = {
  editionId: string;
  initialCount: number;
  status: string;
};

export function CatalogEditionRecordCount({
  editionId,
  initialCount,
  status,
}: Props) {
  const [count, setCount] = useState(initialCount);

  useEffect(() => {
    async function refresh() {
      try {
        const res = await fetch(`/api/admin/catalogs/${editionId}`);
        if (!res.ok) return;
        const json = (await res.json()) as {
          ok?: boolean;
          stats?: { interpreted?: number };
          edition?: { processedCount?: number };
        };
        if (!json.ok) return;
        const next =
          json.stats?.interpreted ?? json.edition?.processedCount ?? initialCount;
        setCount(next);
      } catch {
        /* ignore */
      }
    }

    void refresh();
    if (!["loaded", "processing"].includes(status)) return;

    const timer = setInterval(refresh, 5000);
    return () => clearInterval(timer);
  }, [editionId, status, initialCount]);

  return (
    <p className="mt-1 text-sm text-muted-foreground">
      Importación · {count.toLocaleString("es-MX")} registros en base
    </p>
  );
}
