"use client";

import { useEffect, useRef, useState } from "react";
import CharacterScene from "./CharacterScene";
import { createAudioMeter } from "../lib/audioMeter";

type Role = "user" | "assistant";
type Msg = { role: Role; content: string };

export type Mood = "calm" | "supportive" | "sad" | "encouraging";

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

const MOOD_LABEL: Record<Mood, string> = {
  calm: "Calm",
  supportive: "Supportive",
  sad: "Sad",
  encouraging: "Encouraging",
};

const MOOD_BADGE: Record<Mood, string> = {
  calm: "bg-violet-400/15 text-violet-200 ring-violet-300/20",
  supportive: "bg-emerald-400/15 text-emerald-200 ring-emerald-300/20",
  sad: "bg-sky-400/15 text-sky-200 ring-sky-300/20",
  encouraging: "bg-amber-400/15 text-amber-200 ring-amber-300/20",
};

const SENTIMENT_LABEL: Record<Sentiment, string> = {
  positive: "Positive",
  neutral: "Neutral",
  negative: "Negative",
};

const SENTIMENT_BADGE: Record<Sentiment, string> = {
  positive: "bg-emerald-400/15 text-emerald-200 ring-emerald-300/20",
  neutral: "bg-slate-400/15 text-slate-200 ring-slate-300/20",
  negative: "bg-rose-400/15 text-rose-200 ring-rose-300/20",
};

const EMOJI_EMOTION: Record<Emotion, string> = {
  joy: "😊",
  sadness: "😔",
  anger: "😤",
  fear: "😟",
  stress: "😣",
  loneliness: "🥺",
  gratitude: "🙏",
  hope: "✨",
  neutral: "🙂",
};

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

  // sentiment analysis outputs
  const [sentiment, setSentiment] = useState<Sentiment>("neutral");
  const [emotion, setEmotion] = useState<Emotion>("neutral");
  const [confidence, setConfidence] = useState(0.5);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);

  const meterRef = useRef<ReturnType<typeof createAudioMeter> | null>(null);
  const rafRef = useRef<number | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  function cleanupAudioUrl() {
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
  }

  function stopSpeech() {
    const a = audioRef.current;
    if (a) {
      a.pause();
      a.currentTime = 0;
    }
    setTalking(false);
    setAudioLevel(0);
    cleanupAudioUrl();

    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }

  useEffect(() => {
    return () => {
      stopSpeech();
      meterRef.current?.close();
      meterRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // attach audio meter once to the single audio element
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;

    meterRef.current = createAudioMeter(a);

    const loop = () => {
      if (meterRef.current) setAudioLevel(meterRef.current.getLevel());
      rafRef.current = requestAnimationFrame(loop);
    };

    const onPlay = async () => {
      await meterRef.current?.resume();
      setTalking(true);
      loop();
    };

    const onPause = () => {
      setTalking(false);
      setAudioLevel(0);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };

    const onEnded = () => {
      setTalking(false);
      setAudioLevel(0);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      cleanupAudioUrl();
    };

    a.addEventListener("play", onPlay);
    a.addEventListener("pause", onPause);
    a.addEventListener("ended", onEnded);

    return () => {
      a.removeEventListener("play", onPlay);
      a.removeEventListener("pause", onPause);
      a.removeEventListener("ended", onEnded);
    };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function speak(text: string) {
    stopSpeech();

    const res = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    audioUrlRef.current = url;

    const a = audioRef.current;
    if (!a) return;

    a.src = url;
    a.currentTime = 0;
    await a.play();
  }

  async function send() {
    const text = input.trim();
    if (!text || thinking) return;

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

      const data: {
        reply: string;
        mood: Mood;
        intensity: number;
        sentiment: Sentiment;
        emotion: Emotion;
        confidence: number;
      } = await npcRes.json();

      setMessages((m) => [...m, { role: "assistant", content: data.reply }]);

      setMood(data.mood);
      setIntensity(data.intensity);

      setSentiment(data.sentiment);
      setEmotion(data.emotion);
      setConfidence(data.confidence);

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
      <audio ref={audioRef} className="hidden" playsInline />

      <CharacterScene
        mood={mood}
        intensity={intensity}
        thinking={thinking}
        talking={talking}
        audioLevel={audioLevel}
      />

      {/* Mood row */}
      <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="text-sm text-white/70">Blob Mood</span>
          <span
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm ring-1 ${MOOD_BADGE[mood]}`}
          >
            <span className="font-medium">{MOOD_LABEL[mood]}</span>
            <span className="text-white/60">·</span>
            <span className="text-white/80">
              {Math.round(intensity * 100)}%
            </span>
          </span>
        </div>

        <div className="text-xs text-white/50">
          {talking ? "Speaking…" : thinking ? "Thinking…" : "Ready"}
        </div>
      </div>

      {/* sentiment analysis row */}
      <div className="grid gap-2 sm:grid-cols-3">
        <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3">
          <span className="text-sm text-white/70">Sentiment</span>
          <span
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm ring-1 ${SENTIMENT_BADGE[sentiment]}`}
          >
            {SENTIMENT_LABEL[sentiment]}
          </span>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3">
          <span className="text-sm text-white/70">Emotion</span>
          <span className="text-sm text-white/85">
            {EMOJI_EMOTION[emotion]}{" "}
            <span className="capitalize">{emotion}</span>
          </span>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3">
          <span className="text-sm text-white/70">Confidence</span>
          <span className="text-sm text-white/85">
            {Math.round(confidence * 100)}%
          </span>
        </div>
      </div>

      {/* Chat UI */}
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
          <div ref={bottomRef} />
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
