"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { displayAmount } from "@/lib/recipe/quantity";
import type { RecipeDetail } from "@/lib/queries";

type Props = {
  ingredients: RecipeDetail["ingredients"];
  steps: RecipeDetail["steps"];
  aside?: React.ReactNode;
  after?: React.ReactNode;
};

const SCALES = [
  { value: "0.5", label: "½×" },
  { value: "1", label: "1×" },
  { value: "2", label: "2×" },
];

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-3 text-[0.8125rem] font-medium tracking-wide text-muted-foreground">{children}</h2>;
}

export function RecipeView({ ingredients, steps, aside, after }: Props) {
  const [scale, setScale] = useState("1");
  const [units, setUnits] = useState<"us" | "metric">("us");

  const lines = useMemo(
    () =>
      ingredients.map((i) => {
        const a = displayAmount(i.quantityText, i.quantity, i.unit, Number(scale), units);
        return { ...i, amount: [a.amount, a.unit].filter(Boolean).join(" ") };
      }),
    [ingredients, scale, units],
  );

  return (
    <>
      <div className="mt-8 flex flex-wrap items-center gap-3 border-b pb-4 print:hidden">
        <div className="ml-auto flex flex-wrap gap-2">
          <Tabs value={scale} onValueChange={setScale}>
            <TabsList aria-label="Scale">
              {SCALES.map((s) => (
                <TabsTrigger key={s.value} value={s.value} aria-label={`Scale ${s.label}`}>
                  {s.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <Tabs value={units} onValueChange={(v) => setUnits(v as "us" | "metric")}>
            <TabsList aria-label="Units">
              <TabsTrigger value="us">US</TabsTrigger>
              <TabsTrigger value="metric">Metric</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <div className="mt-7 flex flex-wrap gap-12">
        <div className="flex min-w-0 flex-[1_1_17rem] flex-col gap-8">
          <section>
            <SectionLabel>Ingredients</SectionLabel>
            <ul className="flex flex-col">
              {lines.map((l, idx) => (
                <li key={l.id}>
                  {l.section && l.section !== lines[idx - 1]?.section && (
                    <h3 className="mt-3 mb-1 text-sm font-semibold first:mt-0">{l.section}</h3>
                  )}
                  <label className="flex cursor-pointer items-start gap-3 py-2 text-[0.9375rem] leading-snug has-[:checked]:text-muted-foreground has-[:checked]:line-through">
                    <Checkbox className="mt-0.5 print:hidden" />
                    <span>
                      {l.amount && <span className="font-medium">{l.amount}</span>} {l.name}
                      {l.note && <span className="text-muted-foreground">, {l.note}</span>}
                      {l.linkedRecipe && (
                        <Link href={`/recipes/${l.linkedRecipe.id}`} className="ml-1 text-primary underline underline-offset-2">
                          recipe
                        </Link>
                      )}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </section>
          {aside}
        </div>

        <div className="flex min-w-0 flex-[999_1_26rem] flex-col gap-10">
          <section>
            <SectionLabel>Steps</SectionLabel>
            <ol className="flex flex-col gap-4">
              {steps.map((s, idx) => (
                <li key={s.id}>
                  {s.section && s.section !== steps[idx - 1]?.section && (
                    <h3 className="mb-2 text-sm font-semibold">{s.section}</h3>
                  )}
                  <div className="flex gap-4 leading-relaxed">
                    <span aria-hidden className="w-5 shrink-0 pt-px text-[0.9375rem] text-muted-foreground tabular-nums">
                      {idx + 1}
                    </span>
                    <span>{s.text}</span>
                  </div>
                </li>
              ))}
            </ol>
          </section>
          {after}
        </div>
      </div>
    </>
  );
}
