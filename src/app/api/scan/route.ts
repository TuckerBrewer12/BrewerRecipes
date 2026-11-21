import { NextResponse } from "next/server";

import { parseRecipe } from "@/lib/ai";
import { getCurrentMember } from "@/lib/auth";
import { listPeople } from "@/lib/queries";
import { uploadPhoto } from "@/lib/supabase";

export const maxDuration = 60;

const MAX_IMAGES = 6;
const MAX_BYTES = 8 * 1024 * 1024;

export async function POST(request: Request) {
  const me = await getCurrentMember();
  if (!me) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const form = await request.formData();
  const files = form.getAll("images").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length === 0) return NextResponse.json({ error: "Add a photo of the recipe." }, { status: 400 });
  if (files.length > MAX_IMAGES) return NextResponse.json({ error: `Up to ${MAX_IMAGES} photos.` }, { status: 400 });
  if (files.some((f) => !f.type.startsWith("image/") || f.size > MAX_BYTES)) {
    return NextResponse.json({ error: "Photos only, under 8 MB each." }, { status: 400 });
  }

  const scanId = crypto.randomUUID();
  const images = await Promise.all(
    files.map(async (f) => ({ data: new Uint8Array(await f.arrayBuffer()), mediaType: f.type })),
  );

  const [paths, people] = await Promise.all([
    Promise.all(files.map((f, i) => uploadPhoto(`scans/${scanId}/${i}.jpg`, f))),
    listPeople(),
  ]);

  try {
    const draft = await parseRecipe({ images, knownPeople: people.map((p) => p.name) });
    draft.originalImagePaths = paths;
    return NextResponse.json({ draft });
  } catch (err) {
    console.error("scan parse failed", err);
    return NextResponse.json(
      { error: "Couldn’t read that one. Try a clearer photo, or type it in.", originalImagePaths: paths },
      { status: 502 },
    );
  }
}
