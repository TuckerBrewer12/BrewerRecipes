"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireMember } from "@/lib/auth";
import { SESSION_COOKIE } from "@/lib/session";
import { db } from "@/lib/supabase";

export async function logout() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  redirect("/login");
}

export async function setLargeText(on: boolean) {
  const me = await requireMember();
  await db().from("members").update({ large_text: on }).eq("id", me.id);
  revalidatePath("/", "layout");
}
