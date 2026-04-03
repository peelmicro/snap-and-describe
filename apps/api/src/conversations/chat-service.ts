import Anthropic from "@anthropic-ai/sdk";

interface ImageContext {
  description: string | null;
  tags: string[] | null;
  classifications: { typeName: string; properties: { propertyName: string; propertyContent: string }[] }[];
}

interface MessageHistory {
  role: "user" | "assistant";
  content: string;
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

export async function chatAboutImage(
  imageContext: ImageContext,
  messageHistory: MessageHistory[],
  userQuestion: string
): Promise<string> {
  const anthropic = getClient();

  const classificationsText = imageContext.classifications
    .map((c) => {
      const props = c.properties
        .map((p) => `${p.propertyName}: ${p.propertyContent}`)
        .join(", ");
      return `- ${c.typeName}: ${props}`;
    })
    .join("\n");

  const systemPrompt = `The user is asking about a photo they uploaded. Here's the context:

Photo description: ${imageContext.description || "No description available"}
Tags: ${imageContext.tags?.join(", ") || "No tags"}
Classifications:
${classificationsText || "No classifications"}

Provide a helpful, concise answer based on the photo context. If the user asks something that cannot be determined from the photo information, say so honestly.`;

  // Build messages array with history + new question
  const messages: { role: "user" | "assistant"; content: string }[] = [
    ...messageHistory,
    { role: "user", content: userQuestion },
  ];

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    system: systemPrompt,
    messages,
  });

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text response from Claude");
  }

  return textBlock.text;
}
