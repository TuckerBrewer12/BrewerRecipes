"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { normalizePhone } from "@/lib/phone";
import { SESSION_COOKIE, sessionCookieOptions, signSession } from "@/lib/session";
import { db } from "@/lib/supabase";

export type LoginState = { error?: string };

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const phone = normalizePhone(String(formData.get("phone") ?? ""));
  if (!phone) return { error: "Enter a 10-digit phone number." };

  const { data: member } = await db()
    .from("members")
    .select("id")
    .eq("phone", phone)
    .is("removed_at", null)
    .maybeSingle();

  if (!member) return { error: "That number isn’t on the family list. Text Tucker to get added." };

  const jar = await cookies();
  const remember = formData.get("remember") === "on";
  jar.set(SESSION_COOKIE, await signSession(member.id), {
    ...sessionCookieOptions,
    maxAge: remember ? sessionCookieOptions.maxAge : undefined,
  });
  redirect("/");
}
