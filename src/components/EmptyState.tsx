interface EmptyStateProps {
  title: string;
  subtitle?: string;
}

function SadIllustration() {
  return (
    <svg
      width="120"
      height="120"
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Vinyl record */}
      <circle cx="60" cy="68" r="42" fill="#e5e5e0" />
      <circle cx="60" cy="68" r="30" fill="#d4d4ce" />
      <circle cx="60" cy="68" r="18" fill="#e5e5e0" />
      <circle cx="60" cy="68" r="5" fill="#6b6b6b" />

      {/* Sad face on the record */}
      {/* Eyes */}
      <circle cx="52" cy="62" r="2.5" fill="#6b6b6b" />
      <circle cx="68" cy="62" r="2.5" fill="#6b6b6b" />
      {/* Sad mouth */}
      <path
        d="M52 74 Q60 69 68 74"
        stroke="#6b6b6b"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      {/* Eyebrows sad */}
      <path d="M49 58 Q52 56 55 58" stroke="#6b6b6b" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <path d="M65 58 Q68 56 71 58" stroke="#6b6b6b" strokeWidth="1.5" strokeLinecap="round" fill="none" />

      {/* Tears */}
      <ellipse cx="51" cy="67" rx="1.2" ry="2" fill="#a0c4ff" opacity="0.7" />
      <ellipse cx="69" cy="67" rx="1.2" ry="2" fill="#a0c4ff" opacity="0.7" />

      {/* Musical note floating away */}
      <g opacity="0.4">
        <path d="M92 20 L92 30 Q96 28 96 32 Q96 36 92 36 Q88 36 88 32 Q88 28 92 28 L92 20 L100 18 L100 26 L92 28" fill="#6b6b6b" />
      </g>
      <g opacity="0.25">
        <path d="M104 32 L104 39 Q107 37.5 107 40.5 Q107 43.5 104 43.5 Q101 43.5 101 40.5 Q101 37.5 104 37.5 L104 32 L110 30.5 L110 37 L104 38.5" fill="#6b6b6b" />
      </g>

      {/* Headphone arc on top */}
      <path
        d="M30 55 Q30 22 60 22 Q90 22 90 55"
        stroke="#6b6b6b"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      <rect x="24" y="52" width="10" height="16" rx="4" fill="#6b6b6b" />
      <rect x="86" y="52" width="10" height="16" rx="4" fill="#6b6b6b" />
    </svg>
  );
}

export default function EmptyState({ title, subtitle }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
      <SadIllustration />
      <div>
        <p className="text-base font-semibold text-foreground">{title}</p>
        {subtitle && (
          <p className="text-sm text-muted mt-1 max-w-xs mx-auto">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
