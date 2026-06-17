interface TrackRowProps {
  rank: number;
  name: string;
  duration?: string;
}

function formatDuration(seconds: string): string | null {
  const n = Number(seconds);
  if (!n) return null;
  return `${Math.floor(n / 60)}:${String(n % 60).padStart(2, "0")}`;
}

export default function TrackRow({ rank, name, duration }: TrackRowProps) {
  const time = duration ? formatDuration(duration) : null;
  return (
    <div className="flex items-center gap-4 py-3 border-b border-border last:border-0">
      <span className="w-6 text-right text-sm text-muted flex-shrink-0 tabular-nums">{rank}</span>
      <span className="flex-1 text-sm font-medium text-foreground truncate">{name}</span>
      {time && (
        <span className="text-xs text-muted flex-shrink-0 tabular-nums">{time}</span>
      )}
    </div>
  );
}
