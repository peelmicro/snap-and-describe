import type { FastifyInstance } from "fastify";
import { eq } from "drizzle-orm";
import { db } from "../db/index.ts";
import { imageClassifications, types, images } from "../db/schema.ts";

export async function classificationsRoutes(app: FastifyInstance) {
  // List all classifications (with type and image info)
  app.get("/classifications", async () => {
    return db
      .select({
        id: imageClassifications.id,
        code: imageClassifications.code,
        typeId: imageClassifications.typeId,
        typeCode: types.code,
        typeName: types.name,
        imageId: imageClassifications.imageId,
        imageCode: images.code,
        imageName: images.name,
        properties: imageClassifications.properties,
        createdAt: imageClassifications.createdAt,
      })
      .from(imageClassifications)
      .innerJoin(types, eq(imageClassifications.typeId, types.id))
      .innerJoin(images, eq(imageClassifications.imageId, images.id))
      .orderBy(imageClassifications.createdAt);
  });

  // Get classification by id
  app.get<{ Params: { id: string } }>(
    "/classifications/:id",
    async (request, reply) => {
      const { id } = request.params;
      const [clf] = await db
        .select({
          id: imageClassifications.id,
          code: imageClassifications.code,
          typeId: imageClassifications.typeId,
          typeCode: types.code,
          typeName: types.name,
          imageId: imageClassifications.imageId,
          imageCode: images.code,
          imageName: images.name,
          properties: imageClassifications.properties,
          createdAt: imageClassifications.createdAt,
        })
        .from(imageClassifications)
        .innerJoin(types, eq(imageClassifications.typeId, types.id))
        .innerJoin(images, eq(imageClassifications.imageId, images.id))
        .where(eq(imageClassifications.id, id));
      if (!clf)
        return reply.status(404).send({ error: "Classification not found" });
      return clf;
    }
  );

  // Get classification by code
  app.get<{ Params: { code: string } }>(
    "/classifications/code/:code",
    async (request, reply) => {
      const { code } = request.params;
      const [clf] = await db
        .select()
        .from(imageClassifications)
        .where(eq(imageClassifications.code, code));
      if (!clf)
        return reply.status(404).send({ error: "Classification not found" });
      return clf;
    }
  );

  // Get classifications by image id
  app.get<{ Params: { imageId: string } }>(
    "/classifications/image/:imageId",
    async (request) => {
      const { imageId } = request.params;
      return db
        .select({
          id: imageClassifications.id,
          code: imageClassifications.code,
          typeId: imageClassifications.typeId,
          typeCode: types.code,
          typeName: types.name,
          properties: imageClassifications.properties,
          createdAt: imageClassifications.createdAt,
        })
        .from(imageClassifications)
        .innerJoin(types, eq(imageClassifications.typeId, types.id))
        .where(eq(imageClassifications.imageId, imageId));
    }
  );

  // Delete classification
  app.delete<{ Params: { id: string } }>(
    "/classifications/:id",
    async (request, reply) => {
      const { id } = request.params;
      const [deleted] = await db
        .delete(imageClassifications)
        .where(eq(imageClassifications.id, id))
        .returning();
      if (!deleted)
        return reply.status(404).send({ error: "Classification not found" });
      return { message: "Classification deleted" };
    }
  );
}
