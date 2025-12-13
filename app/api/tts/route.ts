import OpenAI from "openai";

export const runtime = "nodejs";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  const { text } = await req.json();

  const audio = await client.audio.speech.create({
    model: "tts-1",
    voice: "nova",
    input: text,
  });

  const buf = Buffer.from(await audio.arrayBuffer());

  return new Response(buf, {
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "no-store",
    },
  });
}
