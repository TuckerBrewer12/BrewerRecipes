import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRightIcon } from "lucide-react";

import { RecipeEditor } from "@/components/recipe/editor";
import { requireMember } from "@/lib/auth";
import { getRecipe, listPeople } from "@/lib/queries";
import type { RecipeDraft } from "@/lib/recipe/draft";

export const metadata: Metadata = { title: "Edit recipe" };

export default async function EditRecipePage(props: PageProps<"/recipes/[id]/edit">) {
  const me = await requireMember();
  const { id } = await props.params;
  const [recipe, people] = await Promise.all([getRecipe(id), listPeople()]);
  if (!recipe) notFound();

  const draft: RecipeDraft = {
    title: recipe.title,
    ownerName: recipe.owner?.name ?? "",
    category: recipe.category,
    tags: recipe.tags,
    makes: recipe.makes ?? "",
    prepTime: recipe.prepTime ?? "",
    cookTime: recipe.cookTime ?? "",
    source: recipe.source ?? "",
    ingredients: recipe.ingredients.map((i) => ({
      key: i.id,
      section: i.section,
      quantity: i.quantityText ?? "",
      unit: i.unit ?? "",
      name: i.name,
      note: i.note ?? "",
      originalText: i.originalText,
      linkedRecipeId: i.linkedRecipe?.id ?? null,
    })),
    steps: recipe.steps.map((s) => ({ key: s.id, section: s.section, text: s.text, uses: [...s.ingredientIds, ...s.stepIds] })),
    originalImagePaths: [],
  };

  return (
    <main className="mx-auto max-w-3xl px-4 pt-6 pb-16 sm:px-6 sm:pt-7">
      <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1.5 text-[0.8125rem] text-muted-foreground">
        <Link href="/recipes" className="hover:text-foreground">
          Recipes
        </Link>
        <ChevronRightIcon className="size-3.5" />
        <Link href={`/recipes/${id}`} className="hover:text-foreground">
          {recipe.title}
        </Link>
      </nav>
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Edit recipe</h1>
      <RecipeEditor
        initial={draft}
        recipeId={id}
        people={people.map((p) => p.name)}
        canDelete={recipe.uploader.id === me.id}
        cancelHref={`/recipes/${id}`}
      />
    </main>
  );
}
