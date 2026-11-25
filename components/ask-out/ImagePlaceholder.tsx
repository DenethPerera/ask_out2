interface ImagePlaceholderProps {
  label: string;
  caption: string;
  className?: string;
}

export default function ImagePlaceholder({
  label,
  caption,
  className = "",
}: ImagePlaceholderProps) {
  return (
    <div
      role="img"
      aria-label={`${label} placeholder`}
      className={`flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-rose/40 bg-gradient-to-br from-blush-soft to-blush p-6 text-center ${className}`}
    >
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        className="h-10 w-10 text-rose"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <circle cx="9" cy="10.5" r="1.75" />
        <path d="M21 16l-5.5-5-4 4-2-2L3 18" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <p className="font-display text-lg font-semibold text-wine">{label}</p>
      <p className="max-w-[220px] text-xs text-charcoal-soft sm:text-sm">{caption}</p>
    </div>
  );
}
