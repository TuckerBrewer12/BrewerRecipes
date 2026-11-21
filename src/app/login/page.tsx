import type { Metadata } from "next";

import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <main className="flex min-h-svh items-center justify-center px-5 py-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="text-center">
          <h1 className="font-display text-4xl text-primary">Family Recipes</h1>
          <p className="mt-2 text-muted-foreground">Sign in with your phone number.</p>
        </div>
        <LoginForm />
        <p className="text-center text-sm text-muted-foreground">Only numbers on the family list can sign in.</p>
      </div>
    </main>
  );
}
