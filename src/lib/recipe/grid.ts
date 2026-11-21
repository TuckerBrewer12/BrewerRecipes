
export type GridInput = {
  ingredientIds: string[];
  steps: { id: string; number: number; text: string; ingredientIds: string[]; stepIds: string[] }[];
};

export type GridCell = { stepId: string; number: number; text: string; col: number; rowStart: number; rowEnd: number };
export type GridLayout = {
  setup: { stepId: string; number: number; text: string }[];
  cells: GridCell[];
  blanks: { col: number; row: number }[];
  columns: number;
  rows: number;
};

export function hasGrid(input: GridInput) {
  return input.steps.some((s) => s.ingredientIds.length > 0 || s.stepIds.length > 0);
}

export function layoutGrid(input: GridInput): GridLayout {
  const rowOf = new Map(input.ingredientIds.map((id, i) => [id, i]));
  const placed = new Map<string, { col: number; rows: Set<number> }>();
  const occupied: Set<number>[] = [];
  const setup: GridLayout["setup"] = [];
  const cells: GridCell[] = [];

  for (const step of input.steps) {
    const rows = new Set<number>();
    let minCol = 1;
    for (const id of step.ingredientIds) {
      const r = rowOf.get(id);
      if (r != null) rows.add(r);
    }
    for (const id of step.stepIds) {
      const p = placed.get(id);
      if (!p) continue;
      p.rows.forEach((r) => rows.add(r));
      minCol = Math.max(minCol, p.col + 1);
    }
    if (rows.size === 0) {
      setup.push({ stepId: step.id, number: step.number, text: step.text });
      continue;
    }
    const rowStart = Math.min(...rows);
    const rowEnd = Math.max(...rows);
    let col = minCol;
    for (;;) {
      const used = occupied[col] ?? new Set<number>();
      let clash = false;
      for (let r = rowStart; r <= rowEnd; r++) if (used.has(r)) clash = true;
      if (!clash) break;
      col++;
    }
    occupied[col] = occupied[col] ?? new Set<number>();
    for (let r = rowStart; r <= rowEnd; r++) occupied[col].add(r);
    const span = new Set<number>();
    for (let r = rowStart; r <= rowEnd; r++) span.add(r);
    placed.set(step.id, { col, rows: span });
    cells.push({ stepId: step.id, number: step.number, text: step.text, col, rowStart, rowEnd });
  }

  const columns = Math.max(0, ...cells.map((c) => c.col));
  const blanks: GridLayout["blanks"] = [];
  for (let col = 1; col <= columns; col++) {
    for (let row = 0; row < input.ingredientIds.length; row++) {
      if (!occupied[col]?.has(row)) blanks.push({ col, row });
    }
  }
  return { setup, cells, blanks, columns, rows: input.ingredientIds.length };
}
