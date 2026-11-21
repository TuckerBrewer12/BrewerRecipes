import { requireMember } from "@/lib/auth";

export default async function FeedPage() {
  const me = await requireMember();
  return (
    <main className="mx-auto max-w-5xl px-4 pt-8 pb-16 sm:px-6">
      <h1 className="text-lg font-semibold tracking-tight">Welcome, {me.name}</h1>
    </main>
  );
}
