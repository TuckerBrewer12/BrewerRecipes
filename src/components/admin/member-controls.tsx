"use client";

import { useActionState, useTransition } from "react";

import { addMember, removeMember, restoreRecipe, setMemberLargeText, type AddMemberState } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export function AddMemberForm() {
  const [state, action, pending] = useActionState<AddMemberState, FormData>(addMember, {});
  return (
    <form action={action} className="flex flex-col gap-3 rounded-xl border p-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="grid min-w-0 flex-[1_1_10rem] gap-2">
          <Label htmlFor="member-name">Name</Label>
          <Input id="member-name" name="name" placeholder="Cousin Sam" required />
        </div>
        <div className="grid min-w-0 flex-[1_1_10rem] gap-2">
          <Label htmlFor="member-phone">Phone number</Label>
          <Input id="member-phone" name="phone" type="tel" inputMode="tel" placeholder="(555) 555-0123" required />
        </div>
        <Button type="submit" disabled={pending}>
          Add member
        </Button>
      </div>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state.ok && <p className="text-sm text-muted-foreground">{state.ok}</p>}
    </form>
  );
}

export function LargeTextSwitch({ memberId, name, on }: { memberId: string; name: string; on: boolean }) {
  const [pending, startTransition] = useTransition();
  return (
    <Switch
      checked={on}
      disabled={pending}
      aria-label={`Large text for ${name}`}
      onCheckedChange={(v) => startTransition(() => setMemberLargeText(memberId, v))}
    />
  );
}

export function RemoveMemberButton({ memberId, name }: { memberId: string; name: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={pending}
      onClick={() => {
        if (confirm(`Remove ${name}? They’ll be signed out and can’t sign back in.`)) {
          startTransition(() => removeMember(memberId));
        }
      }}
    >
      Remove
    </Button>
  );
}

export function RestoreButton({ recipeId }: { recipeId: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button variant="outline" size="sm" disabled={pending} onClick={() => startTransition(() => restoreRecipe(recipeId))}>
      Restore
    </Button>
  );
}
