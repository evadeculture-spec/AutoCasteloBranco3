export function DemoBar({ text }: { text: string }) {
  if (!text) return null;
  return (
    <div className="bg-ink text-white">
      <p className="container-page flex min-h-8 items-center justify-center gap-2 py-1.5 text-center text-[12px] leading-tight">
        <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full bg-signal" />
        <span className="num tracking-tight">{text}</span>
      </p>
    </div>
  );
}
