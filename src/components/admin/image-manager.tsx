"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ArrowLeft, ArrowRight, GripVertical, ImagePlus, Star, Trash2 } from "lucide-react";
import { deleteImages, reorderImages, setCoverImage, updateImageAlt } from "@/app/admin/actions/vehicles";
import { resizeImage } from "@/lib/image-resize";
import { cn } from "@/lib/format";
import { toast } from "@/components/ui/toast";

type Img = { id: string; url: string; alt: string; isCover: boolean; position: number };

export function ImageManager({ vehicleId, images: initial }: { vehicleId: string; images: Img[] }) {
  const router = useRouter();
  const [images, setImages] = useState(() => [...initial].sort((a, b) => a.position - b.position));
  const [uploading, setUploading] = useState<{ done: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [, start] = useTransition();

  // Sincroniza quando o servidor devolve uma lista nova (após router.refresh)
  const initialKey = initial.map((i) => `${i.id}:${i.position}:${i.isCover}`).join("|");
  const [lastKey, setLastKey] = useState(initialKey);
  if (initialKey !== lastKey) {
    setLastKey(initialKey);
    setImages([...initial].sort((a, b) => a.position - b.position));
  }

  const persistOrder = (list: Img[]) => {
    setImages(list);
    start(async () => {
      await reorderImages(vehicleId, list.map((i) => i.id));
      toast("Ordem guardada");
      router.refresh();
    });
  };

  const move = (id: string, delta: number) => {
    const i = images.findIndex((x) => x.id === id);
    const j = i + delta;
    if (i < 0 || j < 0 || j >= images.length) return;
    const list = [...images];
    const [item] = list.splice(i, 1);
    list.splice(j, 0, item!);
    persistOrder(list);
  };

  const onDrop = (targetId: string) => {
    if (!dragId || dragId === targetId) return;
    const list = [...images];
    const from = list.findIndex((x) => x.id === dragId);
    const to = list.findIndex((x) => x.id === targetId);
    const [item] = list.splice(from, 1);
    list.splice(to, 0, item!);
    setDragId(null);
    setOverId(null);
    persistOrder(list);
  };

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    setError(null);
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
    setUploading({ done: 0, total: list.length });
    for (const [n, f] of list.entries()) {
      try {
        const { blob, width, height } = await resizeImage(f, 2000, 0.85);
        const fd = new FormData();
        fd.append("file", blob, f.name.replace(/\.\w+$/, "") + (blob.type === "image/webp" ? ".webp" : ".jpg"));
        fd.append("width", String(width));
        fd.append("height", String(height));
        const res = await fetch(`/api/admin/vehicles/${vehicleId}/images`, { method: "POST", body: fd });
        const data = (await res.json()) as { image?: Img; error?: string };
        if (!res.ok || !data.image) throw new Error(data.error ?? "Falha no envio");
        setImages((prev) => [...prev, data.image!]);
      } catch (e) {
        setError(`${f.name}: ${e instanceof Error ? e.message : "erro"}`);
      }
      setUploading({ done: n + 1, total: list.length });
    }
    setUploading(null);
    toast("Fotografias enviadas");
    router.refresh();
  };

  return (
    <section id="fotos" className="card scroll-mt-6 p-5 md:p-6" aria-labelledby="fotos-t">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="fotos-t" className="text-lg">Fotografias <span className="num text-sm font-normal text-muted">{images.length}</span></h2>
          <p className="text-sm text-muted">Arraste para reordenar (ou use as setas). A estrela define a capa.</p>
        </div>
        <label className={cn("btn btn-primary cursor-pointer", uploading && "pointer-events-none opacity-60")}>
          <ImagePlus className="h-4 w-4" aria-hidden="true" />
          {uploading ? `A enviar ${uploading.done}/${uploading.total}…` : "Adicionar fotografias"}
          <input type="file" accept="image/*" multiple className="sr-only" onChange={(e) => { void upload(e.target.files); e.target.value = ""; }} />
        </label>
      </div>
      {error && <p role="alert" className="field-error mb-3">{error}</p>}
      {uploading && (
        <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-subtle" role="progressbar" aria-valuemin={0} aria-valuemax={uploading.total} aria-valuenow={uploading.done} aria-label="Progresso do envio">
          <div className="h-full bg-signal transition-[width] duration-200" style={{ width: `${(uploading.done / uploading.total) * 100}%` }} />
        </div>
      )}
      {images.length === 0 ? (
        <label
          className="tick-grid flex min-h-40 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-line-strong text-center"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); void upload(e.dataTransfer.files); }}
        >
          <ImagePlus className="h-6 w-6" aria-hidden="true" />
          <span className="font-medium">Arraste fotografias para aqui ou clique para escolher</span>
          <span className="text-xs text-muted">São redimensionadas automaticamente (máx. 2000 px)</span>
          <input type="file" accept="image/*" multiple className="sr-only" onChange={(e) => void upload(e.target.files)} />
        </label>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
          {images.map((img, i) => (
            <li
              key={img.id}
              draggable
              onDragStart={() => setDragId(img.id)}
              onDragEnd={() => { setDragId(null); setOverId(null); }}
              onDragOver={(e) => { e.preventDefault(); setOverId(img.id); }}
              onDrop={(e) => { e.preventDefault(); onDrop(img.id); }}
              className={cn(
                "group overflow-hidden rounded-xl border bg-surface transition-[border-color,opacity] duration-150",
                img.isCover ? "border-signal" : "border-line",
                dragId === img.id && "opacity-40",
                overId === img.id && dragId !== img.id && "border-ink",
              )}
            >
              <div className="relative aspect-[3/2] cursor-grab bg-subtle active:cursor-grabbing">
                <Image src={img.url} alt={img.alt} fill sizes="300px" className="object-cover" draggable={false} />
                <span className="badge badge-dark num absolute left-2 top-2"><GripVertical className="h-3 w-3" aria-hidden="true" />{i + 1}</span>
                {img.isCover && <span className="badge badge-signal absolute right-2 top-2">Capa</span>}
              </div>
              <div className="flex items-center gap-1 border-t border-line p-1.5">
                <button type="button" className="grid h-9 w-9 place-items-center rounded-lg hover:bg-subtle disabled:opacity-30" disabled={i === 0} onClick={() => move(img.id, -1)} aria-label={`Mover fotografia ${i + 1} para a esquerda`}><ArrowLeft className="h-4 w-4" aria-hidden="true" /></button>
                <button type="button" className="grid h-9 w-9 place-items-center rounded-lg hover:bg-subtle disabled:opacity-30" disabled={i === images.length - 1} onClick={() => move(img.id, 1)} aria-label={`Mover fotografia ${i + 1} para a direita`}><ArrowRight className="h-4 w-4" aria-hidden="true" /></button>
                <button
                  type="button"
                  className="grid h-9 w-9 place-items-center rounded-lg hover:bg-subtle"
                  aria-pressed={img.isCover}
                  aria-label={`Usar fotografia ${i + 1} como capa`}
                  onClick={() => {
                    setImages((list) => list.map((x) => ({ ...x, isCover: x.id === img.id })));
                    start(async () => { await setCoverImage(vehicleId, img.id); toast("Capa atualizada"); router.refresh(); });
                  }}
                >
                  <Star className={cn("h-4 w-4", img.isCover ? "fill-signal stroke-signal-ink" : "")} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="ml-auto grid h-9 w-9 place-items-center rounded-lg text-danger hover:bg-danger-soft"
                  aria-label={`Apagar fotografia ${i + 1}`}
                  onClick={() => {
                    if (!confirm("Apagar esta fotografia?")) return;
                    setImages((list) => list.filter((x) => x.id !== img.id));
                    start(async () => { await deleteImages(vehicleId, [img.id]); toast("Fotografia apagada"); router.refresh(); });
                  }}
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
              <div className="border-t border-line p-1.5">
                <label className="sr-only" htmlFor={`alt-${img.id}`}>Texto alternativo da fotografia {i + 1}</label>
                <input
                  id={`alt-${img.id}`}
                  className="input !min-h-9 !py-1 text-xs"
                  defaultValue={img.alt}
                  placeholder="Texto alternativo"
                  onBlur={(e) => {
                    if (e.target.value !== img.alt) start(async () => { await updateImageAlt(vehicleId, img.id, e.target.value); toast("Texto alternativo guardado"); });
                  }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
