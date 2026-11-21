"use client";

import Link from "next/link";
import { useTransition } from "react";
import { LogOutIcon, ShieldIcon, TypeIcon, UserIcon } from "lucide-react";

import { logout, setLargeText } from "@/app/actions/account";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import type { Member } from "@/lib/auth";
import { initials } from "@/lib/utils";

export function AccountMenu({ member }: { member: Member }) {
  const [pending, startTransition] = useTransition();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Account menu"
        className="ml-1 flex size-9 cursor-pointer items-center justify-center rounded-full bg-muted text-xs font-medium outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        {initials(member.name)}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>{member.name}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={`/members/${member.id}`}>
            <UserIcon />
            My cook log
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
            startTransition(() => setLargeText(!member.large_text));
          }}
          disabled={pending}
        >
          <TypeIcon />
          Large text
          <Switch checked={member.large_text} className="ml-auto" tabIndex={-1} aria-hidden />
        </DropdownMenuItem>
        {member.is_admin && (
          <DropdownMenuItem asChild>
            <Link href="/admin">
              <ShieldIcon />
              Admin
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => startTransition(() => logout())}>
          <LogOutIcon />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
