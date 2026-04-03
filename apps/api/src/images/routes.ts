import type { FastifyInstance } from "fastify";
import { eq, sql } from "drizzle-orm";
import multipart from "@fastify/multipart";
import { db } from "../db/index.ts";
import {
  images,
  types,
  imageClassifications,
  conversations,
  messages,
} from "../db/schema.ts";
import { generateCode } from "../common/code-generator.ts";
import { uploadBuffer, downloadBuffer, getPresignedUrl, deleteObject } from "../storage/minio-client.ts";
import { analyzeImage } from "../vision/vision-service.ts";

export async function imagesRoutes(app: FastifyInstance) {
  await app.register(multipart, { limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB

  // List images (paginated, filterable by type code or tag)
  app.get<{
    Querystring: { page?: string; limit?: string; type?: string; tag?: string };
  }>("/images", async (request) => {
    const page = Math.max(1, Number(request.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(request.query.limit) || 20));
    const offset = (page - 1) * limit;
    const { type: typeCode, tag } = request.query;

    let query = db.select().from(images);

    if (typeCode) {
      // Filter by classification type code
      const imageIds = db
        .select({ imageId: imageClassifications.imageId })
        .from(imageClassifications)
        .innerJoin(types, eq(imageClassifications.typeId, types.id))
        .where(eq(types.code, typeCode));

      query = query.where(sql`${images.id} IN (${imageIds})`) as typeof query;
    }

    if (tag) {
      query = query.where(
        sql`${images.tags}::jsonb @> ${JSON.stringify([tag])}::jsonb`
      ) as typeof query;
    }

    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(images);
    const items = await query.orderBy(images.createdAt).limit(limit).offset(offset);

    return {
      items,
      page,
      limit,
      total: Number(countResult.count),
    };
  });

  // Get image by id (with classifications and conversations)
  app.get<{ Params: { id: string } }>(
    "/images/:id",
    async (request, reply) => {
      const { id } = request.params;
      const [image] = await db.select().from(images).where(eq(images.id, id));
      if (!image) return reply.status(404).send({ error: "Image not found" });

      const classifications = await db
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
        .where(eq(imageClassifications.imageId, id));

      const imageConversations = await db
        .select()
        .from(conversations)
        .where(eq(conversations.imageId, id))
        .orderBy(conversations.createdAt);

      // Generate presigned URL for the image
      let imageUrl: string | null = null;
      if (image.storagePath) {
        const key = image.storagePath.replace("images/", "");
        imageUrl = await getPresignedUrl(key);
      }

      return { ...image, imageUrl, classifications, conversations: imageConversations };
    }
  );

  // Serve image file (proxy from MinIO)
  app.get<{ Params: { id: string } }>(
    "/images/:id/file",
    async (request, reply) => {
      const { id } = request.params;
      const [image] = await db.select().from(images).where(eq(images.id, id));
      if (!image || !image.storagePath) {
        return reply.status(404).send({ error: "Image not found" });
      }

      const key = image.storagePath.replace("images/", "");
      const buffer = await downloadBuffer(key);
      const format = image.imageMetadata?.format || "jpeg";
      const contentType = `image/${format === "jpg" ? "jpeg" : format}`;

      return reply
        .header("Content-Type", contentType)
        .header("Cache-Control", "public, max-age=3600")
        .send(buffer);
    }
  );

  // Get image by code
  app.get<{ Params: { code: string } }>(
    "/images/code/:code",
    async (request, reply) => {
      const { code } = request.params;
      const [image] = await db
        .select()
        .from(images)
        .where(eq(images.code, code));
      if (!image) return reply.status(404).send({ error: "Image not found" });
      return image;
    }
  );

  // Upload image: receive file → store in MinIO → analyze with Claude Vision → save to DB
  app.post("/images/upload", async (request, reply) => {
    const file = await request.file();
    if (!file) return reply.status(400).send({ error: "No file uploaded" });

    const buffer = await file.toBuffer();
    const mimeType = file.mimetype;

    if (!mimeType.startsWith("image/")) {
      return reply.status(400).send({ error: "File must be an image" });
    }

    // Count existing images for code generation
    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(images);
    const sequence = Number(countResult.count) + 1;
    const code = generateCode("IMG", sequence);

    // Upload to MinIO
    const ext = file.filename.split(".").pop() || "jpg";
    const storageKey = `${code}.${ext}`;
    const storagePath = await uploadBuffer(storageKey, buffer, mimeType);

    // Analyze with Claude Vision
    let visionResult;
    try {
      visionResult = await analyzeImage(buffer, mimeType);
    } catch (err) {
      // Log vision error for debugging
      app.log.error({ err, mimeType, bufferSize: buffer.length }, "Vision analysis failed");
      // Save image even if vision fails
      const [saved] = await db
        .insert(images)
        .values({
          code,
          name: file.filename,
          storagePath,
          imageMetadata: { format: ext, size: buffer.length },
        })
        .returning();
      return reply.status(201).send({
        ...saved,
        visionError: err instanceof Error ? err.message : "Vision analysis failed",
      });
    }

    // Save image with vision metadata
    const [saved] = await db
      .insert(images)
      .values({
        code,
        name: file.filename,
        suggestedName: visionResult.suggestedName,
        tags: visionResult.tags,
        description: visionResult.description,
        storagePath,
        imageMetadata: { format: ext, size: buffer.length },
      })
      .returning();

    // Save classifications
    const allTypes = await db.select().from(types);
    const typeByCode = new Map(allTypes.map((t) => [t.code, t]));

    let clfSeq = 0;
    for (const clf of visionResult.classifications) {
      const type = typeByCode.get(clf.type);
      if (!type) continue;

      clfSeq++;
      const [countClf] = await db
        .select({ count: sql<number>`count(*)` })
        .from(imageClassifications);
      const clfCode = generateCode("CLF", Number(countClf.count) + 1);

      await db.insert(imageClassifications).values({
        code: clfCode,
        typeId: type.id,
        imageId: saved.id,
        properties: [
          { propertyName: "confidence", propertyContent: String(clf.confidence) },
          ...clf.properties,
        ],
      });
    }

    // Return image with classifications
    const classifications = await db
      .select()
      .from(imageClassifications)
      .where(eq(imageClassifications.imageId, saved.id));

    return reply.status(201).send({ ...saved, classifications });
  });

  // Update image
  app.put<{
    Params: { id: string };
    Body: { name?: string; suggestedName?: string; tags?: string[]; description?: string };
  }>("/images/:id", async (request, reply) => {
    const { id } = request.params;
    const [updated] = await db
      .update(images)
      .set(request.body)
      .where(eq(images.id, id))
      .returning();
    if (!updated) return reply.status(404).send({ error: "Image not found" });
    return updated;
  });

  // Delete image (also deletes from MinIO)
  app.delete<{ Params: { id: string } }>(
    "/images/:id",
    async (request, reply) => {
      const { id } = request.params;
      const [image] = await db.select().from(images).where(eq(images.id, id));
      if (!image) return reply.status(404).send({ error: "Image not found" });

      // Delete classifications
      await db
        .delete(imageClassifications)
        .where(eq(imageClassifications.imageId, id));

      // Delete conversations and messages
      const imageConversations = await db
        .select()
        .from(conversations)
        .where(eq(conversations.imageId, id));
      for (const conv of imageConversations) {
        await db.delete(messages).where(eq(messages.conversationId, conv.id));
      }
      await db.delete(conversations).where(eq(conversations.imageId, id));

      // Delete from MinIO
      if (image.storagePath) {
        const key = image.storagePath.replace("images/", "");
        await deleteObject(key);
      }

      // Delete image record
      await db.delete(images).where(eq(images.id, id));

      return { message: "Image deleted" };
    }
  );
}
