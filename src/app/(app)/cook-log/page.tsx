import type { Metadata } from "next";

import { CookLogTable } from "@/components/cook-log-table";
import { requireMember } from "@/lib/auth";
import { cookLog } from "@/lib/queries";

export const metadata: Metadata = { title: "Cook log" };

export default async function CookLogPage() {
  await requireMember();
  const entries = await cookLog({ limit: 200 });
  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 px-4 pt-6 pb-16 sm:px-6 sm:pt-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Cook log</h1>
        <p className="mt-1 text-sm text-muted-foreground">Everything the family has made, newest first.</p>
      </div>
      <CookLogTable entries={entries} />
    </main>
  );
}
