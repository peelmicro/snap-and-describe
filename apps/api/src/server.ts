import Fastify from "fastify";
import cors from "@fastify/cors";

const PORT = Number(process.env.API_PORT) || 3000;

const app = Fastify({ logger: true });

await app.register(cors);

app.get("/health", async () => {
  return { status: "ok" };
});

try {
  await app.listen({ port: PORT, host: "0.0.0.0" });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
