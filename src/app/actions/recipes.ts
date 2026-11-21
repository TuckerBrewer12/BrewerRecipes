"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireMember } from "@/lib/auth";
import { ingredientLine, recipeDraftSchema, type RecipeDraft } from "@/lib/recipe/draft";
import { parseQuantity } from "@/lib/recipe/quantity";
import { db } from "@/lib/supabase";

async function findOrCreatePerson(name: string): Promise<string | null> {
  const clean = name.trim();
  if (!clean) return null;
  const { data: existing } = await db().from("people").select("id").ilike("name", clean).maybeSingle();
  if (existing) return existing.id;
  const { data, error } = await db().from("people").insert({ name: clean }).select("id").single();
  if (error) throw error;
  return data.id;
}

async function writeBody(recipeId: string, draft: RecipeDraft, memberId: string) {
  await db().from("steps").delete().eq("recipe_id", recipeId);
  await db().from("ingredients").delete().eq("recipe_id", recipeId);

  const ingredients = draft.ingredients.filter((i) => i.name.trim());
  const ingredientIds: Record<string, string> = {};
  if (ingredients.length) {
    const { data, error } = await db()
      .from("ingredients")
      .insert(
        ingredients.map((i, position) => ({
          recipe_id: recipeId,
          position,
          section: i.section?.trim() || null,
          quantity: parseQuantity(i.quantity),
          quantity_text: i.quantity.trim() || null,
          unit: i.unit.trim() || null,
          name: i.name.trim(),
          note: i.note.trim() || null,
          original_text: i.originalText?.trim() || ingredientLine(i),
          linked_recipe_id: i.linkedRecipeId || null,
        })),
      )
      .select("id, position");
    if (error) throw error;
    for (const row of data) ingredientIds[ingredients[row.position].key] = row.id;
  }

  const steps = draft.steps.filter((s) => s.text.trim());
  const stepIds: Record<string, string> = {};
  if (steps.length) {
    const { data, error } = await db()
      .from("steps")
      .insert(steps.map((s, position) => ({ recipe_id: recipeId, position, section: s.section?.trim() || null, text: s.text.trim() })))
      .select("id, position");
    if (error) throw error;
    for (const row of data) stepIds[steps[row.position].key] = row.id;

    type Input = { step_id: string; ingredient_id?: string; input_step_id?: string };
    const inputs = steps.flatMap((s, idx) =>
      s.uses.flatMap((key): Input[] => {
        if (ingredientIds[key]) return [{ step_id: stepIds[s.key], ingredient_id: ingredientIds[key] }];
        const earlier = steps.slice(0, idx).some((e) => e.key === key);
        if (earlier && stepIds[key]) return [{ step_id: stepIds[s.key], input_step_id: stepIds[key] }];
        return [];
      }),
    );
    if (inputs.length) {
      const { error: inputErr } = await db().from("step_inputs").insert(inputs);
      if (inputErr) throw inputErr;
    }
  }

  if (draft.originalImagePaths.length) {
    const { data: existing } = await db().from("recipe_images").select("path").eq("recipe_id", recipeId);
    const have = new Set((existing ?? []).map((e) => e.path));
    const fresh = draft.originalImagePaths.filter((p) => !have.has(p));
    if (fresh.length) {
      await db()
        .from("recipe_images")
        .insert(fresh.map((path, i) => ({ recipe_id: recipeId, path, kind: "original", position: have.size + i, created_by: memberId })));
    }
  }
}

function recipeColumns(draft: RecipeDraft) {
  return {
    title: draft.title.trim(),
    category: draft.category,
    tags: draft.tags.map((t) => t.trim()).filter(Boolean),
    makes: draft.makes.trim() || null,
    prep_time: draft.prepTime.trim() || null,
    cook_time: draft.cookTime.trim() || null,
    source: draft.source.trim() || null,
    search_text: draft.ingredients.map((i) => i.name).join(" "),
  };
}

export type SaveResult = { error?: string };

