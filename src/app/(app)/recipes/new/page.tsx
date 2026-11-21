import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRightIcon } from "lucide-react";

import { NewRecipe } from "@/components/recipe/new-recipe";
import { requireMember } from "@/lib/auth";
import { listPeople } from "@/lib/queries";

export const metadata: Metadata = { title: "Add a recipe" };

export default async function NewRecipePage(props: PageProps<"/recipes/new">) {
  const me = await requireMember();
  const { mode } = await props.searchParams;
  const initialMode = mode === "scan" || mode === "voice" ? mode : "type";
  const people = await listPeople();

  return (
    <main className="mx-auto max-w-5xl px-4 pt-6 pb-16 sm:px-6 sm:pt-7">
      <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1.5 text-[0.8125rem] text-muted-foreground">
        <Link href="/recipes" className="hover:text-foreground">
          Recipes
        </Link>
        <ChevronRightIcon className="size-3.5" />
        New recipe
      </nav>
      <NewRecipe initialMode={initialMode} people={people.map((p) => p.name)} me={me.name} />
    </main>
  );
}
