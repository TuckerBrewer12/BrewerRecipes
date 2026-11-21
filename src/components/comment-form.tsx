"use client";

import { useRef, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function CommentForm({
  onSubmit,
  placeholder = "Write a comment…",
  showButton = false,
}: {
  onSubmit: (body: string) => Promise<void>;
  placeholder?: string;
  showButton?: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  return (
    <form
      className="flex gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        const body = ref.current?.value.trim();
        if (!body) return;
        startTransition(async () => {
          await onSubmit(body);
          if (ref.current) ref.current.value = "";
        });
      }}
    >
      <label className="min-w-0 flex-1">
        <span className="sr-only">{placeholder.replace("…", "")}</span>
        <Input ref={ref} placeholder={placeholder} disabled={pending} maxLength={2000} />
      </label>
      {showButton && (
        <Button type="submit" variant="outline" disabled={pending}>
          Post
        </Button>
      )}
    </form>
  );
}
