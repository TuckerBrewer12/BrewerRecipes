"use client";

import { useState, useTransition } from "react";
import { CheckIcon } from "lucide-react";

import { logCook } from "@/app/actions/recipes";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

function today() {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

export function MadeThis({ recipeId, title }: { recipeId: string; title: string }) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [date, setDate] = useState(today);
  const [pending, startTransition] = useTransition();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="butter">
          <CheckIcon />I made this
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>You made {title}</DialogTitle>
          <DialogDescription>Adds it to the cook log. Notes show on the recipe for everyone.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="cook-note">Note (optional)</Label>
            <Textarea
              id="cook-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Used half the sugar. Still great."
              rows={3}
              maxLength={1000}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="cook-date">When</Label>
            <Input id="cook-date" type="date" value={date} max={today()} onChange={(e) => setDate(e.target.value)} className="w-fit" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                await logCook({ recipeId, note, cookedOn: date });
                setNote("");
                setOpen(false);
              })
            }
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
