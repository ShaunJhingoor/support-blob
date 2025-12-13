"use client";

import { useEffect, useRef, useState } from "react";
import CharacterScene from "./CharacterScene";

type Role = "user" | "assistant";
type Msg = { role: Role; content: string };

type Mood = "calm" | "supportive" | "sad" | "encouraging";

export default function EmotionalSupportBlob() {
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content: "Hi. I’m your support blob. What’s on your mind today?",
    },
  ]);

  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [talking, setTalking] = useState(false);

  const [mood, setMood] = useState<Mood>("calm");
  const [intensity, setIntensity] = useState(0.35);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);

  function stopSpeech() {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
    setTalking(false);
  }

  useEffect(() => {
    return () => stopSpeech();
  }, []);

  async function speak(text: string) {
    const res = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    audioUrlRef.current = url;

    const audio = new Audio(url);
    audioRef.current = audio;

    setTalking(true);

    audio.onended = () => {
      setTalking(false);
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = null;
      }
    };

    await audio.play();
  }

  async function send() {
    const text = input.trim();
    if (!text || thinking) return;

    stopSpeech();

    const next = [...messages, { role: "user" as const, content: text }];
    setMessages(next);
    setInput("");
    setThinking(true);

    try {
      const npcRes = await fetch("/api/npc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: next,
          moodState: { mood, intensity },
        }),
      });

      const data: { reply: string; mood: Mood; intensity: number } =
        await npcRes.json();

      setMessages((m) => [...m, { role: "assistant", content: data.reply }]);
      setMood(data.mood);
      setIntensity(data.intensity);

      setThinking(false);

      await speak(data.reply);
    } catch (e) {
      console.error(e);
      setThinking(false);
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content:
            "I’m here — something glitched on my end. Want to try again?",
        },
      ]);
    }
  }

  return (
    <div className="space-y-4">
      <CharacterScene
        mood={mood}
        intensity={intensity}
        thinking={thinking}
        talking={talking}
      />

      <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm">
        <span className="text-white/70">Mood</span>
        <span className="rounded-full bg-white/10 px-3 py-1 text-white/85">
          {mood} · {(intensity * 100).toFixed(0)}%
        </span>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="max-h-64 space-y-2 overflow-auto pr-2 text-sm">
          {messages.map((m, i) => (
            <div
              key={i}
              className={m.role === "user" ? "text-right" : "text-left"}
            >
              <span className="inline-block max-w-[85%] rounded-xl bg-black/30 px-3 py-2 text-white/90">
                {m.content}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-4 flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            className="flex-1 rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-white outline-none"
            placeholder="Talk to the blob…"
          />
          <button
            onClick={send}
            disabled={thinking}
            className="rounded-xl bg-white px-4 py-2 font-semibold text-black disabled:opacity-60"
          >
            {thinking ? "Thinking…" : "Send"}
          </button>
        </div>

        <div className="mt-2 text-xs text-white/50">
          {talking ? "Blob is speaking…" : thinking ? "Blob is thinking…" : " "}
        </div>
      </div>
    </div>
  );
}
