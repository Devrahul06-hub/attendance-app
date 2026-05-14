export function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const dim = size === 'sm' ? 28 : size === 'lg' ? 44 : 34;
  const text = size === 'sm' ? 'text-base' : size === 'lg' ? 'text-2xl' : 'text-lg';

  return (
    <div className="flex items-center gap-2.5">
      <div
        className="rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white font-bold shadow-sm"
        style={{ width: dim, height: dim }}
      >
        <svg width={dim * 0.55} height={dim * 0.55} viewBox="0 0 24 24" fill="none">
          <path
            d="M12 2 L4 6 L4 12 C4 16.5 7.5 20.5 12 22 C16.5 20.5 20 16.5 20 12 L20 6 Z"
            stroke="white"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path d="M8 12 L11 15 L16 9" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <span className={`font-bold tracking-tight ${text}`}>PunchPilot</span>
    </div>
  );
}
