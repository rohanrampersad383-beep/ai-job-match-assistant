import { prisma } from "../src/lib/db/prisma";
import { runDiscoveryForSource } from "../src/lib/discovery/run";

async function main() {
  const sourceId = process.argv[2];

  if (!sourceId) {
    throw new Error("Usage: npm run discovery:run-source -- <source-id>");
  }

  const summary = await runDiscoveryForSource(sourceId, null);
  const source = await prisma.discoverySource.findUnique({
    where: { id: sourceId },
    include: {
      runs: {
        orderBy: { startedAt: "desc" },
        take: 1
      },
      logs: {
        orderBy: { createdAt: "desc" },
        take: 12
      },
      errors: {
        orderBy: { createdAt: "desc" },
        take: 12
      }
    }
  });

  console.log(
    JSON.stringify(
      {
        summary,
        source: source
          ? {
              id: source.id,
              name: source.name,
              publicUrl: source.publicUrl,
              lastStatus: source.lastStatus,
              lastMessage: source.lastMessage,
              latestRun: source.runs[0] ?? null,
              recentLogs: source.logs.map((log) => ({
                level: log.level,
                message: log.message,
                context: log.context,
                createdAt: log.createdAt
              })),
              recentErrors: source.errors.map((error) => ({
                code: error.code,
                message: error.message,
                details: error.details,
                createdAt: error.createdAt
              }))
            }
          : null
      },
      null,
      2
    )
  );
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
