"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ClientRow = {
  id: string;
  whatsapp: string;
  createdAt: string;
};

export function AdminClientSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(false);

  async function search(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/clients?q=${encodeURIComponent(query)}`,
      );
      const data = (await res.json()) as { clients?: ClientRow[] };
      setResults(data.clients ?? []);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={search} className="flex gap-2">
        <div className="flex-1 space-y-1">
          <Label htmlFor="q">WhatsApp</Label>
          <Input
            id="q"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por WhatsApp"
          />
        </div>
        <Button type="submit" className="self-end" disabled={loading}>
          Buscar
        </Button>
      </form>

      {results.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sin resultados.</p>
      ) : (
        <ul className="divide-y rounded-xl border bg-card">
          {results.map((c) => (
            <li key={c.id}>
              <Link
                href={`/admin/clientes/${c.id}`}
                className="block px-4 py-3 hover:bg-secondary/40"
              >
                {c.whatsapp}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
