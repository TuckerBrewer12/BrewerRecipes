"use client";

import Link from "next/link";
import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { ImagePlusIcon, XIcon } from "lucide-react";

import { createPost, type PostState } from "@/app/actions/posts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { resizeImage } from "@/lib/resize-image";

type RecipeOption = { id: string; title: string };

export function ShareForm({ recipes, preselect }: { recipes: RecipeOption[]; preselect?: string }) {
  const [photos, setPhotos] = useState<{ file: File; url: string }[]>([]);
  const [chosen, setChosen] = useState<RecipeOption[]>(() => recipes.filter((r) => r.id === preselect));
  const [query, setQuery] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => () => photos.forEach((p) => URL.revokeObjectURL(p.url)), [photos]);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return recipes.filter((r) => r.title.toLowerCase().includes(q) && !chosen.some((c) => c.id === r.id)).slice(0, 6);
  }, [query, recipes, chosen]);

  const [state, action, pending] = useActionState<PostState, FormData>(async (prev, formData) => {
    formData.delete("photos");
    photos.forEach((p) => formData.append("photos", p.file));
    chosen.forEach((r) => formData.append("recipeIds", r.id));
    return createPost(prev, formData);
  }, {});

  async function addPhotos(files: FileList | null) {
    if (!files?.length) return;
    const resized = await Promise.all([...files].map((f) => resizeImage(f, 1800, 0.82)));
    setPhotos((p) => [...p, ...resized.map((file) => ({ file, url: URL.createObjectURL(file) }))].slice(0, 10));
    if (fileInput.current) fileInput.current.value = "";
  }

  return (
    <form action={action} className="flex flex-col gap-6">
      <div className="grid grid-cols-3 gap-2">
        {photos.map((p, i) => (
          <div key={p.url} className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.url} alt={`Photo ${i + 1}`} className="aspect-square w-full rounded-md object-cover" />
            <Button
              type="button"
              variant="secondary"
              size="icon-sm"
              aria-label={`Remove photo ${i + 1}`}
              className="absolute top-1 right-1"
              onClick={() => setPhotos((ps) => ps.filter((_, j) => j !== i))}
            >
              <XIcon />
            </Button>
          </div>
        ))}
        {photos.length < 10 && (
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1.5 rounded-md border border-dashed border-zinc-300 text-sm text-muted-foreground hover:text-foreground"
          >
            <ImagePlusIcon className="size-5" />
            Add photo
          </button>
        )}
      </div>
      <input ref={fileInput} type="file" accept="image/*" multiple className="hidden" onChange={(e) => addPhotos(e.target.files)} />

      <div className="grid gap-2">
        <Label htmlFor="caption">Caption</Label>
        <Textarea id="caption" name="caption" rows={3} maxLength={2000} placeholder="What did you make, and how did it go?" />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="recipe-search">What did you make?</Label>
        <div className="flex min-h-10 flex-wrap items-center gap-1.5 rounded-md border px-2 py-1.5 shadow-xs focus-within:ring-[3px] focus-within:ring-ring/50">
          {chosen.map((r) => (
            <Badge key={r.id} className="gap-1 pr-1">
              {r.title}
              <button
                type="button"
                aria-label={`Remove ${r.title}`}
                onClick={() => setChosen((c) => c.filter((x) => x.id !== r.id))}
                className="cursor-pointer text-muted-foreground hover:text-foreground"
              >
                <XIcon className="size-3" />
              </button>
            </Badge>
          ))}
          <input
            id="recipe-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={chosen.length ? "Add another…" : "Search recipes…"}
            className="min-w-32 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            autoComplete="off"
          />
        </div>
        {matches.length > 0 && (
          <ul className="rounded-md border p-1 shadow-sm">
            {matches.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  className="w-full cursor-pointer rounded-sm px-2 py-2 text-left text-sm hover:bg-accent"
                  onClick={() => {
                    setChosen((c) => [...c, r]);
                    setQuery("");
                  }}
                >
                  {r.title}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Label className="items-start font-normal leading-snug">
        <Checkbox name="logCook" defaultChecked className="mt-0.5" />
        <span>
          <span className="font-medium">Log this as a cook</span>
          <span className="block text-muted-foreground">Adds it to each recipe’s cook log.</span>
        </span>
      </Label>

      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}

      <div className="flex justify-end gap-2 border-t pt-5">
        <Button asChild variant="ghost">
          <Link href="/">Cancel</Link>
        </Button>
        <Button type="submit" disabled={pending || photos.length === 0}>
          {pending ? "Posting…" : "Post"}
        </Button>
      </div>
    </form>
  );
}
