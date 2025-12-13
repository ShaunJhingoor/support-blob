// app/lib/audioMeter.ts
export function createAudioMeter(audioEl: HTMLAudioElement) {
  const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
  const ctx = new AudioCtx();

  const src = ctx.createMediaElementSource(audioEl);
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 512;

  src.connect(analyser);
  analyser.connect(ctx.destination);

  const data = new Uint8Array(analyser.frequencyBinCount);

  return {
    resume: async () => {
      if (ctx.state !== "running") await ctx.resume();
    },
    // returns 0..1 (rough loudness)
    getLevel: () => {
      analyser.getByteTimeDomainData(data);

      // RMS
      let sum = 0;
      for (let i = 0; i < data.length; i++) {
        const v = (data[i] - 128) / 128;
        sum += v * v;
      }
      const rms = Math.sqrt(sum / data.length);

      // boost + clamp
      return Math.max(0, Math.min(1, rms * 2.4));
    },
    close: () => ctx.close(),
  };
}
