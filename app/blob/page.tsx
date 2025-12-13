import EmotionalSupportBlob from "../components/EmotionalSupportBlob";

export default function BlobPage() {
  return (
    <div className="min-h-screen bg-black px-6 py-12 text-white">
      <div className="mx-auto max-w-3xl space-y-6">
        <h1 className="text-3xl font-bold">Emotional Support Blob</h1>
        <p className="text-white/70">
          A gentle 3D companion that listens, responds with empathy, and speaks
          back.
        </p>
        <EmotionalSupportBlob />
      </div>
    </div>
  );
}
