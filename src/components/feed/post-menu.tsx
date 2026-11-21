"use client";

import { useState, useTransition } from "react";
import { MoreHorizontalIcon, PencilIcon, Trash2Icon } from "lucide-react";

import { deletePost, editPostCaption } from "@/app/actions/posts";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";

export function PostMenu({ postId, caption }: { postId: string; caption: string }) {
  const [mode, setMode] = useState<"edit" | "delete" | null>(null);
  const [text, setText] = useState(caption);
  const [pending, startTransition] = useTransition();

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label="Post options">
            <MoreHorizontalIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setMode("edit")}>
            <PencilIcon />
            Edit caption
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onSelect={() => setMode("delete")}>
            <Trash2Icon />
            Delete post
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={mode !== null} onOpenChange={(open) => !open && setMode(null)}>
        <DialogContent>
          {mode === "edit" ? (
            <>
              <DialogHeader>
                <DialogTitle>Edit caption</DialogTitle>
              </DialogHeader>
              <label>
                <span className="sr-only">Caption</span>
                <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={4} maxLength={2000} />
              </label>
              <DialogFooter>
                <Button variant="outline" onClick={() => setMode(null)}>
                  Cancel
                </Button>
                <Button
                  disabled={pending}
                  onClick={() =>
                    startTransition(async () => {
                      await editPostCaption(postId, text);
                      setMode(null);
                    })
                  }
                >
                  Save
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Delete this post?</DialogTitle>
                <DialogDescription>It comes off the feed. Any cooks it logged stay in the cook log.</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setMode(null)}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  disabled={pending}
                  onClick={() =>
                    startTransition(async () => {
                      await deletePost(postId);
                      setMode(null);
                    })
                  }
                >
                  Delete
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
