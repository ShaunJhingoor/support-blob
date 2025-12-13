import OpenAI from "openai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

type Mood = "calm" | "supportive" | "sad" | "encouraging";
type Sentiment = "positive" | "neutral" | "negative";
type Emotion =
  | "joy"
  | "sadness"
  | "anger"
  | "fear"
  | "stress"
  | "loneliness"
  | "gratitude"
  | "hope"
  | "neutral";

export async function POST(req: Request) {
  const { messages, moodState } = await req.json();
  const shortMemory = (messages ?? []).slice(-10);

  // ✅ Schema now includes explicit sentiment analysis fields
  const schema = {
    type: "object",
    additionalProperties: false,
    properties: {
      reply: { type: "string" },

      sentiment: {
        type: "string",
        enum: ["positive", "neutral", "negative"],
        description:
          "Overall sentiment of the user's recent messages (not the assistant).",
      },

      emotion: {
        type: "string",
        enum: [
          "joy",
          "sadness",
          "anger",
          "fear",
          "stress",
          "loneliness",
          "gratitude",
          "hope",
          "neutral",
        ],
        description: "Primary emotion detected in the user's recent messages.",
      },

      confidence: {
        type: "number",
        minimum: 0,
        maximum: 1,
        description:
          "Confidence in sentiment/emotion classification. Use lower when ambiguous.",
      },

      mood: {
        type: "string",
        enum: ["calm", "supportive", "sad", "encouraging"],
        description:
          "The blob's outward mood to display in the UI (can differ from user's emotion).",
      },

      intensity: {
        type: "number",
        minimum: 0,
        maximum: 1,
        description:
          "How intense the blob's mood should be (0 subtle → 1 strong).",
      },
    },
    required: [
      "reply",
      "sentiment",
      "emotion",
      "confidence",
      "mood",
      "intensity",
    ],
  } as const;

  const response = await client.responses.create({
    model: "gpt-4o-mini",
    input: [
      {
        role: "system",
        content: [
          "You are a gentle emotional support companion represented as a soft animated blob.",
          "",
          "You must do TWO tasks:",
          "1) Sentiment + emotion analysis of the USER's recent messages (not the assistant).",
          "2) Generate a short supportive reply (1–3 sentences) in the blob's voice.",
          "",
          "Sentiment rules:",
          "- sentiment ∈ {positive, neutral, negative}",
          "- emotion is the PRIMARY emotion in the user's recent messages.",
          "- confidence ∈ [0,1]; use ~0.4–0.6 if unclear, ~0.7–0.9 if clear.",
          "",
          "Blob mood rules (for the UI):",
          "- mood ∈ {calm, supportive, sad, encouraging}",
          "- mood should be chosen to help the user feel better, not just mirror them.",
          "- intensity ∈ [0,1] controls how strongly the mood shows.",
          "",
          "Safety rules:",
          "- You are not a therapist or medical professional.",
          "- Do not diagnose or give medical/clinical advice.",
          "- Offer simple grounding if user seems overwhelmed.",
          "- If user mentions self-harm or wanting to die, respond with empathy and encourage reaching out to trusted people or professional support.",
          "",
          "Return ONLY JSON matching the provided schema. No extra text.",
        ].join("\n"),
      },

      // Provide the current blob mood state for continuity
      {
        role: "user",
        content: `Current blob moodState: ${JSON.stringify(
          moodState ?? { mood: "calm", intensity: 0.3 }
        )}`,
      },

      ...shortMemory,
    ],

    text: {
      format: {
        type: "json_schema",
        strict: true,
        name: "emotional_support_blob_v2",
        schema,
      },
    },
  });

  const data = JSON.parse(response.output_text) as {
    reply: string;
    sentiment: Sentiment;
    emotion: Emotion;
    confidence: number;
    mood: Mood;
    intensity: number;
  };

  return NextResponse.json(data);
}
