import { NextResponse } from "next/server";

import { parseRecipe, transcribeAudio } from "@/lib/ai";
import { getCurrentMember } from "@/lib/auth";
import { listPeople } from "@/lib/queries";

export const maxDuration = 60;

const MAX_BYTES = 20 * 1024 * 1024;

export async function POST(request: Request) {
  const me = await getCurrentMember();
  if (!me) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const form = await request.formData();
  const audio = form.get("audio");
  if (!(audio instanceof File) || audio.size === 0) {
    return NextResponse.json({ error: "No recording came through." }, { status: 400 });
  }
  if (audio.size > MAX_BYTES) return NextResponse.json({ error: "That recording is too long." }, { status: 400 });

  try {
    const transcript = await transcribeAudio(new Uint8Array(await audio.arrayBuffer()));
    if (!transcript.trim()) return NextResponse.json({ error: "Didn’t catch anything. Try again." }, { status: 422 });
    const people = await listPeople();
    const draft = await parseRecipe({ transcript, knownPeople: people.map((p) => p.name) });
    return NextResponse.json({ draft, transcript });
  } catch (err) {
    console.error("voice parse failed", err);
    return NextResponse.json({ error: "Couldn’t turn that into a recipe. Try again or type it in." }, { status: 502 });
  }
}
