export function Spinner({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className="animate-spin"
      aria-label="Loading"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.2" strokeWidth="3" fill="none" />
      <path
        d="M22 12 A10 10 0 0 0 12 2"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center py-20 text-brand-600">
      <Spinner size={32} />
    </div>
  );
}
