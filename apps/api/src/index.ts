import { createServer } from "./server";
import { prisma } from "./db";

const PORT = Number(process.env.PORT ?? 4000);
const CORS_ORIGIN = process.env.CORS_ORIGIN ?? "http://localhost:3000";

const { httpServer, io } = createServer(CORS_ORIGIN);

httpServer.listen(PORT, () => {
  console.log(`[api] listening on :${PORT}`);
});

const shutdown = async () => {
  console.log("[api] shutting down");
  io.close();
  httpServer.close();
  await prisma.$disconnect();
  process.exit(0);
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
