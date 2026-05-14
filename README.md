# Atlas Training Center — Aplicación Full-Stack

Aplicación web para [Atlas Training Center](https://www.instagram.com/atlas.trainingcenter) — gestión de suscripciones, reservas, progreso de miembros y promoción del centro.

📍 Angamos 338, La Unión, Región de Los Ríos, Chile.

## Stack

| Capa             | Tecnología                                                          |
|------------------|---------------------------------------------------------------------|
| Backend          | Node 20 + TypeScript + Express 5 + Prisma 6 + PostgreSQL 16         |
| Frontend         | React 19 + Vite + TypeScript + TailwindCSS + shadcn/ui              |
| Validación       | Zod (esquemas compartidos backend ↔ frontend)                       |
| Auth             | JWT (access + refresh rotativo) + bcrypt                            |
| Cache / Colas    | Redis + BullMQ                                                      |
| Pagos            | Transbank Webpay Plus                                               |
| Email            | Mailpit (dev) / Resend (prod)                                       |
| Almacenamiento   | Cloudflare R2 (S3-compatible)                                       |
| Monorepo         | pnpm workspaces + Turborepo                                         |

## Estructura

```
atlas/
├── apps/
│   ├── api/      Express + Prisma + workers BullMQ
│   └── web/      Vite + React + PWA
├── packages/
│   └── shared/   Zod schemas y helpers compartidos
└── docker-compose.yml
```

## Setup local

### Requisitos

- Node 20 LTS (`nvm use` lee `.nvmrc`)
- pnpm 10+
- Docker (OrbStack recomendado en macOS — gratis y nativo)

### Instalación

```bash
# 1. Instalar dependencias
pnpm install

# 2. Levantar Postgres + Redis + Mailpit
docker compose up -d

# 3. Configurar variables de entorno
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# 4. Aplicar migraciones y seedear
pnpm db:migrate
pnpm db:seed

# 5. Levantar todo (api en :4000, web en :5173)
pnpm dev
```

Mailpit web UI: http://localhost:8025

### Comandos útiles

```bash
pnpm dev              # turbo dev (web + api en paralelo)
pnpm build            # build de producción
pnpm lint             # lint todos los packages
pnpm typecheck        # tsc --noEmit
pnpm test             # vitest

pnpm db:studio        # Prisma Studio (GUI de la DB)
pnpm db:reset         # reset + reseed (¡destructivo!)
```

## Documentación

El plan de arquitectura completo está en `/Users/luissanmartin/.claude/plans/utilizando-el-siguiente-stack-snug-otter.md`.

## Licencia

Propietaria — Atlas Training Center © 2026
