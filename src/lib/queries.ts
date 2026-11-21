import "server-only";

import { db, signedUrls } from "@/lib/supabase";
import type { Category } from "@/lib/recipe/draft";

export type PersonRef = { id: string; name: string };

export type MemberRef = { id: string; name: string };

export type RecipeCard = {
  id: string;
  title: string;
  category: Category;
  owner: PersonRef | null;
  uploader: MemberRef;
  timesMade: number;
  photoUrl: string | null;
  createdAt: string;
};

export type RecipeDetail = {
  id: string;
  title: string;
  category: Category;
  tags: string[];
  makes: string | null;
  prepTime: string | null;
  cookTime: string | null;
  source: string | null;
  owner: PersonRef | null;
  uploader: MemberRef;
  editor: MemberRef | null;
  basedOn: { id: string; title: string; ownerName: string | null } | null;
  createdAt: string;
  updatedAt: string;
  ingredients: {
    id: string;
    section: string | null;
    quantity: number | null;
    quantityText: string | null;
    unit: string | null;
    name: string;
    note: string | null;
    originalText: string;
    linkedRecipe: { id: string; title: string } | null;
  }[];
  steps: { id: string; section: string | null; text: string; ingredientIds: string[]; stepIds: string[] }[];
  originals: { path: string; url: string }[];
  photoUrl: string | null;
  timesMade: number;
  lastMade: { on: string; by: string } | null;
  notes: { id: string; by: string; on: string; note: string }[];
  comments: { id: string; author: MemberRef; body: string; createdAt: string }[];
};

export type FeedPost = {
  id: string;
  author: MemberRef;
  caption: string;
  createdAt: string;
  editedAt: string | null;
  photos: string[];
  recipes: { id: string; title: string }[];
  reactions: { emoji: string; count: number; mine: boolean }[];
  comments: { id: string; author: MemberRef; body: string; createdAt: string }[];
};

export const REACTIONS = ["❤️", "😋", "👏"] as const;

type Row = Record<string, unknown>;
const one = <T = Row,>(v: unknown): T | null => (Array.isArray(v) ? (v[0] ?? null) : (v ?? null)) as T | null;

async function heroPaths(recipeIds: string[]): Promise<Record<string, string>> {
  if (recipeIds.length === 0) return {};
  const [{ data: postLinks }, { data: originals }] = await Promise.all([
    db()
      .from("post_recipes")
      .select("recipe_id, posts!inner(created_at, deleted_at, post_photos(path, position))")
      .in("recipe_id", recipeIds)
      .is("posts.deleted_at", null),
    db()
      .from("recipe_images")
      .select("recipe_id, path, position")
      .in("recipe_id", recipeIds)
      .order("position"),
  ]);
  const out: Record<string, { path: string; at: string }> = {};
  for (const link of (postLinks ?? []) as Row[]) {
    const post = one<Row>(link.posts);
    if (!post) continue;
    const photos = ((post.post_photos as Row[]) ?? []).sort((a, b) => Number(a.position) - Number(b.position));
    if (!photos[0]) continue;
    const id = String(link.recipe_id);
    const at = String(post.created_at);
    if (!out[id] || out[id].at < at) out[id] = { path: String(photos[0].path), at };
  }
  for (const img of (originals ?? []) as Row[]) {
    const id = String(img.recipe_id);
    if (!out[id]) out[id] = { path: String(img.path), at: "" };
  }
  return Object.fromEntries(Object.entries(out).map(([k, v]) => [k, v.path]));
}

async function statsFor(recipeIds: string[]) {
  if (recipeIds.length === 0) return {} as Record<string, number>;
  const { data } = await db().from("recipe_stats").select("recipe_id, times_made").in("recipe_id", recipeIds);
  return Object.fromEntries(((data ?? []) as Row[]).map((r) => [String(r.recipe_id), Number(r.times_made)]));
}

const RECIPE_CARD_SELECT =
  "id, title, category, created_at, owner:people!recipes_owner_person_id_fkey(id, name), uploader:members!recipes_uploader_id_fkey(id, name)";

async function toCards(rows: Row[]): Promise<RecipeCard[]> {
  const ids = rows.map((r) => String(r.id));
  const [heroes, stats] = await Promise.all([heroPaths(ids), statsFor(ids)]);
  const urls = await signedUrls(Object.values(heroes));
  return rows.map((r) => {
    const id = String(r.id);
    return {
      id,
      title: String(r.title),
      category: r.category as Category,
      owner: one<PersonRef>(r.owner) ?? null,
      uploader: one<MemberRef>(r.uploader)!,
      timesMade: stats[id] ?? 0,
      photoUrl: heroes[id] ? (urls[heroes[id]] ?? null) : null,
      createdAt: String(r.created_at),
    };
  });
}

export type RecipeFilters = {
  q?: string;
  category?: string;
  owner?: string;
  uploader?: string;
  sort?: "recent" | "most-made" | "title";
};

