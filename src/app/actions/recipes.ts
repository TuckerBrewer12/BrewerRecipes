"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireMember } from "@/lib/auth";
import { db } from "@/lib/supabase";

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
