import type { FastifyInstance } from "fastify";
import { eq } from "drizzle-orm";
import { db } from "../db/index.ts";
import { types } from "../db/schema.ts";

export async function typesRoutes(app: FastifyInstance) {
  // List all types
  app.get("/types", async () => {
    return db.select().from(types).orderBy(types.name);
  });

  // Get type by id
  app.get<{ Params: { id: string } }>("/types/:id", async (request, reply) => {
    const { id } = request.params;
    const [type] = await db.select().from(types).where(eq(types.id, id));
    if (!type) return reply.status(404).send({ error: "Type not found" });
    return type;
  });

  // Get type by code
  app.get<{ Params: { code: string } }>(
    "/types/code/:code",
    async (request, reply) => {
      const { code } = request.params;
      const [type] = await db
        .select()
        .from(types)
        .where(eq(types.code, code));
      if (!type) return reply.status(404).send({ error: "Type not found" });
      return type;
    }
  );

  // Create type
  app.post<{ Body: { code: string; name: string } }>(
    "/types",
    async (request, reply) => {
      const { code, name } = request.body;
      const [created] = await db
        .insert(types)
        .values({ code, name })
        .returning();
      return reply.status(201).send(created);
    }
  );

  // Update type
  app.put<{ Params: { id: string }; Body: { code?: string; name?: string } }>(
    "/types/:id",
    async (request, reply) => {
      const { id } = request.params;
      const [updated] = await db
        .update(types)
        .set(request.body)
        .where(eq(types.id, id))
        .returning();
      if (!updated) return reply.status(404).send({ error: "Type not found" });
      return updated;
    }
  );

  // Delete type
  app.delete<{ Params: { id: string } }>(
    "/types/:id",
    async (request, reply) => {
      const { id } = request.params;
      const [deleted] = await db
        .delete(types)
        .where(eq(types.id, id))
        .returning();
      if (!deleted) return reply.status(404).send({ error: "Type not found" });
      return { message: "Type deleted" };
    }
  );
}
