"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login, type LoginState } from "./actions";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {});
  return (
    <form action={action} className="flex flex-col gap-4 rounded-xl border p-6 shadow-xs">
      <div className="grid gap-2">
        <Label htmlFor="phone">Phone number</Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="(555) 555-0123"
          required
          aria-invalid={state.error ? true : undefined}
          aria-describedby={state.error ? "phone-error" : undefined}
        />
        {state.error && (
          <p id="phone-error" className="text-sm text-destructive">
            {state.error}
          </p>
        )}
      </div>
      <Label className="font-normal">
        <Checkbox name="remember" defaultChecked />
        Keep me signed in on this device
      </Label>
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Checking…" : "Continue"}
      </Button>
    </form>
  );
}
