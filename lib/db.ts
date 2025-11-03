import { PrismaClient, Prisma } from '@prisma/client'

type PrismaGlobal = {
  prisma: PrismaClient | undefined
}

const globalForPrisma = globalThis as unknown as PrismaGlobal

const pooledUrl =
  process.env.DATABASE_POOL_URL ??
  process.env.PRISMA_ACCELERATE_URL ??
  process.env.DATABASE_URL

if (!pooledUrl) {
  throw new Error(
    'DATABASE_URL (or DATABASE_POOL_URL / PRISMA_ACCELERATE_URL) must be set to initialise PrismaClient.'
  )
}

const logLevels: Prisma.LogLevel[] =
  process.env.NODE_ENV === 'production'
    ? ['error']
    : ['warn', 'error']

const prismaClient =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: logLevels,
    datasources: {
      db: {
        url: pooledUrl,
      },
    },
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prismaClient
}

export const prisma = prismaClient
