import type { Metadata } from "next";
import Link from "next/link";
import { CameraIcon, ImageIcon, PlusIcon, SearchIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { requireMember } from "@/lib/auth";
import { listMembers, listPeople, listRecipes, type RecipeFilters } from "@/lib/queries";
import { CATEGORIES } from "@/lib/recipe/draft";

export const metadata: Metadata = { title: "Recipes" };

export default async function RecipesPage(props: PageProps<"/recipes">) {
  await requireMember();
  const sp = await props.searchParams;
  const str = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : undefined);
  const filters: RecipeFilters = {
    q: str("q"),
    category: str("category"),
    owner: str("owner"),
    uploader: str("uploader"),
    sort: (str("sort") as RecipeFilters["sort"]) ?? "recent",
  };
  const [recipes, people, members] = await Promise.all([listRecipes(filters), listPeople(), listMembers()]);
  const filtered = Boolean(filters.q || filters.category || filters.owner || filters.uploader);

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 px-4 pt-6 pb-16 sm:px-6 sm:pt-8">
      <div className="flex flex-wrap items-baseline gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Recipes</h1>
        <span className="text-sm text-muted-foreground">
          {recipes.length} {recipes.length === 1 ? "recipe" : "recipes"}
        </span>
        <div className="ml-auto flex gap-2">
          <Button asChild variant="outline">
            <Link href="/recipes/new?mode=scan">
              <CameraIcon />
              Scan a recipe
            </Link>
          </Button>
          <Button asChild>
            <Link href="/recipes/new">
              <PlusIcon />
              Add recipe
            </Link>
          </Button>
        </div>
      </div>

      <form className="flex flex-wrap items-center gap-2" role="search">
        <label className="relative min-w-0 flex-[1_1_16rem]">
          <span className="sr-only">Search recipes</span>
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input name="q" defaultValue={filters.q} placeholder="Search by name or ingredient" className="pl-9" />
        </label>
        <label>
          <span className="sr-only">Category</span>
          <NativeSelect name="category" defaultValue={filters.category ?? ""}>
            <option value="">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </NativeSelect>
        </label>
        <label>
          <span className="sr-only">Whose recipe</span>
          <NativeSelect name="owner" defaultValue={filters.owner ?? ""}>
            <option value="">Anyone’s recipe</option>
            {people.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </NativeSelect>
        </label>
        <label>
          <span className="sr-only">Added by</span>
          <NativeSelect name="uploader" defaultValue={filters.uploader ?? ""}>
            <option value="">Added by anyone</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </NativeSelect>
        </label>
        <label>
          <span className="sr-only">Sort</span>
          <NativeSelect name="sort" defaultValue={filters.sort}>
            <option value="recent">Recently added</option>
            <option value="most-made">Most made</option>
            <option value="title">A to Z</option>
          </NativeSelect>
        </label>
        <Button type="submit" variant="secondary">
          Apply
        </Button>
        {filtered && (
          <Button asChild variant="ghost">
            <Link href="/recipes">Clear</Link>
          </Button>
        )}
      </form>

      {recipes.length === 0 ? (
        <div className="rounded-xl border border-dashed px-6 py-14 text-center text-sm text-muted-foreground">
          {filtered ? "No recipes match that." : "No recipes yet. Scan a card or type one in to get started."}
        </div>
      ) : (
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(14rem,1fr))] gap-x-6 gap-y-8">
          {recipes.map((r) => (
            <li key={r.id}>
              <Link href={`/recipes/${r.id}`} className="group flex flex-col gap-2.5">
                {r.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={r.photoUrl} alt="" className="aspect-[4/3] w-full rounded-lg bg-muted object-cover" loading="lazy" />
                ) : (
                  <div className="flex aspect-[4/3] items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <ImageIcon className="size-6" />
                  </div>
                )}
                <div>
                  <h2 className="font-display text-lg leading-snug group-hover:underline">{r.title}</h2>
                  <p className="mt-0.5 text-[0.8125rem] text-muted-foreground">
                    {[r.owner?.name, r.category, r.timesMade > 0 ? `Made ${r.timesMade}×` : null].filter(Boolean).join(" · ")}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