export async function listRecipes(f: RecipeFilters = {}): Promise<RecipeCard[]> {
  let query = db().from("recipes").select(RECIPE_CARD_SELECT).is("deleted_at", null);
  if (f.q?.trim()) query = query.textSearch("search", f.q.trim(), { type: "websearch", config: "english" });
  if (f.category) query = query.eq("category", f.category);
  if (f.owner) query = query.eq("owner_person_id", f.owner);
  if (f.uploader) query = query.eq("uploader_id", f.uploader);
  query = f.sort === "title" ? query.order("title") : query.order("created_at", { ascending: false });
  const { data, error } = await query.limit(500);
  if (error) throw error;
  const cards = await toCards((data ?? []) as Row[]);
  if (f.sort === "most-made") cards.sort((a, b) => b.timesMade - a.timesMade);
  return cards;
}

export async function recentRecipes(limit = 5) {
  const { data } = await db()
    .from("recipes")
    .select("id, title, owner:people!recipes_owner_person_id_fkey(id, name)")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(limit);
  return ((data ?? []) as Row[]).map((r) => ({
    id: String(r.id),
    title: String(r.title),
    owner: one<PersonRef>(r.owner),
  }));
}

export async function listPeople(): Promise<PersonRef[]> {
  const { data } = await db().from("people").select("id, name").order("name");
  return (data ?? []) as PersonRef[];
}

export async function listMembers() {
  const { data } = await db()
    .from("members")
    .select("id, name, phone, is_admin, large_text, created_at")
    .is("removed_at", null)
    .order("created_at");
  return (data ?? []) as { id: string; name: string; phone: string; is_admin: boolean; large_text: boolean }[];
}

export async function getRecipe(id: string): Promise<RecipeDetail | null> {
  const { data: r } = await db()
    .from("recipes")
    .select(
      `id, title, category, tags, makes, prep_time, cook_time, source, created_at, updated_at,
       owner:people!recipes_owner_person_id_fkey(id, name),
       uploader:members!recipes_uploader_id_fkey(id, name),
       editor:members!recipes_last_edited_by_fkey(id, name),
       based_on:recipes!recipes_based_on_recipe_id_fkey(id, title, owner:people!recipes_owner_person_id_fkey(name))`,
    )
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();
  if (!r) return null;

  const [ingredients, steps, images, logs, comments, heroes] = await Promise.all([
    db()
      .from("ingredients")
      .select("id, section, quantity, quantity_text, unit, name, note, original_text, linked:recipes!ingredients_linked_recipe_id_fkey(id, title)")
      .eq("recipe_id", id)
      .order("position"),
    db()
      .from("steps")
      .select("id, section, text, step_inputs!step_inputs_step_id_fkey(ingredient_id, input_step_id)")
      .eq("recipe_id", id)
      .order("position"),
    db().from("recipe_images").select("path").eq("recipe_id", id).eq("kind", "original").order("position"),
    db()
      .from("cook_logs")
      .select("id, note, cooked_on, created_at, member:members(name)")
      .eq("recipe_id", id)
      .order("cooked_on", { ascending: false })
      .order("created_at", { ascending: false }),
    db()
      .from("comments")
      .select("id, body, created_at, author:members(id, name)")
      .eq("recipe_id", id)
      .is("deleted_at", null)
      .order("created_at"),
    heroPaths([id]),
  ]);

  const originalPaths = ((images.data ?? []) as Row[]).map((i) => String(i.path));
  const urls = await signedUrls([...originalPaths, ...Object.values(heroes)]);
  const logRows = (logs.data ?? []) as Row[];
  const rr = r as Row;
  const basedOn = one<Row>(rr.based_on);

  return {
    id: String(rr.id),
    title: String(rr.title),
    category: rr.category as Category,
    tags: (rr.tags as string[]) ?? [],
    makes: (rr.makes as string) || null,
    prepTime: (rr.prep_time as string) || null,
    cookTime: (rr.cook_time as string) || null,
    source: (rr.source as string) || null,
    owner: one<PersonRef>(rr.owner),
    uploader: one<MemberRef>(rr.uploader)!,
    editor: one<MemberRef>(rr.editor),
    basedOn: basedOn
      ? { id: String(basedOn.id), title: String(basedOn.title), ownerName: (one<Row>(basedOn.owner)?.name as string) ?? null }
      : null,
    createdAt: String(rr.created_at),
    updatedAt: String(rr.updated_at),
    ingredients: ((ingredients.data ?? []) as Row[]).map((i) => ({
      id: String(i.id),
      section: (i.section as string) ?? null,
      quantity: i.quantity == null ? null : Number(i.quantity),
      quantityText: (i.quantity_text as string) ?? null,
      unit: (i.unit as string) ?? null,
      name: String(i.name),
      note: (i.note as string) ?? null,
      originalText: String(i.original_text),
      linkedRecipe: one<{ id: string; title: string }>(i.linked),
    })),
    steps: ((steps.data ?? []) as Row[]).map((s) => {
      const inputs = (s.step_inputs as Row[]) ?? [];
      return {
        id: String(s.id),
        section: (s.section as string) ?? null,
        text: String(s.text),
        ingredientIds: inputs.filter((x) => x.ingredient_id).map((x) => String(x.ingredient_id)),
        stepIds: inputs.filter((x) => x.input_step_id).map((x) => String(x.input_step_id)),
      };
    }),
    originals: originalPaths.map((p) => ({ path: p, url: urls[p] })).filter((o) => o.url),
    photoUrl: heroes[id] ? (urls[heroes[id]] ?? null) : null,
    timesMade: logRows.length,
    lastMade: logRows[0]
      ? { on: String(logRows[0].cooked_on), by: String(one<Row>(logRows[0].member)?.name ?? "") }
      : null,
    notes: logRows
      .filter((l) => l.note)
      .slice(0, 10)
      .map((l) => ({
        id: String(l.id),
        by: String(one<Row>(l.member)?.name ?? ""),
        on: String(l.cooked_on),
        note: String(l.note),
      })),
    comments: ((comments.data ?? []) as Row[]).map((c) => ({
      id: String(c.id),
      author: one<MemberRef>(c.author)!,
      body: String(c.body),
      createdAt: String(c.created_at),
    })),
  };
}

