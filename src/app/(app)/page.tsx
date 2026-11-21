import Link from "next/link";
import { CameraIcon, ChevronRightIcon } from "lucide-react";

import { PostCard } from "@/components/feed/post-card";
import { Button } from "@/components/ui/button";
import { requireMember } from "@/lib/auth";
import { cookLog, getFeed, recentRecipes } from "@/lib/queries";
import { relativeTime } from "@/lib/utils";

export default async function FeedPage() {
  const me = await requireMember();
  const [posts, recent, cooked] = await Promise.all([
    getFeed(me.id),
    recentRecipes(5),
    cookLog({ sinceDays: 7, limit: 6 }),
  ]);

  return (
    <main className="mx-auto flex max-w-5xl flex-wrap items-start gap-12 px-4 pt-6 pb-16 sm:px-6 sm:pt-8">
      <div className="flex min-w-0 flex-[999_1_32rem] flex-col gap-5 lg:max-w-[40rem]">
        <h1 className="sr-only sm:not-sr-only sm:text-lg sm:font-semibold sm:tracking-tight">Feed</h1>
        {posts.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed px-6 py-14 text-center">
            <p className="font-medium">Nothing here yet</p>
            <p className="max-w-xs text-sm text-muted-foreground">Next time you cook something, take a picture and share it here.</p>
            <Button asChild className="mt-2">
              <Link href="/share">
                <CameraIcon />
                Share a meal
              </Link>
            </Button>
          </div>
        ) : (
          posts.map((post) => <PostCard key={post.id} post={post} meId={me.id} />)
        )}
      </div>

      <aside className="hidden min-w-0 flex-[1_1_15rem] flex-col gap-8 pt-10 md:flex">
        <section>
          <h2 className="mb-2 text-[0.8125rem] font-medium text-muted-foreground">Recently added</h2>
          {recent.map((r) => (
            <Link key={r.id} href={`/recipes/${r.id}`} className="block py-2 hover:underline">
              <div className="text-sm font-medium">{r.title}</div>
              {r.owner && <div className="text-[0.8125rem] text-muted-foreground">{r.owner.name}</div>}
            </Link>
          ))}
          <Link href="/recipes" className="mt-2 inline-flex items-center gap-1 text-[0.8125rem] font-medium hover:underline">
            All recipes
            <ChevronRightIcon className="size-3.5" />
          </Link>
        </section>
        {cooked.length > 0 && (
          <section>
            <h2 className="mb-2 text-[0.8125rem] font-medium text-muted-foreground">Cooked this week</h2>
            {cooked.map((c) => (
              <p key={c.id} className="py-2 text-sm leading-snug">
                {c.member.name} made{" "}
                <Link href={`/recipes/${c.recipe.id}`} className="font-medium hover:underline">
                  {c.recipe.title}
                </Link>{" "}
                <span className="text-muted-foreground">· {relativeTime(`${c.on}T12:00:00`)}</span>
              </p>
            ))}
          </section>
        )}
      </aside>
    </main>
  );
}
