import Link from "next/link";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { CookLogEntry } from "@/lib/queries";
import { shortDate } from "@/lib/utils";

export function CookLogTable({ entries, showMember = true }: { entries: CookLogEntry[]; showMember?: boolean }) {
  if (entries.length === 0) {
    return <p className="rounded-xl border border-dashed px-6 py-10 text-center text-sm text-muted-foreground">Nothing logged yet.</p>;
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-24">Date</TableHead>
          {showMember && <TableHead className="w-36">Who</TableHead>}
          <TableHead className="w-64">Recipe</TableHead>
          <TableHead>Note</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {entries.map((e) => (
          <TableRow key={e.id}>
            <TableCell className="py-3 whitespace-nowrap text-muted-foreground">{shortDate(e.on)}</TableCell>
            {showMember && (
              <TableCell className="py-3">
                <Link href={`/members/${e.member.id}`} className="hover:underline">
                  {e.member.name}
                </Link>
              </TableCell>
            )}
            <TableCell className="py-3 font-medium">
              <Link href={`/recipes/${e.recipe.id}`} className="hover:underline">
                {e.recipe.title}
              </Link>
            </TableCell>
            <TableCell className="py-3 whitespace-normal text-zinc-700">{e.note ?? <span className="text-muted-foreground">—</span>}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
