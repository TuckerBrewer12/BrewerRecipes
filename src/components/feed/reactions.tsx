"use client";

import { useOptimistic, useTransition } from "react";
import { MessageSquareIcon } from "lucide-react";

import { toggleReaction } from "@/app/actions/posts";
import { cn } from "@/lib/utils";

type Reaction = { emoji: string; count: number; mine: boolean };

export function Reactions({
  postId,
  reactions,
  commentCount,
}: {
  postId: string;
  reactions: Reaction[];
  commentCount: number;
}) {
  const [, startTransition] = useTransition();
  const [optimistic, toggle] = useOptimistic(reactions, (state, emoji: string) =>
    state.map((r) =>
      r.emoji === emoji ? { ...r, mine: !r.mine, count: r.count + (r.mine ? -1 : 1) } : r,
    ),
  );

  return (
    <div className="-mx-1 flex items-center gap-1 border-t pt-2.5">
      {optimistic.map((r) => (
        <button
          key={r.emoji}
          type="button"
          aria-pressed={r.mine}
          aria-label={`${r.emoji} ${r.count}`}
          onClick={() =>
            startTransition(async () => {
              toggle(r.emoji);
              await toggleReaction(postId, r.emoji);
            })
          }
          className={cn(
            "inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-md px-2.5 text-sm transition-colors hover:bg-accent",
            r.mine && "bg-muted",
          )}
        >
          <span aria-hidden>{r.emoji}</span>
          {r.count > 0 && <span className="text-muted-foreground tabular-nums">{r.count}</span>}
        </button>
      ))}
      <span className="ml-auto inline-flex items-center gap-1.5 px-1 text-sm text-muted-foreground">
        <MessageSquareIcon className="size-4" />
        <span className="tabular-nums">{commentCount}</span>
        <span className="sr-only">comments</span>
      </span>
    </div>
  );
}
