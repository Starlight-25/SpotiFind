"use client";

interface Props {
  count: number;
  onDecision: (importThem: boolean) => void;
}

export default function ImportFavouritesModal({ count, onDecision }: Props) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm p-8 rounded-xl border border-border bg-surface flex flex-col gap-4">
        <h2 className="text-xl font-bold">Favoris locaux détectés</h2>
        <p className="text-muted text-sm">
          Tu as {count} favori{count > 1 ? "s" : ""} sauvegardé
          {count > 1 ? "s" : ""} sur cet appareil. Veux-tu les importer dans
          ton compte ?
        </p>
        <div className="flex gap-3 mt-2">
          <button
            onClick={() => onDecision(true)}
            className="flex-1 py-2 rounded-lg bg-spotify text-white font-medium hover:opacity-90 transition-opacity"
          >
            Importer
          </button>
          <button
            onClick={() => onDecision(false)}
            className="flex-1 py-2 rounded-lg border border-border text-muted hover:text-foreground transition-colors"
          >
            Ignorer
          </button>
        </div>
      </div>
    </div>
  );
}
