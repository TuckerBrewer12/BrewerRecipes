import { z } from "zod";

export const CATEGORIES = [
  "Breakfast",
  "Main",
  "Side",
  "Soup",
  "Salad",
  "Dessert",
  "Bread",
  "Drink",
  "Holiday",
  "Other",
] as const;
export type Category = (typeof CATEGORIES)[number];

export const ingredientDraftSchema = z.object({
  key: z.string(),
  section: z.string().nullish(),
  quantity: z.string(),
  unit: z.string(),
  name: z.string(),
  note: z.string(),
  originalText: z.string().nullish(),
  linkedRecipeId: z.string().nullish(),
  uncertain: z.string().nullish(),
});

export const stepDraftSchema = z.object({
  key: z.string(),
  section: z.string().nullish(),
  text: z.string(),
  uses: z.array(z.string()),
  uncertain: z.string().nullish(),
});

export const recipeDraftSchema = z.object({
  title: z.string().trim().min(1, "Give the recipe a title."),
  ownerName: z.string().trim(),
  category: z.enum(CATEGORIES),
  tags: z.array(z.string()),
  makes: z.string(),
  prepTime: z.string(),
  cookTime: z.string(),
  source: z.string(),
  ingredients: z.array(ingredientDraftSchema),
  steps: z.array(stepDraftSchema),
  originalImagePaths: z.array(z.string()),
});

export type IngredientDraft = z.infer<typeof ingredientDraftSchema>;
export type StepDraft = z.infer<typeof stepDraftSchema>;
export type RecipeDraft = z.infer<typeof recipeDraftSchema>;

export function newKey() {
  return Math.random().toString(36).slice(2, 10);
}

export function emptyDraft(ownerName = ""): RecipeDraft {
  return {
    title: "",
    ownerName,
    category: "Main",
    tags: [],
    makes: "",
    prepTime: "",
    cookTime: "",
    source: "",
    ingredients: [{ key: newKey(), quantity: "", unit: "", name: "", note: "" }],
    steps: [{ key: newKey(), text: "", uses: [] }],
    originalImagePaths: [],
  };
}

export function ingredientLine(i: Pick<IngredientDraft, "quantity" | "unit" | "name" | "note">) {
  return [i.quantity, i.unit, i.name].filter(Boolean).join(" ") + (i.note ? `, ${i.note}` : "");
}
