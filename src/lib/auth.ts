import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { SESSION_COOKIE, verifySession } from "@/lib/session";
import { db } from "@/lib/supabase";

export type Member = {
  id: string;
  name: string;
  phone: string;
  is_admin: boolean;
  large_text: boolean;
};

export const getCurrentMember = cache(async (): Promise<Member | null> => {
  const jar = await cookies();
  const memberId = await verifySession(jar.get(SESSION_COOKIE)?.value);
  if (!memberId) return null;
  const { data } = await db()
    .from("members")
    .select("id, name, phone, is_admin, large_text")
    .eq("id", memberId)
    .is("removed_at", null)
    .maybeSingle();
  return (data as Member | null) ?? null;
});

export async function requireMember(): Promise<Member> {
  const member = await getCurrentMember();
  if (!member) redirect("/login");
  return member;
}

export async function requireAdmin(): Promise<Member> {
  const member = await requireMember();
  if (!member.is_admin) redirect("/");
  return member;
}
