"use client";

import { useState } from "react";
import { DownloadIcon, ZoomInIcon, ZoomOutIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const ZOOMS = [1, 1.5, 2, 3];

export function OriginalCards({ title, images }: { title: string; images: { path: string; url: string }[] }) {
  const [open, setOpen] = useState<number | null>(null);
  const [zoom, setZoom] = useState(0);
  if (images.length === 0) return null;
  const current = open == null ? null : images[open];
  const label = (i: number) => (images.length === 2 ? (i === 0 ? "Front" : "Back") : `Page ${i + 1}`);

  return (
    <section className="print:hidden">
      <h2 className="mb-3 text-[0.8125rem] font-medium tracking-wide text-muted-foreground">Original card</h2>
      <div className="flex flex-wrap gap-2">
        {images.map((img, i) => (
          <button
            key={img.path}
            type="button"
            onClick={() => {
              setOpen(i);
              setZoom(0);
            }}
            className="cursor-pointer overflow-hidden rounded-md border transition-opacity hover:opacity-80 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
            aria-label={`View original card, ${label(i).toLowerCase()}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img.url} alt="" className="aspect-[4/3] w-24 object-cover" />
          </button>
        ))}
      </div>

      <Dialog open={open != null} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="max-h-[92svh] gap-0 overflow-hidden p-0 sm:max-w-4xl" showCloseButton={false}>
          <div className="flex items-center gap-2 border-b py-2 pr-2 pl-5">
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-[0.9375rem]">Original card · {open != null && label(open)}</DialogTitle>
              <DialogDescription className="truncate">{title}</DialogDescription>
            </div>
            <Button variant="outline" size="icon-sm" aria-label="Zoom out" disabled={zoom === 0} onClick={() => setZoom((z) => z - 1)}>
              <ZoomOutIcon />
            </Button>
            <span className="w-12 text-center text-[0.8125rem] text-muted-foreground tabular-nums">{ZOOMS[zoom] * 100}%</span>
            <Button
              variant="outline"
              size="icon-sm"
              aria-label="Zoom in"
              disabled={zoom === ZOOMS.length - 1}
              onClick={() => setZoom((z) => z + 1)}
            >
              <ZoomInIcon />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setOpen(null)}>
              Close
            </Button>
          </div>
          <div className="max-h-[70svh] overflow-auto bg-zinc-50">
            {current && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={current.url}
                alt={`Original recipe card for ${title}`}
                className="mx-auto block max-w-none origin-top-left"
                style={{ width: `${ZOOMS[zoom] * 100}%` }}
              />
            )}
          </div>
          <div className="flex items-center gap-2 border-t px-5 py-3">
            {images.map((img, i) => (
              <button
                key={img.path}
                type="button"
                aria-label={label(i)}
                aria-pressed={i === open}
                onClick={() => setOpen(i)}
                className={cn(
                  "cursor-pointer overflow-hidden rounded-md border",
                  i === open ? "ring-2 ring-primary" : "opacity-70 hover:opacity-100",
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} alt="" className="aspect-[4/3] w-16 object-cover" />
              </button>
            ))}
            {current && (
              <Button asChild variant="outline" size="sm" className="ml-auto">
                <a href={current.url} download>
                  <DownloadIcon />
                  Download
                </a>
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