export async function getFeed(meId: string, opts: { authorId?: string; limit?: number } = {}): Promise<FeedPost[]> {
  let q = db()
    .from("posts")
    .select(
      `id, caption, created_at, edited_at,
       author:members!posts_author_id_fkey(id, name),
       post_photos(path, position),
       post_recipes(recipe:recipes(id, title, deleted_at)),
       reactions(emoji, member_id),
       comments(id, body, created_at, deleted_at, author:members!comments_author_id_fkey(id, name))`,
    )
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(opts.limit ?? 30);
  if (opts.authorId) q = q.eq("author_id", opts.authorId);
  const { data, error } = await q;
  if (error) throw error;
  const rows = (data ?? []) as Row[];

  const allPaths = rows.flatMap((p) => ((p.post_photos as Row[]) ?? []).map((ph) => String(ph.path)));
  const urls = await signedUrls(allPaths);

  return rows.map((p) => {
    const photos = ((p.post_photos as Row[]) ?? [])
      .sort((a, b) => Number(a.position) - Number(b.position))
      .map((ph) => urls[String(ph.path)])
      .filter(Boolean);
    const reactions = ((p.reactions as Row[]) ?? []) as { emoji: string; member_id: string }[];
    return {
      id: String(p.id),
      author: one<MemberRef>(p.author)!,
      caption: String(p.caption ?? ""),
      createdAt: String(p.created_at),
      editedAt: (p.edited_at as string) ?? null,
      photos,
      recipes: ((p.post_recipes as Row[]) ?? [])
        .map((pr) => one<Row>(pr.recipe))
        .filter((r): r is Row => !!r && !r.deleted_at)
        .map((r) => ({ id: String(r.id), title: String(r.title) })),
      reactions: REACTIONS.map((emoji) => ({
        emoji,
        count: reactions.filter((x) => x.emoji === emoji).length,
        mine: reactions.some((x) => x.emoji === emoji && x.member_id === meId),
      })),
      comments: ((p.comments as Row[]) ?? [])
        .filter((c) => !c.deleted_at)
        .sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)))
        .map((c) => ({
          id: String(c.id),
          author: one<MemberRef>(c.author)!,
          body: String(c.body),
          createdAt: String(c.created_at),
        })),
    };
  });
}

export type CookLogEntry = {
  id: string;
  on: string;
  note: string | null;
  member: MemberRef;
  recipe: { id: string; title: string };
};

export async function cookLog(opts: { memberId?: string; sinceDays?: number; limit?: number } = {}): Promise<CookLogEntry[]> {
  let q = db()
    .from("cook_logs")
    .select("id, cooked_on, note, member:members(id, name), recipe:recipes!inner(id, title, deleted_at)")
    .is("recipe.deleted_at", null)
    .order("cooked_on", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(opts.limit ?? 100);
  if (opts.memberId) q = q.eq("member_id", opts.memberId);
  if (opts.sinceDays) {
    const since = new Date(Date.now() - opts.sinceDays * 86400000).toISOString().slice(0, 10);
    q = q.gte("cooked_on", since);
  }
  const { data } = await q;
  return ((data ?? []) as Row[]).map((l) => ({
    id: String(l.id),
    on: String(l.cooked_on),
    note: (l.note as string) ?? null,
    member: one<MemberRef>(l.member)!,
    recipe: { id: String(one<Row>(l.recipe)!.id), title: String(one<Row>(l.recipe)!.title) },
  }));
}
