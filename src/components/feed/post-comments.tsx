"use client";

import { useState } from "react";

import { addPostComment } from "@/app/actions/posts";
import { CommentForm } from "@/components/comment-form";
import type { MemberRef } from "@/lib/queries";

type Comment = { id: string; author: MemberRef; body: string; createdAt: string };

export function PostComments({ postId, comments }: { postId: string; comments: Comment[] }) {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? comments : comments.slice(-1);
  const hidden = comments.length - shown.length;
  return (
    <div className="flex flex-col gap-2.5">
      {hidden > 0 && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="w-fit cursor-pointer text-sm text-muted-foreground hover:text-foreground"
        >
          View {hidden === 1 ? "1 more comment" : `all ${comments.length} comments`}
        </button>
      )}
      {shown.map((c) => (
        <p key={c.id} className="text-sm leading-relaxed">
          <span className="mr-2 font-medium">{c.author.name}</span>
          <span className="text-zinc-700">{c.body}</span>
        </p>
      ))}
      <CommentForm onSubmit={(body) => addPostComment(postId, body)} />
    </div>
  );
}
