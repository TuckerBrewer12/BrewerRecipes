import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CookLogTable } from "@/components/cook-log-table";
import { PostCard } from "@/components/feed/post-card";
import { Avatar } from "@/components/ui/avatar";
import { cn, initials } from "@/lib/utils";
import { requireMember } from "@/lib/auth";
import { cookLog, getFeed, getMemberProfile, listRecipes } from "@/lib/queries";

export const metadata: Metadata = { title: "Profile" };

const TABS = [
  { id: "cooks", label: "Cook log" },
  { id: "recipes", label: "Recipes" },
  { id: "posts", label: "Posts" },
] as const;

export default async function MemberPage(props: PageProps<"/members/[id]">) {
  const me = await requireMember();
  const { id } = await props.params;
  const { tab: rawTab } = await props.searchParams;
  const tab = TABS.some((t) => t.id === rawTab) ? (rawTab as (typeof TABS)[number]["id"]) : "cooks";
  const profile = await getMemberProfile(id);
  if (!profile) notFound();

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-7 px-4 pt-6 pb-16 sm:px-6 sm:pt-8">
      <div className="flex items-center gap-4">
        <Avatar className="size-16 text-xl">{initials(profile.name)}</Avatar>
        <div>
          <h1 className="font-display text-3xl">{profile.name}</h1>
          <p className="text-sm text-muted-foreground">
            {profile.recipeCount} recipes added · {profile.cookCount} cooks logged · {profile.postCount} posts
          </p>
        </div>
      </div>

      <nav aria-label="Profile sections" className="inline-flex h-10 w-fit items-center rounded-lg bg-muted p-[3px]">
        {TABS.map((t) => (
          <Link
            key={t.id}
            href={`/members/${id}?tab=${t.id}`}
            aria-current={tab === t.id ? "page" : undefined}
            className={cn(
              "flex h-full items-center rounded-md px-3 text-sm font-medium",
              tab === t.id ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      {tab === "cooks" && <CookLogTable entries={await cookLog({ memberId: id })} showMember={false} />}

      {tab === "recipes" && (
        <ul className="flex flex-col">
          {(await listRecipes({ uploader: id })).map((r) => (
            <li key={r.id} className="border-b py-3">
              <Link href={`/recipes/${r.id}`} className="font-display text-lg hover:underline">
                {r.title}
              </Link>
              <p className="text-[0.8125rem] text-muted-foreground">
                {[r.owner?.name, r.category, r.timesMade ? `Made ${r.timesMade}×` : null].filter(Boolean).join(" · ")}
              </p>
            </li>
          ))}
        </ul>
      )}

      {tab === "posts" && (
        <div className="flex max-w-[40rem] flex-col gap-5">
          {(await getFeed(me.id, { authorId: id })).map((p) => (
            <PostCard key={p.id} post={p} meId={me.id} />
          ))}
        </div>
      )}
    </main>
  );
}
