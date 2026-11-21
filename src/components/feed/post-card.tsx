import Link from "next/link";
import { BookOpenIcon } from "lucide-react";

import { PostComments } from "@/components/feed/post-comments";
import { PostMenu } from "@/components/feed/post-menu";
import { Reactions } from "@/components/feed/reactions";
import { Avatar } from "@/components/ui/avatar";
import type { FeedPost } from "@/lib/queries";
import { cn, initials, relativeTime } from "@/lib/utils";

export function PostCard({ post, meId }: { post: FeedPost; meId: string }) {
  const photos = post.photos.slice(0, 4);
  return (
    <article className="flex flex-col gap-3.5 rounded-xl border p-4 shadow-xs">
      <div className="flex items-center gap-2.5">
        <Avatar>{initials(post.author.name)}</Avatar>
        <div className="min-w-0 flex-1 text-sm">
          <Link href={`/members/${post.author.id}`} className="font-medium hover:underline">
            {post.author.name}
          </Link>{" "}
          <span className="text-muted-foreground">
            · <time dateTime={post.createdAt}>{relativeTime(post.createdAt)}</time>
            {post.editedAt && " · edited"}
          </span>
        </div>
        {post.author.id === meId && <PostMenu postId={post.id} caption={post.caption} />}
      </div>

      {photos.length > 0 && (
        <div className={cn("grid gap-1.5", photos.length > 1 && "grid-cols-2")}>
          {photos.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={src}
              src={src}
              alt={i === 0 && post.caption ? post.caption : `Photo ${i + 1} from ${post.author.name}`}
              className={cn(
                "w-full rounded-md bg-muted object-cover",
                photos.length === 1 ? "aspect-video" : "aspect-[4/3]",
                photos.length === 3 && i === 0 && "col-span-2 aspect-video",
              )}
              loading="lazy"
            />
          ))}
        </div>
      )}

      {post.caption && <p className="text-[0.9375rem] leading-relaxed whitespace-pre-line">{post.caption}</p>}

      {post.recipes.length > 0 && (
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {post.recipes.map((r) => (
            <Link
              key={r.id}
              href={`/recipes/${r.id}`}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary underline decoration-border underline-offset-[3px] hover:decoration-primary"
            >
              <BookOpenIcon className="size-4" />
              {r.title}
            </Link>
          ))}
        </div>
      )}

      <Reactions postId={post.id} reactions={post.reactions} commentCount={post.comments.length} />
      <PostComments postId={post.id} comments={post.comments} />
    </article>
  );
}
