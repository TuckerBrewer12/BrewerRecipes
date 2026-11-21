"use client";

import { useEffect, useRef, useState } from "react";
import { CameraIcon, ImagePlusIcon, InfoIcon, Loader2Icon, MicIcon, SquareIcon, XIcon } from "lucide-react";

import { RecipeEditor } from "@/components/recipe/editor";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { emptyDraft, type RecipeDraft } from "@/lib/recipe/draft";
import { resizeImage } from "@/lib/resize-image";

type Mode = "type" | "scan" | "voice";

function Notice({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div role="status" className="flex gap-3 rounded-xl border px-4 py-3.5 text-sm leading-relaxed">
      <InfoIcon className="mt-0.5 size-4 shrink-0" />
      <div>
        <p className="font-medium">{title}</p>
        {children && <div className="text-muted-foreground">{children}</div>}
      </div>
    </div>
  );
}

export function NewRecipe({ initialMode, people, me }: { initialMode: Mode; people: string[]; me: string }) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [draft, setDraft] = useState<RecipeDraft | null>(initialMode === "type" ? emptyDraft(me) : null);
  const [photos, setPhotos] = useState<{ file: File; url: string }[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const fileInput = useRef<HTMLInputElement>(null);
  const cameraInput = useRef<HTMLInputElement>(null);

  useEffect(() => () => photos.forEach((p) => URL.revokeObjectURL(p.url)), [photos]);

  const switchMode = (m: Mode) => {
    setMode(m);
    setError(null);
    if (m === "type" && !draft) setDraft(emptyDraft(me));
  };

  async function addPhotos(files: FileList | null) {
    if (!files?.length) return;
    const resized = await Promise.all([...files].map((f) => resizeImage(f)));
    setPhotos((p) => [...p, ...resized.map((file) => ({ file, url: URL.createObjectURL(file) }))].slice(0, 6));
  }

  async function readPhotos() {
    setBusy("Reading the recipe… this takes about 15 seconds.");
    setError(null);
    try {
      const body = new FormData();
      photos.forEach((p) => body.append("images", p.file));
      const res = await fetch("/api/scan", { method: "POST", body });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Something went wrong.");
      setDraft({ ...json.draft, ownerName: json.draft.ownerName || "" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(null);
    }
  }

  async function startRecording() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      chunks.current = [];
      rec.ondataavailable = (e) => e.data.size && chunks.current.push(e.data);
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunks.current, { type: rec.mimeType || "audio/webm" });
        setBusy("Writing it down…");
        try {
          const body = new FormData();
          body.append("audio", new File([blob], "recipe.webm", { type: blob.type }));
          const res = await fetch("/api/voice", { method: "POST", body });
          const json = await res.json();
          if (!res.ok) throw new Error(json.error ?? "Something went wrong.");
          setTranscript(json.transcript);
          setDraft({ ...json.draft, ownerName: json.draft.ownerName || me });
        } catch (e) {
          setError(e instanceof Error ? e.message : "Something went wrong.");
        } finally {
          setBusy(null);
        }
      };
      rec.start();
      recorder.current = rec;
      setRecording(true);
    } catch {
      setError("Couldn’t use the microphone. Check that the browser is allowed to use it.");
    }
  }

  function stopRecording() {
    recorder.current?.stop();
    setRecording(false);
  }

  const header = (
    <div className="flex flex-wrap items-end gap-4">
      <h1 className="flex-1 text-2xl font-semibold tracking-tight">{draft && mode === "scan" ? "Review recipe" : "Add a recipe"}</h1>
      {!draft || mode === "type" ? (
        <Tabs value={mode} onValueChange={(v) => switchMode(v as Mode)}>
          <TabsList aria-label="How to add it">
            <TabsTrigger value="type">Type it</TabsTrigger>
            <TabsTrigger value="scan">
              <CameraIcon />
              Scan
            </TabsTrigger>
            <TabsTrigger value="voice">
              <MicIcon />
              Read aloud
            </TabsTrigger>
          </TabsList>
        </Tabs>
      ) : null}
    </div>
  );

  if (draft) {
    const notice =
      mode === "scan" && photos.length ? (
        <Notice title={`Read from ${photos.length} ${photos.length === 1 ? "photo" : "photos"}`}>
          Look it over before saving. Anything marked <span className="font-medium text-warning">Check</span> was hard to read.
        </Notice>
      ) : mode === "voice" && transcript ? (
        <Notice title="Here’s what we heard">
          <details>
            <summary className="cursor-pointer">Show transcript</summary>
            <p className="mt-2 whitespace-pre-line">{transcript}</p>
          </details>
        </Notice>
      ) : undefined;

    return (
      <div className="flex flex-col gap-6">
        {header}
        <div className="flex flex-wrap items-start gap-10">
          {mode === "scan" && photos.length > 0 && (
            <div className="flex min-w-0 flex-[1_1_16rem] flex-col gap-2 md:sticky md:top-4 md:max-w-xs">
              {photos.map((p, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={p.url} src={p.url} alt={`Recipe photo ${i + 1}`} className="w-full rounded-xl border" />
              ))}
            </div>
          )}
          <div className="min-w-0 flex-[999_1_30rem]">
            <RecipeEditor initial={draft} people={people} cancelHref="/recipes" notice={notice} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {header}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      {mode === "scan" && (
        <section className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            Take a photo of the card. Add the back too if the recipe continues there. Lay it flat in good light.
          </p>
          <input ref={cameraInput} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => addPhotos(e.target.files)} />
          <input ref={fileInput} type="file" accept="image/*" multiple className="hidden" onChange={(e) => addPhotos(e.target.files)} />
          <div className="grid grid-cols-[repeat(auto-fill,minmax(8rem,1fr))] gap-2">
            {photos.map((p, i) => (
              <div key={p.url} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.url} alt={`Photo ${i + 1}`} className="aspect-square w-full rounded-md border object-cover" />
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
            {photos.length < 6 && (
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1.5 rounded-md border border-dashed border-zinc-300 text-sm text-muted-foreground hover:text-foreground"
              >
                <ImagePlusIcon className="size-5" />
                {photos.length ? "Add another" : "Choose photos"}
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => cameraInput.current?.click()}>
              <CameraIcon />
              Take a photo
            </Button>
            <Button type="button" disabled={photos.length === 0 || !!busy} onClick={readPhotos}>
              {busy ? <Loader2Icon className="animate-spin" /> : null}
              {busy ? "Reading…" : "Read recipe"}
            </Button>
          </div>
          {busy && <p className="text-sm text-muted-foreground">{busy}</p>}
        </section>
      )}

      {mode === "voice" && (
        <section className="flex flex-col items-start gap-4">
          <p className="max-w-prose text-sm text-muted-foreground">
            Read the recipe out loud: the name, the ingredients with amounts, then the steps. Pauses are fine.
          </p>
          {recording ? (
            <Button type="button" variant="destructive" size="lg" onClick={stopRecording}>
              <SquareIcon />
              Stop
            </Button>
          ) : (
            <Button type="button" size="lg" disabled={!!busy} onClick={startRecording}>
              {busy ? <Loader2Icon className="animate-spin" /> : <MicIcon />}
              {busy ? "Working…" : "Start recording"}
            </Button>
          )}
          {recording && <p className="text-sm text-muted-foreground">Listening. Press stop when you’re done.</p>}
          {busy && <p className="text-sm text-muted-foreground">{busy}</p>}
        </section>
      )}
    </div>
  );
}
