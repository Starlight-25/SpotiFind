import HeartButton from "@/components/HeartButton";
import type { FavouriteItem } from "@/lib/music-types";

interface TrackRowProps {
  rank: number;
  name: string;
  duration?: string;
  playcount?: string;
  favouriteItem?: Omit<FavouriteItem, "addedAt">;
}

function formatDuration(seconds: string): string | null {
  const n = Number(seconds);
  if (!n) return null;
  return `${Math.floor(n / 60)}:${String(Math.floor(n % 60)).padStart(2, "0")}`;
}

export default function TrackRow({ rank, name, duration, playcount, favouriteItem }: TrackRowProps) {
  const time = duration ? formatDuration(duration) : null;
  const plays = playcount ? Number(playcount).toLocaleString("fr-FR") : null;
  return (
    <div className="flex items-center gap-4 py-3 border-b border-border last:border-0">
      <span className="w-6 text-right text-sm text-muted flex-shrink-0 tabular-nums">{rank}</span>
      <span className="flex-1 text-sm font-medium text-foreground truncate">{name}</span>
      {plays && (
        <span className="text-xs text-muted flex-shrink-0 tabular-nums">{plays} plays</span>
      )}
      {time && (
        <span className="text-xs text-muted flex-shrink-0 tabular-nums">{time}</span>
      )}
      {favouriteItem && <HeartButton {...favouriteItem} />}
    </div>
  );
}