export async function saveRecipe(input: RecipeDraft, recipeId?: string): Promise<SaveResult> {
  const me = await requireMember();
  const parsed = recipeDraftSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Something in the form isn’t right." };
  const draft = parsed.data;
  const ownerId = await findOrCreatePerson(draft.ownerName);

  let id = recipeId;
  if (id) {
    const { error } = await db()
      .from("recipes")
      .update({ ...recipeColumns(draft), owner_person_id: ownerId, last_edited_by: me.id, updated_at: new Date().toISOString() })
      .eq("id", id)
      .is("deleted_at", null);
    if (error) return { error: "Couldn’t save. Try again." };
  } else {
    const { data, error } = await db()
      .from("recipes")
      .insert({ ...recipeColumns(draft), owner_person_id: ownerId, uploader_id: me.id })
      .select("id")
      .single();
    if (error) return { error: "Couldn’t save. Try again." };
    id = data.id as string;
  }

  await writeBody(id, draft, me.id);
  revalidatePath("/recipes");
  revalidatePath(`/recipes/${id}`);
  redirect(`/recipes/${id}`);
}

export async function deleteRecipe(recipeId: string) {
  const me = await requireMember();
  const { data } = await db().from("recipes").select("uploader_id").eq("id", recipeId).maybeSingle();
  if (!data || data.uploader_id !== me.id) throw new Error("Only the person who added a recipe can delete it.");
  await db().from("recipes").update({ deleted_at: new Date().toISOString() }).eq("id", recipeId);
  revalidatePath("/recipes");
  redirect("/recipes");
}

export async function copyRecipe(recipeId: string) {
  const me = await requireMember();
  const { data: src } = await db().from("recipes").select("*").eq("id", recipeId).is("deleted_at", null).maybeSingle();
  if (!src) throw new Error("Recipe not found.");
  const { data: mine } = await db().from("people").select("id").eq("member_id", me.id).maybeSingle();
  const ownerId = mine?.id ?? (await findOrCreatePerson(me.name));

  const { data: copy, error } = await db()
    .from("recipes")
    .insert({
      title: src.title,
      category: src.category,
      tags: src.tags,
      makes: src.makes,
      prep_time: src.prep_time,
      cook_time: src.cook_time,
      source: src.source,
      search_text: src.search_text,
      owner_person_id: ownerId,
      uploader_id: me.id,
      based_on_recipe_id: src.id,
    })
    .select("id")
    .single();
  if (error) throw error;

  const [{ data: ings }, { data: steps }] = await Promise.all([
    db().from("ingredients").select("*").eq("recipe_id", recipeId).order("position"),
    db().from("steps").select("*, step_inputs!step_inputs_step_id_fkey(ingredient_id, input_step_id)").eq("recipe_id", recipeId).order("position"),
  ]);
  const draft: RecipeDraft = {
    title: src.title,
    ownerName: "",
    category: src.category,
    tags: src.tags ?? [],
    makes: src.makes ?? "",
    prepTime: src.prep_time ?? "",
    cookTime: src.cook_time ?? "",
    source: src.source ?? "",
    ingredients: (ings ?? []).map((i) => ({
      key: i.id,
      section: i.section,
      quantity: i.quantity_text ?? "",
      unit: i.unit ?? "",
      name: i.name,
      note: i.note ?? "",
      originalText: i.original_text,
      linkedRecipeId: i.linked_recipe_id,
    })),
    steps: (steps ?? []).map((s) => ({
      key: s.id,
      section: s.section,
      text: s.text,
      uses: (s.step_inputs ?? []).map((x: { ingredient_id: string | null; input_step_id: string | null }) => (x.ingredient_id ?? x.input_step_id)!),
    })),
    originalImagePaths: [],
  };
  await writeBody(copy.id, draft, me.id);
  revalidatePath("/recipes");
  redirect(`/recipes/${copy.id}/edit`);
}

const cookSchema = z.object({
  recipeId: z.string().uuid(),
  note: z.string().max(1000).optional(),
  cookedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export async function logCook(input: z.infer<typeof cookSchema>) {
  const me = await requireMember();
  const { recipeId, note, cookedOn } = cookSchema.parse(input);
  await db()
    .from("cook_logs")
    .insert({ recipe_id: recipeId, member_id: me.id, note: note?.trim() || null, ...(cookedOn ? { cooked_on: cookedOn } : {}) });
  revalidatePath(`/recipes/${recipeId}`);
  revalidatePath("/cook-log");
  revalidatePath("/");
}

export async function addRecipeComment(recipeId: string, body: string) {
  const me = await requireMember();
  const text = body.trim();
  if (!text) return;
  await db().from("comments").insert({ recipe_id: recipeId, author_id: me.id, body: text.slice(0, 2000) });
  revalidatePath(`/recipes/${recipeId}`);
}
