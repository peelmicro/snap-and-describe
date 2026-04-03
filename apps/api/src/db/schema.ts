import {
  pgTable,
  uuid,
  varchar,
  text,
  json,
  jsonb,
  timestamp,
} from "drizzle-orm/pg-core";

// 1. Types — classification categories for photos
export const types = pgTable("types", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: varchar("code", { length: 20 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// 2. Images — uploaded photos with AI-generated metadata
export const images = pgTable("images", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: varchar("code", { length: 20 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  suggestedName: varchar("suggested_name", { length: 100 }),
  tags: json("tags").$type<string[]>(),
  description: text("description"),
  storagePath: varchar("storage_path", { length: 500 }),
  imageMetadata: jsonb("image_metadata").$type<{
    width?: number;
    height?: number;
    format?: string;
    size?: number;
    takenAt?: string;
    longitude?: number;
    latitude?: number;
  }>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// 3. Image Classifications — links images to types with AI analysis properties
export const imageClassifications = pgTable("image_classifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: varchar("code", { length: 20 }).notNull().unique(),
  typeId: uuid("type_id")
    .notNull()
    .references(() => types.id),
  imageId: uuid("image_id")
    .notNull()
    .references(() => images.id),
  properties: jsonb("properties").$type<
    { propertyName: string; propertyContent: string }[]
  >(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// 4. Conversations — chat sessions per image for follow-up questions
export const conversations = pgTable("conversations", {
  id: uuid("id").primaryKey().defaultRandom(),
  imageId: uuid("image_id")
    .notNull()
    .references(() => images.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// 5. Messages — individual messages within a conversation
export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  conversationId: uuid("conversation_id")
    .notNull()
    .references(() => conversations.id),
  role: varchar("role", { length: 20 }).notNull(), // 'user' or 'assistant'
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
