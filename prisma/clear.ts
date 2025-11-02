import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("⚠️  Clearing all application data from dev database...");

  await prisma.$transaction(async (tx) => {
    await tx.auditLog.deleteMany();
    await tx.decision.deleteMany();
    await tx.note.deleteMany();
    await tx.dailyPnl.deleteMany();
    await tx.trade.deleteMany();
    await tx.project.deleteMany();
    await tx.strategy.deleteMany();
    await tx.user.deleteMany();
  });

  console.log("✅ All tables cleared. Run `npm run db:push` or reseed with real data.");
}

main()
  .catch((error) => {
    console.error("❌ Failed to clear database", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
