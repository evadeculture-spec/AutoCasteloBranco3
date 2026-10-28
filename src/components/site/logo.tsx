import Link from "next/link";

export function LogoMark({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <rect width="64" height="64" rx="14" fill="#111214" />
      <rect x="14" y="14" width="16" height="16" rx="3" fill="#ff5a1f" />
      <rect x="34" y="14" width="16" height="16" rx="3" fill="#fff" />
      <rect x="14" y="34" width="16" height="16" rx="3" fill="#fff" />
      <rect x="34" y="34" width="16" height="16" rx="3" fill="#fff" opacity=".35" />
    </svg>
  );
}

export function Logo({ name }: { name: string }) {
  return (
    <Link href="/" className="flex min-h-11 items-center gap-2.5 rounded-lg" aria-label={`${name} — página inicial`}>
      <LogoMark />
      <span className="text-[17px] font-semibold tracking-[-0.04em]">
        AutoCastelo<span className="text-muted">Branco</span>
      </span>
    </Link>
  );
}
