"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth";
import { normalizePhone } from "@/lib/phone";
import { db } from "@/lib/supabase";

export type AddMemberState = { error?: string; ok?: string };

export async function addMember(_prev: AddMemberState, formData: FormData): Promise<AddMemberState> {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const phone = normalizePhone(String(formData.get("phone") ?? ""));
  if (!name) return { error: "Add a name." };
  if (!phone) return { error: "Enter a 10-digit US phone number." };

  const { data: existing } = await db().from("members").select("id, removed_at").eq("phone", phone).maybeSingle();
  let memberId: string;
  if (existing) {
    if (!existing.removed_at) return { error: "That number is already on the list." };
    await db().from("members").update({ name, removed_at: null }).eq("id", existing.id);
    memberId = existing.id;
  } else {
    const { data, error } = await db().from("members").insert({ name, phone }).select("id").single();
    if (error) return { error: "Couldn’t add them. Try again." };
    memberId = data.id;
  }

  const { data: person } = await db().from("people").select("id, member_id").ilike("name", name).maybeSingle();
  if (person && !person.member_id) await db().from("people").update({ member_id: memberId }).eq("id", person.id);
  if (!person) await db().from("people").insert({ name, member_id: memberId });

  revalidatePath("/admin");
  return { ok: `Added ${name}.` };
}

export async function removeMember(memberId: string) {
  const me = await requireAdmin();
  if (memberId === me.id) throw new Error("You can’t remove yourself.");
  await db().from("members").update({ removed_at: new Date().toISOString() }).eq("id", memberId);
  revalidatePath("/admin");
}

export async function setMemberLargeText(memberId: string, on: boolean) {
  await requireAdmin();
  await db().from("members").update({ large_text: on }).eq("id", memberId);
  revalidatePath("/admin");
}

export async function restoreRecipe(recipeId: string) {
  await requireAdmin();
  await db().from("recipes").update({ deleted_at: null }).eq("id", recipeId);
  revalidatePath("/admin");
  revalidatePath("/recipes");
}
