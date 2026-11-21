import Link from "next/link";
import { CameraIcon, PlusIcon } from "lucide-react";

import { AccountMenu } from "@/components/account-menu";
import { NavLinks } from "@/components/nav-links";
import { Button } from "@/components/ui/button";
import type { Member } from "@/lib/auth";

export function SiteHeader({ member }: { member: Member }) {
  return (
    <header className="border-b bg-background print:hidden">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-8 gap-y-1 px-4 py-2.5 sm:px-6">
        <Link href="/" className="font-display text-xl text-primary">
          Family Recipes
        </Link>
        <NavLinks className="order-last w-full sm:order-none sm:w-auto" />
        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <Button asChild variant="outline" className="hidden sm:inline-flex">
            <Link href="/recipes/new">
              <PlusIcon />
              Add recipe
            </Link>
          </Button>
          <Button asChild variant="ghost" size="icon" className="sm:hidden">
            <Link href="/recipes/new" aria-label="Add recipe">
              <PlusIcon />
            </Link>
          </Button>
          <Button asChild className="hidden sm:inline-flex">
            <Link href="/share">
              <CameraIcon />
              Share a meal
            </Link>
          </Button>
          <Button asChild variant="ghost" size="icon" className="sm:hidden">
            <Link href="/share" aria-label="Share a meal">
              <CameraIcon />
            </Link>
          </Button>
          <AccountMenu member={member} />
        </div>
      </div>
    </header>
  );
}
