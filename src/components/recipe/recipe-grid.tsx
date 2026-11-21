import { RotateCcwIcon } from "lucide-react";

import type { GridLayout } from "@/lib/recipe/grid";
import { cn } from "@/lib/utils";

export function RecipeGrid({ layout, ingredientLabels }: { layout: GridLayout; ingredientLabels: string[] }) {
  const cols = layout.columns + 1;
  const firstRow = layout.setup.length + 1;

  return (
    <div>
      <p className="mb-3 flex items-center gap-2 text-[0.8125rem] text-muted-foreground sm:hidden">
        <RotateCcwIcon className="size-4" />
        Turn your phone sideways to see the whole grid.
      </p>
      <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <div
          role="table"
          aria-label="Recipe grid"
          className="grid w-max min-w-full gap-px overflow-hidden rounded-xl border bg-border sm:w-full"
          style={{ gridTemplateColumns: `minmax(11rem, 2.4fr) repeat(${layout.columns}, minmax(7rem, 1fr))` }}
        >
          {layout.setup.map((s, i) => (
            <div
              key={s.stepId}
              role="row"
              className="bg-background px-3 py-2.5 text-center text-sm"
              style={{ gridColumn: `1 / span ${cols}`, gridRow: i + 1 }}
            >
              <span className="mr-2 text-xs text-muted-foreground">{s.number}</span>
              {s.text}
            </div>
          ))}
          {ingredientLabels.map((label, row) => (
            <div
              key={`i${row}`}
              role="rowheader"
              className="sticky left-0 z-10 bg-background px-3 py-2.5 text-sm leading-snug sm:static"
              style={{ gridColumn: 1, gridRow: firstRow + row }}
            >
              {label}
            </div>
          ))}
          {layout.cells.map((c) => (
            <div
              key={c.stepId}
              role="cell"
              className="flex flex-col items-center justify-center gap-1 bg-background px-3 py-2.5 text-center text-sm leading-snug"
              style={{ gridColumn: c.col + 1, gridRow: `${firstRow + c.rowStart} / ${firstRow + c.rowEnd + 1}` }}
            >
              <span className="text-xs text-muted-foreground">{c.number}</span>
              <span className={cn(c.text.length > 60 && "text-[0.8125rem]")}>{c.text}</span>
            </div>
          ))}
          {layout.blanks.map((b) => (
            <div
              key={`b${b.col}-${b.row}`}
              aria-hidden
              className="bg-zinc-50"
              style={{ gridColumn: b.col + 1, gridRow: firstRow + b.row }}
            />
          ))}
        </div>
      </div>
      <p className="mt-3 hidden text-[0.8125rem] text-muted-foreground sm:block">
        Read left to right. Each step combines everything it spans.
      </p>
    </div>
  );
}
