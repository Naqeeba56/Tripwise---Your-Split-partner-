'use client';

/**
 * Lightweight inline spinner used for API calls / loading states.
 * Pure CSS — no external deps, respects the current text colour via currentColor.
 */
export default function Spinner({ size = 18, label = '' }) {
  const border = Math.max(2, Math.round(size / 4.5));
  return (
    <span className="inline-flex items-center gap-2" role="status" aria-label={label || 'Loading'}>
      <span
        aria-hidden="true"
        className="animate-spin rounded-full"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderWidth: `${border}px`,
          borderColor: 'currentColor transparent currentColor transparent',
        }}
      />
      {label ? (
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</span>
      ) : null}
    </span>
  );
}