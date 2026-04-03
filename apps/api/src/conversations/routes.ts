import type { FastifyInstance } from "fastify";
import { eq } from "drizzle-orm";
import { db } from "../db/index.ts";
import {
  images,
  types,
  imageClassifications,
  conversations,
  messages,
} from "../db/schema.ts";
import { chatAboutImage } from "./chat-service.ts";

export async function conversationsRoutes(app: FastifyInstance) {
  // Send a message about an image (creates conversation if first message)
  app.post<{
    Params: { imageId: string };
    Body: { message: string; conversationId?: string };
  }>("/images/:imageId/chat", async (request, reply) => {
    const { imageId } = request.params;
    const { message: userMessage, conversationId } = request.body;

    if (!userMessage?.trim()) {
      return reply.status(400).send({ error: "Message is required" });
    }

    // Verify image exists
    const [image] = await db
      .select()
      .from(images)
      .where(eq(images.id, imageId));
    if (!image) return reply.status(404).send({ error: "Image not found" });

    // Get or create conversation
    let convId = conversationId;
    if (!convId) {
      const [newConv] = await db
        .insert(conversations)
        .values({ imageId })
        .returning();
      convId = newConv.id;
    } else {
      // Verify conversation exists and belongs to this image
      const [conv] = await db
        .select()
        .from(conversations)
        .where(eq(conversations.id, convId));
      if (!conv || conv.imageId !== imageId) {
        return reply.status(404).send({ error: "Conversation not found" });
      }
    }

    // Load conversation history
    const history = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, convId))
      .orderBy(messages.createdAt);

    const messageHistory = history.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    // Load image classifications for context
    const classifications = await db
      .select({
        typeName: types.name,
        properties: imageClassifications.properties,
      })
      .from(imageClassifications)
      .innerJoin(types, eq(imageClassifications.typeId, types.id))
      .where(eq(imageClassifications.imageId, imageId));

    // Get AI response
    const assistantResponse = await chatAboutImage(
      {
        description: image.description,
        tags: image.tags,
        classifications: classifications.map((c) => ({
          typeName: c.typeName,
          properties: c.properties || [],
        })),
      },
      messageHistory,
      userMessage
    );

    // Save both messages
    await db.insert(messages).values({
      conversationId: convId,
      role: "user",
      content: userMessage,
    });

    await db.insert(messages).values({
      conversationId: convId,
      role: "assistant",
      content: assistantResponse,
    });

    return {
      conversationId: convId,
      response: assistantResponse,
    };
  });

  // Get conversation history for an image
  app.get<{ Params: { imageId: string } }>(
    "/images/:imageId/conversations",
    async (request, reply) => {
      const { imageId } = request.params;

      const [image] = await db
        .select()
        .from(images)
        .where(eq(images.id, imageId));
      if (!image) return reply.status(404).send({ error: "Image not found" });

      const imageConversations = await db
        .select()
        .from(conversations)
        .where(eq(conversations.imageId, imageId))
        .orderBy(conversations.createdAt);

      // Load messages for each conversation
      const result = await Promise.all(
        imageConversations.map(async (conv) => {
          const convMessages = await db
            .select()
            .from(messages)
            .where(eq(messages.conversationId, conv.id))
            .orderBy(messages.createdAt);
          return { ...conv, messages: convMessages };
        })
      );

      return result;
    }
  );

  // Get single conversation with messages
  app.get<{ Params: { id: string } }>(
    "/conversations/:id",
    async (request, reply) => {
      const { id } = request.params;
      const [conv] = await db
        .select()
        .from(conversations)
        .where(eq(conversations.id, id));
      if (!conv)
        return reply.status(404).send({ error: "Conversation not found" });

      const convMessages = await db
        .select()
        .from(messages)
        .where(eq(messages.conversationId, id))
        .orderBy(messages.createdAt);

      return { ...conv, messages: convMessages };
    }
  );
}
