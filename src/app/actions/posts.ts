"use server";

import { revalidatePath } from "next/cache";

import { requireMember } from "@/lib/auth";
import { REACTIONS } from "@/lib/queries";
import { db } from "@/lib/supabase";

export async function toggleReaction(postId: string, emoji: string) {
  const me = await requireMember();
  if (!(REACTIONS as readonly string[]).includes(emoji)) return;
  const { data: existing } = await db()
    .from("reactions")
    .select("emoji")
    .eq("post_id", postId)
    .eq("member_id", me.id)
    .eq("emoji", emoji)
    .maybeSingle();
  if (existing) {
    await db().from("reactions").delete().eq("post_id", postId).eq("member_id", me.id).eq("emoji", emoji);
  } else {
    await db().from("reactions").insert({ post_id: postId, member_id: me.id, emoji });
  }
  revalidatePath("/");
}

export async function addPostComment(postId: string, body: string) {
  const me = await requireMember();
  const text = body.trim();
  if (!text) return;
  await db().from("comments").insert({ post_id: postId, author_id: me.id, body: text.slice(0, 2000) });
  revalidatePath("/");
}
