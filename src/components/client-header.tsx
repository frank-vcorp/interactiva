import Link from "next/link";
import { LogoutButton } from "@/components/logout-button";

type Props = {
  title: string;
  backHref?: string;
  backLabel?: string;
};

export function ClientHeader({
  title,
  backHref = "/buscar",
  backLabel = "Buscar",
}: Props) {
  return (
    <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <div>
          {backHref && (
            <Link
              href={backHref}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              ← {backLabel}
            </Link>
          )}
          <h1 className="text-lg font-semibold text-primary">{title}</h1>
        </div>
        <nav className="flex items-center gap-2">
          <Link
            href="/cuenta"
            className="rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            Cuenta
          </Link>
          <LogoutButton />
        </nav>
      </div>
    </header>
  );
}
