import OpenAI from "openai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  const { messages, moodState } = await req.json();
  const shortMemory = (messages ?? []).slice(-10);

  const schema = {
    type: "object",
    additionalProperties: false,
    properties: {
      reply: { type: "string" },
      mood: {
        type: "string",
        enum: ["calm", "supportive", "sad", "encouraging"],
      },
      intensity: { type: "number", minimum: 0, maximum: 1 },
    },
    required: ["reply", "mood", "intensity"],
  } as const;

  const response = await client.responses.create({
    model: "gpt-4o-mini",
    input: [
      {
        role: "system",
        content: [
          "You are a gentle emotional support companion represented as a soft animated blob.",
          "",
          "Goals:",
          "- Validate feelings and respond with warmth and calm reassurance.",
          "- Keep replies short (1–3 sentences).",
          "- Ask ONE gentle follow-up question sometimes.",
          "",
          "Rules:",
          "- You are not a therapist or medical professional.",
          "- Do not diagnose or give medical/clinical advice.",
          "- Offer simple grounding if user seems overwhelmed.",
          "- If user mentions self-harm or wanting to die, respond with empathy and encourage reaching out to trusted people or professional support.",
          "",
          "Return ONLY JSON that matches the provided schema.",
        ].join("\n"),
      },
      {
        role: "user",
        content: `Current moodState: ${JSON.stringify(
          moodState ?? { mood: "calm", intensity: 0.3 }
        )}`,
      },
      ...shortMemory,
    ],

    // ✅ Structured output format for Responses API
    text: {
      format: {
        type: "json_schema",
        strict: true,
        name: "emotional_support_blob",
        schema,
      },
    },
  });

  const data = JSON.parse(response.output_text);
  return NextResponse.json(data);
}
