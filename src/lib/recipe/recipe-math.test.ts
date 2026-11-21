import { describe, expect, it } from "vitest";

import { layoutGrid } from "./grid";
import { displayAmount, formatQuantity, parseQuantity } from "./quantity";

describe("parseQuantity", () => {
  it.each([
    ["1", 1],
    ["1/4", 0.25],
    ["1 1/2", 1.5],
    ["1½", 1.5],
    ["¼", 0.25],
    ["0.5", 0.5],
  ])("%s → %d", (input, expected) => {
    expect(parseQuantity(input)).toBeCloseTo(expected);
  });

  it.each(["2-3", "a pinch", "", "to taste"])("%s → null", (input) => {
    expect(parseQuantity(input)).toBeNull();
  });
});

describe("formatQuantity", () => {
  it.each([
    [0.25, "¼"],
    [0.5, "½"],
    [1.5, "1½"],
    [1 / 3, "⅓"],
    [2 / 3, "⅔"],
    [2, "2"],
    [0.97, "1"],
  ])("%d → %s", (n, s) => {
    expect(formatQuantity(n)).toBe(s);
  });
});

describe("displayAmount", () => {
  it("scales", () => {
    expect(displayAmount("1/4", 0.25, "tsp", 2, "us")).toEqual({ amount: "½", unit: "tsp" });
  });
  it("converts to metric", () => {
    expect(displayAmount("1", 1, "cup", 1, "metric")).toEqual({ amount: "235", unit: "ml" });
    expect(displayAmount("4", 4, "oz", 1, "metric")).toEqual({ amount: "115", unit: "g" });
  });
  it("tells T from t", () => {
    expect(displayAmount("1", 1, "T", 1, "metric").amount).toBe("15");
    expect(displayAmount("1", 1, "t", 1, "metric").amount).toBe("5");
  });
  it("leaves unparseable amounts alone", () => {
    expect(displayAmount("2-3", null, "cloves", 2, "metric")).toEqual({ amount: "2-3", unit: "cloves" });
  });
});

describe("layoutGrid", () => {
  it("lays out the espresso brownies like the reference card", () => {
    const ing = ["butter", "sugar", "vanilla", "espresso", "eggs", "flour", "cocoa", "soda", "salt"];
    const g = layoutGrid({
      ingredientIds: ing,
      steps: [
        { id: "s1", number: 1, text: "Butter and flour a pan", ingredientIds: [], stepIds: [] },
        { id: "s2", number: 2, text: "Preheat", ingredientIds: [], stepIds: [] },
        { id: "s3", number: 3, text: "Melt", ingredientIds: ["butter"], stepIds: [] },
        { id: "s4", number: 4, text: "Mix", ingredientIds: ["sugar", "vanilla", "espresso"], stepIds: ["s3"] },
        { id: "s5", number: 5, text: "Mix", ingredientIds: ["eggs"], stepIds: ["s4"] },
        { id: "s6", number: 6, text: "Fold in", ingredientIds: ["flour", "cocoa", "soda", "salt"], stepIds: ["s5"] },
        { id: "s7", number: 7, text: "Bake", ingredientIds: [], stepIds: ["s6"] },
      ],
    });
    expect(g.setup.map((s) => s.stepId)).toEqual(["s1", "s2"]);
    expect(g.columns).toBe(5);
    const byId = Object.fromEntries(g.cells.map((c) => [c.stepId, c]));
    expect(byId.s3).toMatchObject({ col: 1, rowStart: 0, rowEnd: 0 });
    expect(byId.s4).toMatchObject({ col: 2, rowStart: 0, rowEnd: 3 });
    expect(byId.s5).toMatchObject({ col: 3, rowStart: 0, rowEnd: 4 });
    expect(byId.s6).toMatchObject({ col: 4, rowStart: 0, rowEnd: 8 });
    expect(byId.s7).toMatchObject({ col: 5, rowStart: 0, rowEnd: 8 });
  });

  it("puts parallel branches side by side without overlapping", () => {
    const g = layoutGrid({
      ingredientIds: ["a", "b", "c", "d"],
      steps: [
        { id: "x", number: 1, text: "Mix wet", ingredientIds: ["a", "b"], stepIds: [] },
        { id: "y", number: 2, text: "Mix dry", ingredientIds: ["c", "d"], stepIds: [] },
        { id: "z", number: 3, text: "Combine", ingredientIds: [], stepIds: ["x", "y"] },
      ],
    });
    const byId = Object.fromEntries(g.cells.map((c) => [c.stepId, c]));
    expect(byId.x.col).toBe(1);
    expect(byId.y.col).toBe(1);
    expect(byId.z).toMatchObject({ col: 2, rowStart: 0, rowEnd: 3 });
    expect(g.blanks).toEqual([]);
  });
});
