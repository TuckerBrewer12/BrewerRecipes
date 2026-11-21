import type { Metadata } from "next";

import { ShareForm } from "@/components/feed/share-form";
import { requireMember } from "@/lib/auth";
import { recipeOptions } from "@/lib/queries";

export const metadata: Metadata = { title: "Share a meal" };

export default async function SharePage(props: PageProps<"/share">) {
  await requireMember();
  const { recipe } = await props.searchParams;
  const recipes = await recipeOptions();
  return (
    <main className="mx-auto max-w-lg px-4 pt-6 pb-16 sm:pt-10">
      <h1 className="text-xl font-semibold tracking-tight">Share a meal</h1>
      <p className="mt-1 mb-6 text-sm text-muted-foreground">Shows up at the top of the family feed.</p>
      <ShareForm recipes={recipes} preselect={typeof recipe === "string" ? recipe : undefined} />
    </main>
  );
}
