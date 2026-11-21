"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireMember } from "@/lib/auth";
import { REACTIONS } from "@/lib/queries";
import { db, uploadPhoto } from "@/lib/supabase";

const MAX_PHOTOS = 10;

export type PostState = { error?: string };

export async function createPost(_prev: PostState, formData: FormData): Promise<PostState> {
  const me = await requireMember();
  const photos = formData.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);
  const caption = String(formData.get("caption") ?? "").trim().slice(0, 2000);
  const recipeIds = formData.getAll("recipeIds").map(String).filter(Boolean);
  const logAsCook = formData.get("logCook") === "on";

  if (photos.length === 0) return { error: "Add at least one photo." };
  if (photos.length > MAX_PHOTOS) return { error: `Up to ${MAX_PHOTOS} photos per post.` };
  if (photos.some((p) => !p.type.startsWith("image/"))) return { error: "Photos only, please." };

  const { data: post, error } = await db().from("posts").insert({ author_id: me.id, caption }).select("id").single();
  if (error) return { error: "Couldn’t post. Try again." };

  try {
    const paths = await Promise.all(
      photos.map((file, i) => uploadPhoto(`posts/${post.id}/${i}-${crypto.randomUUID()}.jpg`, file)),
    );
    await db().from("post_photos").insert(paths.map((path, position) => ({ post_id: post.id, path, position })));
  } catch {
    await db().from("posts").delete().eq("id", post.id);
    return { error: "A photo didn’t upload. Try again." };
  }

  if (recipeIds.length) {
    await db().from("post_recipes").insert(recipeIds.map((recipe_id) => ({ post_id: post.id, recipe_id })));
    if (logAsCook) {
      await db()
        .from("cook_logs")
        .insert(recipeIds.map((recipe_id) => ({ recipe_id, member_id: me.id, post_id: post.id })));
    }
  }

  revalidatePath("/");
  for (const id of recipeIds) revalidatePath(`/recipes/${id}`);
  redirect("/");
}

async function ownPost(postId: string, memberId: string) {
  const { data } = await db().from("posts").select("author_id").eq("id", postId).maybeSingle();
  if (!data || data.author_id !== memberId) throw new Error("You can only change your own posts.");
}

export async function editPostCaption(postId: string, caption: string) {
  const me = await requireMember();
  await ownPost(postId, me.id);
  await db()
    .from("posts")
    .update({ caption: caption.trim().slice(0, 2000), edited_at: new Date().toISOString() })
    .eq("id", postId);
  revalidatePath("/");
}

export async function deletePost(postId: string) {
  const me = await requireMember();
  await ownPost(postId, me.id);
  await db().from("posts").update({ deleted_at: new Date().toISOString() }).eq("id", postId);
  revalidatePath("/");
}

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
