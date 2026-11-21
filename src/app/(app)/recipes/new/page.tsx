import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRightIcon } from "lucide-react";

import { RecipeEditor } from "@/components/recipe/editor";
import { requireMember } from "@/lib/auth";
import { listPeople } from "@/lib/queries";
import { emptyDraft } from "@/lib/recipe/draft";

export const metadata: Metadata = { title: "Add a recipe" };

export default async function NewRecipePage() {
  const me = await requireMember();
  const people = await listPeople();

  return (
    <main className="mx-auto max-w-3xl px-4 pt-6 pb-16 sm:px-6 sm:pt-7">
      <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1.5 text-[0.8125rem] text-muted-foreground">
        <Link href="/recipes" className="hover:text-foreground">
          Recipes
        </Link>
        <ChevronRightIcon className="size-3.5" />
        New recipe
      </nav>
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Add a recipe</h1>
      <RecipeEditor initial={emptyDraft(me.name)} people={people.map((p) => p.name)} cancelHref="/recipes" />
    </main>
  );
}
