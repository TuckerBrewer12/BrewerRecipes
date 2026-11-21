"use client";

import Link from "next/link";
import { useTransition } from "react";
import { CopyIcon, PencilIcon, PrinterIcon } from "lucide-react";

import { copyRecipe } from "@/app/actions/recipes";
import { Button } from "@/components/ui/button";

export function RecipeActions({ recipeId }: { recipeId: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <>
      <Button asChild variant="outline">
        <Link href={`/recipes/${recipeId}/edit`}>
          <PencilIcon />
          Edit
        </Link>
      </Button>
      <Button variant="outline" size="icon" aria-label="Print" onClick={() => window.print()}>
        <PrinterIcon />
      </Button>
      <Button
        variant="outline"
        size="icon"
        aria-label="Make a copy"
        title="Make a copy"
        disabled={pending}
        onClick={() => startTransition(() => copyRecipe(recipeId))}
      >
        <CopyIcon />
      </Button>
    </>
  );
}
