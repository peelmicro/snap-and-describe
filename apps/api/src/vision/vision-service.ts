import Anthropic from "@anthropic-ai/sdk";

const ANALYSIS_PROMPT = `Analyze this photo and provide:
1. A detailed description (2-3 sentences)
2. A suggested name for this photo
3. Up to 5 relevant tags
4. Classifications with confidence scores:
   - Is it: objects, food, buildings, text, or nature?
   - For each matching category, list specific properties

Respond ONLY in JSON format (no markdown, no code blocks):
{
  "description": "...",
  "suggestedName": "...",
  "tags": ["tag1", "tag2"],
  "classifications": [
    {
      "type": "food",
      "confidence": 0.95,
      "properties": [
        {"propertyName": "ingredients", "propertyContent": "..."},
        {"propertyName": "cuisine", "propertyContent": "..."}
      ]
    }
  ]
}`;

export interface VisionClassification {
  type: string;
  confidence: number;
  properties: { propertyName: string; propertyContent: string }[];
}

export interface VisionResult {
  description: string;
  suggestedName: string;
  tags: string[];
  classifications: VisionClassification[];
}

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey || apiKey === "your-api-key-here") {
      throw new Error(
        "ANTHROPIC_API_KEY is not configured. Set it in the .env file."
      );
    }
    client = new Anthropic({ apiKey });
  }
  return client;
}

export async function analyzeImage(
  imageBuffer: Buffer,
  mimeType: string
): Promise<VisionResult> {
  const anthropic = getClient();

  const base64Image = imageBuffer.toString("base64");
  const mediaType = mimeType as
    | "image/jpeg"
    | "image/png"
    | "image/gif"
    | "image/webp";

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: mediaType,
              data: base64Image,
            },
          },
          {
            type: "text",
            text: ANALYSIS_PROMPT,
          },
        ],
      },
    ],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text response from Claude Vision");
  }

  try {
    const result: VisionResult = JSON.parse(textBlock.text);

    // Validate required fields
    if (!result.description || !result.suggestedName || !result.tags) {
      throw new Error("Incomplete response from Claude Vision");
    }

    // Ensure tags is an array with max 5 items
    result.tags = result.tags.slice(0, 5);

    // Filter classifications to known types
    const validTypes = ["objects", "food", "buildings", "text", "nature"];
    result.classifications = (result.classifications || []).filter((c) =>
      validTypes.includes(c.type)
    );

    return result;
  } catch (err) {
    if (err instanceof SyntaxError) {
      throw new Error(
        `Failed to parse Claude Vision response as JSON: ${textBlock.text.substring(0, 200)}`
      );
    }
    throw err;
  }
}
