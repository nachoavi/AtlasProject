import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { PrismaConfig } from 'prisma';

// Cargar .env manualmente — Prisma 7 ya no lo hace automático
// cuando prisma.config.ts está presente.
const here = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(here, '.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/i);
    if (m && !process.env[m[1]!]) {
      process.env[m[1]!] = m[2]!.replace(/^['"]|['"]$/g, '');
    }
  }
}

export default {
  schema: path.join('prisma', 'schema.prisma'),
  migrations: {
    seed: 'tsx prisma/seed.ts',
  },
} satisfies PrismaConfig;
