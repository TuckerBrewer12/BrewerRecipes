import type { Metadata } from "next";

import { AddMemberForm, LargeTextSwitch, RemoveMemberButton, RestoreButton } from "@/components/admin/member-controls";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireAdmin } from "@/lib/auth";
import { formatPhone } from "@/lib/phone";
import { deletedRecipes, listMembers } from "@/lib/queries";
import { shortDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Admin" };

export default async function AdminPage() {
  const me = await requireAdmin();
  const [members, deleted] = await Promise.all([listMembers(), deletedRecipes()]);

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-10 px-4 pt-6 pb-16 sm:px-6 sm:pt-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Admin</h1>
        <p className="mt-1 text-sm text-muted-foreground">Only admins can see this page.</p>
      </div>

      <section className="flex flex-col gap-4">
        <h2 className="font-semibold">Members</h2>
        <AddMemberForm />
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Large text</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((m) => (
              <TableRow key={m.id}>
                <TableCell className="py-2.5 font-medium">
                  {m.name}
                  {m.is_admin && <Badge className="ml-2">Admin</Badge>}
                </TableCell>
                <TableCell className="py-2.5 text-zinc-700 tabular-nums">{formatPhone(m.phone)}</TableCell>
                <TableCell className="py-2.5">
                  <LargeTextSwitch memberId={m.id} name={m.name} on={m.large_text} />
                </TableCell>
                <TableCell className="py-2.5 text-right">
                  {m.id !== me.id && <RemoveMemberButton memberId={m.id} name={m.name} />}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-semibold">Deleted recipes</h2>
        {deleted.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing deleted.</p>
        ) : (
          <ul className="border-t">
            {deleted.map((r) => (
              <li key={r.id} className="flex items-center gap-4 border-b py-3 text-sm">
                <div className="flex-1">
                  <span className="font-medium">{r.title}</span>{" "}
                  <span className="text-muted-foreground">
                    · added by {r.by} · deleted {shortDate(r.deletedAt)}
                  </span>
                </div>
                <RestoreButton recipeId={r.id} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
