"use client";

const GENRES = ["Pop", "Rock", "Hip-Hop", "Electronic", "Jazz", "Classical", "R&B", "Metal"] as const;
export type Genre = (typeof GENRES)[number];

interface Props {
  active: Genre;
  onChange: (genre: Genre) => void;
}

export default function GenreChips({ active, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {GENRES.map(genre => (
        <button
          key={genre}
          onClick={() => onChange(genre)}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
            active === genre
              ? "bg-spotify text-black"
              : "bg-border text-muted hover:text-foreground hover:bg-surface"
          }`}
        >
          {genre}
        </button>
      ))}
    </div>
  );
}
