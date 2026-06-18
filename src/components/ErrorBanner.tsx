interface ErrorBannerProps {
  message: string;
  details?: string;
}

export default function ErrorBanner({ message, details }: ErrorBannerProps) {
  return (
    <div
      role="alert"
      className="w-full rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 flex items-start gap-3"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-red-400 flex-shrink-0 mt-0.5"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      <div className="min-w-0">
        <p className="text-sm font-medium text-red-400">{message}</p>
        {details && (
          <p className="text-xs text-red-400/70 mt-0.5">{details}</p>
        )}
      </div>
    </div>
  );
}
