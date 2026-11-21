import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { env } from "@/lib/env";

let client: SupabaseClient | undefined;

// Bypasses RLS. Callers must check the session first (requireMember).
export function db(): SupabaseClient {
  if (!client) {
    client = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}

export const PHOTO_BUCKET = "photos";
const SIGNED_URL_TTL = 60 * 60;

export async function signedUrls(paths: string[]): Promise<Record<string, string>> {
  const unique = [...new Set(paths.filter(Boolean))];
  if (unique.length === 0) return {};
  const { data, error } = await db().storage.from(PHOTO_BUCKET).createSignedUrls(unique, SIGNED_URL_TTL);
  if (error) throw error;
  const out: Record<string, string> = {};
  for (const item of data ?? []) {
    if (item.path && item.signedUrl) out[item.path] = item.signedUrl;
  }
  return out;
}

export async function uploadPhoto(path: string, file: Blob) {
  const { error } = await db()
    .storage.from(PHOTO_BUCKET)
    .upload(path, file, { contentType: file.type || "image/jpeg", upsert: false });
  if (error) throw error;
  return path;
}
