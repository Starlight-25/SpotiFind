interface TrackRowProps {
  rank: number;
  name: string;
  duration?: string;
  listeners?: string;
}

function formatDuration(seconds: string): string | null {
  const n = Number(seconds);
  if (!n) return null;
  return `${Math.floor(n / 60)}:${String(Math.floor(n % 60)).padStart(2, "0")}`;
}

export default function TrackRow({ rank, name, duration, listeners }: TrackRowProps) {
  const time = duration ? formatDuration(duration) : null;
  const plays = listeners ? Number(listeners).toLocaleString("fr-FR") : null;
  return (
    <div className="flex items-center gap-4 py-3 border-b border-border last:border-0">
      <span className="w-6 text-right text-sm text-muted flex-shrink-0 tabular-nums">{rank}</span>
      <span className="flex-1 text-sm font-medium text-foreground truncate">{name}</span>
      {plays && (
        <span className="text-xs text-muted flex-shrink-0 tabular-nums">{plays} auditeurs</span>
      )}
      {time && (
        <span className="text-xs text-muted flex-shrink-0 tabular-nums">{time}</span>
      )}
    </div>
  );
}
