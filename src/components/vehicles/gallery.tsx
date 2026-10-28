"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";
import { cn } from "@/lib/format";

type Img = { id: string; url: string; alt: string };

export function Gallery({ images, title }: { images: Img[]; title: string }) {
  const [index, setIndex] = useState(0);
  const [full, setFull] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const fullTrackRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const count = images.length;

  const scrollTo = useCallback((i: number, track: HTMLDivElement | null, smooth = true) => {
    if (!track) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    track.scrollTo({ left: i * track.clientWidth, behavior: smooth && !reduce ? "smooth" : "auto" });
  }, []);

  const go = useCallback(
    (i: number) => {
      const next = (i + count) % count;
      setIndex(next);
      scrollTo(next, full ? fullTrackRef.current : trackRef.current);
    },
    [count, full, scrollTo],
  );

  // Atualiza o índice quando o utilizador faz swipe (scroll-snap nativo)
  const onScroll = (track: HTMLDivElement) => {
    const i = Math.round(track.scrollLeft / track.clientWidth);
    if (i !== index) setIndex(i);
  };

  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (full && !d.open) {
      d.showModal();
      requestAnimationFrame(() => scrollTo(index, fullTrackRef.current, false));
    }
    if (!full && d.open) d.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [full]);

  const closeFull = () => {
    setFull(false);
    requestAnimationFrame(() => scrollTo(index, trackRef.current, false));
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      go(index + 1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      go(index - 1);
    }
  };

  if (!count) {
    return <div className="card tick-grid grid aspect-[3/2] place-items-center text-muted">Sem fotografias</div>;
  }

  const nav = (dark = false) =>
    count > 1 ? (
      <>
        <button type="button" onClick={() => go(index - 1)} aria-label="Fotografia anterior" className={cn("absolute left-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border transition-colors duration-150", dark ? "border-white/20 bg-white/10 text-white hover:bg-white/20" : "border-line bg-surface/90 hover:bg-surface")}>
          <ChevronLeft className="h-5 w-5" aria-hidden="true" />
        </button>
        <button type="button" onClick={() => go(index + 1)} aria-label="Fotografia seguinte" className={cn("absolute right-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border transition-colors duration-150", dark ? "border-white/20 bg-white/10 text-white hover:bg-white/20" : "border-line bg-surface/90 hover:bg-surface")}>
          <ChevronRight className="h-5 w-5" aria-hidden="true" />
        </button>
      </>
    ) : null;

  return (
    <section aria-roledescription="carrossel" aria-label={`Fotografias de ${title}`} onKeyDown={onKey}>
      <div className="card relative overflow-hidden">
        <div
          ref={trackRef}
          onScroll={(e) => onScroll(e.currentTarget)}
          className="flex aspect-[3/2] snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          tabIndex={0}
          aria-label="Use as setas do teclado para mudar de fotografia"
        >
          {images.map((img, i) => (
            <div key={img.id} className="relative h-full w-full shrink-0 snap-center" aria-roledescription="diapositivo" aria-label={`${i + 1} de ${count}`}>
              <Image
                src={img.url}
                alt={img.alt}
                fill
                preload={i === 0}
                loading={i === 0 ? "eager" : "lazy"}
                sizes="(min-width: 1024px) 60vw, 100vw"
                className="object-cover"
              />
            </div>
          ))}
        </div>
        {nav()}
        <div className="absolute left-3 top-3 flex gap-1.5">
          <span className="badge badge-dark num">{index + 1}/{count}</span>
          <span className="badge badge-neutral">Imagem ilustrativa</span>
        </div>
        <button type="button" onClick={() => setFull(true)} className="absolute bottom-3 right-3 inline-flex min-h-11 items-center gap-2 rounded-xl border border-line bg-surface/90 px-3 text-sm font-medium hover:bg-surface" aria-label="Ver fotografias em ecrã inteiro">
          <Expand className="h-4 w-4" aria-hidden="true" /> Ecrã inteiro
        </button>
      </div>
      {count > 1 && (
        <ul className="mt-3 grid grid-cols-5 gap-2 sm:grid-cols-6" aria-label="Miniaturas">
          {images.map((img, i) => (
            <li key={img.id}>
              <button
                type="button"
                onClick={() => go(i)}
                aria-label={`Ver fotografia ${i + 1}`}
                aria-current={i === index ? "true" : undefined}
                className={cn("relative block aspect-[3/2] w-full overflow-hidden rounded-[10px] border-2 transition-colors duration-150", i === index ? "border-ink" : "border-transparent opacity-80 hover:opacity-100")}
              >
                <Image src={img.url} alt="" fill sizes="120px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <dialog ref={dialogRef} onClose={closeFull} onKeyDown={onKey} aria-label={`Fotografias de ${title} em ecrã inteiro`} className="m-0 h-dvh max-h-none w-full max-w-none bg-ink p-0 text-white backdrop:bg-ink">
        <div className="relative flex h-full flex-col">
          <div className="flex items-center justify-between px-4 py-3">
            <p className="num text-sm">{index + 1} / {count} · {images[index]?.alt}</p>
            <button type="button" onClick={closeFull} className="grid h-11 w-11 place-items-center rounded-full bg-white/10 hover:bg-white/20" aria-label="Fechar ecrã inteiro">
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
          <div className="relative flex-1">
            <div ref={fullTrackRef} onScroll={(e) => onScroll(e.currentTarget)} className="flex h-full snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {images.map((img) => (
                <div key={img.id} className="relative h-full w-full shrink-0 snap-center">
                  {full && <Image src={img.url} alt={img.alt} fill sizes="100vw" className="object-contain" />}
                </div>
              ))}
            </div>
            {nav(true)}
          </div>
        </div>
      </dialog>
    </section>
  );
}
