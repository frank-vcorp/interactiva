# Interactiva

Servicio web/PWA que convierte los catálogos automotrices **EBC** y **Lobato** en información estructurada, buscable y filtrable.

## Documentación funcional

- [`VECTORIA_DISCOVERY_INTERACTIVA.md`](./VECTORIA_DISCOVERY_INTERACTIVA.md) — especificación V1
- [`VECTORIA_PLAN_VALIDACION.md`](./VECTORIA_PLAN_VALIDACION.md) — plan de validación por fases

## Stack

- Next.js 15 (App Router)
- PostgreSQL + Drizzle ORM
- Tailwind CSS
- Argon2 + sesión JWT en cookie httpOnly

## Desarrollo local

```bash
cp .env.example .env
# Editar DATABASE_URL y SESSION_SECRET

pnpm install
pnpm bootstrap   # migrate + seed superusuario
pnpm dev
```

Staging: `https://interactiva.vector-ia.mx`

## Fases de construcción

| Fase | Estado |
|------|--------|
| 1 — Base, acceso y navegación | En progreso |
| 2 — Catálogos e importación | Pendiente |
| 3 — Búsqueda y detalle vehicular | Pendiente |
| 4 — Valores protegidos y kilometraje | Pendiente |
| 5 — Mercado Pago y vigencia | Pendiente |
| 6 — Administración y cierre | Pendiente |

## Superusuario inicial

- Usuario: `Vectoria`
- Contraseña: definida en `INTERACTIVA_SUPERUSER_PASSWORD` (solo seed inicial)
