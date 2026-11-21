import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="mx-auto flex max-w-md flex-col items-center gap-3 px-4 py-24 text-center">
      <h1 className="text-xl font-semibold">Couldn’t find that</h1>
      <p className="text-sm text-muted-foreground">It may have been deleted, or the link is wrong.</p>
      <Button asChild variant="outline" className="mt-2">
        <Link href="/recipes">Back to recipes</Link>
      </Button>
    </main>
  );
}
