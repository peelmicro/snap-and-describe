/**
 * TypeScript interfaces matching the API response shapes.
 * These are used by hooks and components for type safety.
 */

export interface ImageType {
  id: string;
  code: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface ImageItem {
  id: string;
  code: string;
  name: string;
  suggestedName: string | null;
  tags: string[] | null;
  description: string | null;
  storagePath: string | null;
  imageMetadata: {
    width?: number;
    height?: number;
    format?: string;
    size?: number;
    takenAt?: string;
    longitude?: number;
    latitude?: number;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface ImageDetail extends ImageItem {
  imageUrl: string | null;
  classifications: Classification[];
  conversations: Conversation[];
}

export interface Classification {
  id: string;
  code: string;
  typeId: string;
  typeCode: string;
  typeName: string;
  properties: { propertyName: string; propertyContent: string }[] | null;
  createdAt: string;
}

export interface Conversation {
  id: string;
  imageId: string;
  createdAt: string;
  updatedAt: string;
  messages?: Message[];
}

export interface Message {
  id: string;
  conversationId: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export interface ImageListResponse {
  items: ImageItem[];
  page: number;
  limit: number;
  total: number;
}

export interface SearchResponse {
  query: string;
  items: ImageItem[];
  page: number;
  limit: number;
  total: number;
}

export interface ChatResponse {
  conversationId: string;
  response: string;
}
