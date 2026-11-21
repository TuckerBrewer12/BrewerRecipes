import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRightIcon } from "lucide-react";

import { RecipeView } from "@/components/recipe/recipe-view";
import { requireMember } from "@/lib/auth";
import { getRecipe } from "@/lib/queries";
import { possessive, shortDate } from "@/lib/utils";

export async function generateMetadata(props: PageProps<"/recipes/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  const recipe = await getRecipe(id);
  return { title: recipe?.title ?? "Recipe" };
}

function Fact({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-3 text-[0.8125rem] font-medium tracking-wide text-muted-foreground">{children}</h2>;
}

export default async function RecipePage(props: PageProps<"/recipes/[id]">) {
  await requireMember();
  const { id } = await props.params;
  const recipe = await getRecipe(id);
  if (!recipe) notFound();

  const byline = [
    `Added by ${recipe.uploader.name}`,
    recipe.editor && recipe.updatedAt !== recipe.createdAt ? `Edited by ${recipe.editor.name}, ${shortDate(recipe.updatedAt)}` : null,
    recipe.source ? `From ${recipe.source}` : null,
  ].filter(Boolean);

  return (
    <main className="mx-auto max-w-5xl px-4 pt-6 pb-16 sm:px-6 sm:pt-7">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[0.8125rem] text-muted-foreground print:hidden">
        <Link href="/recipes" className="hover:text-foreground">
          Recipes
        </Link>
        <ChevronRightIcon className="size-3.5" />
        <Link href={`/recipes?category=${recipe.category}`} className="hover:text-foreground">
          {recipe.category}
        </Link>
      </nav>

      <div className="mt-5 flex flex-wrap items-start gap-8">
        <div className="flex min-w-0 flex-[999_1_26rem] flex-col gap-3">
          <h1 className="font-display text-4xl leading-tight sm:text-[2.5rem]">{recipe.title}</h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {recipe.owner && <span className="font-medium text-foreground">{possessive(recipe.owner.name)} recipe</span>}
            {recipe.owner && byline.length > 0 && " · "}
            {byline.join(" · ")}
          </p>
          {recipe.basedOn && (
            <p className="text-sm text-muted-foreground">
              Based on{" "}
              <Link href={`/recipes/${recipe.basedOn.id}`} className="underline underline-offset-2 hover:text-foreground">
                {recipe.basedOn.ownerName ? `${possessive(recipe.basedOn.ownerName)} ` : ""}
                {recipe.basedOn.title}
              </Link>
            </p>
          )}
          <dl className="mt-2 flex flex-wrap gap-x-8 gap-y-2 text-sm">
            <Fact label="Prep" value={recipe.prepTime} />
            <Fact label="Cook" value={recipe.cookTime} />
            <Fact label="Makes" value={recipe.makes} />
            <Fact
              label="Made"
              value={
                recipe.timesMade > 0
                  ? `${recipe.timesMade} ${recipe.timesMade === 1 ? "time" : "times"}${recipe.lastMade ? ` · last ${shortDate(recipe.lastMade.on)}` : ""}`
                  : "Not yet"
              }
            />
          </dl>
          {recipe.tags.length > 0 && <p className="text-[0.8125rem] text-muted-foreground">{recipe.tags.join(", ")}</p>}
        </div>
        {recipe.photoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={recipe.photoUrl}
            alt={recipe.title}
            className="order-first aspect-[16/10] w-full min-w-0 flex-[1_1_18rem] rounded-xl bg-muted object-cover sm:order-none sm:aspect-[4/3] print:hidden"
          />
        )}
      </div>

      <RecipeView
        ingredients={recipe.ingredients}
        steps={recipe.steps}
        after={
          <>
            {recipe.notes.length > 0 && (
              <section className="border-t pt-6">
                <SectionLabel>Cook notes</SectionLabel>
                <ul className="flex flex-col gap-3">
                  {recipe.notes.map((n) => (
                    <li key={n.id} className="text-sm leading-relaxed">
                      <span className="font-medium">{n.by}</span>{" "}
                      <span className="text-muted-foreground">· {shortDate(n.on)}</span>
                      <p className="text-zinc-700">{n.note}</p>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </>
        }
      />
    </main>
  );
}
