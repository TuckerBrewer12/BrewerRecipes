import "server-only";
import { anthropic } from "@ai-sdk/anthropic";
import { openai } from "@ai-sdk/openai";
import { generateText, Output, transcribe, type ModelMessage } from "ai";
import { z } from "zod";

import { CATEGORIES, newKey, type RecipeDraft } from "@/lib/recipe/draft";

const PARSE_MODEL = anthropic("claude-sonnet-5-5");
const TRANSCRIBE_MODEL = openai.transcription("gpt-4o-mini-transcribe");

const aiRecipeSchema = z.object({
  title: z.string().describe("Recipe title. Make a short sensible one if the card has none."),
  ownerName: z
    .string()
    .nullable()
    .describe("Whose recipe this is, if the card says (e.g. 'From the kitchen of Ruth'). Otherwise null."),
  category: z.enum(CATEGORIES),
  makes: z.string().describe("Servings or yield as written, e.g. 'Serves 6' or 'One 8x8 pan'. Empty if not given."),
  prepTime: z.string().describe("Empty if not given."),
  cookTime: z.string().describe("Empty if not given."),
  source: z.string().describe("Cookbook, website or person credited on the card. Empty if none."),
  ingredients: z.array(
    z.object({
      section: z.string().nullable().describe("Section heading this ingredient sits under, e.g. 'For the crust'. Null if none."),
      quantity: z.string().describe("Amount exactly as written: '1/4', '1 1/2', '2-3'. Empty if none."),
      unit: z.string().describe("Unit as written: 'cup', 'tsp', 'T', 'oz', 'large'. Empty if none."),
      name: z.string(),
      note: z.string().describe("Anything else on the line: 'softened', 'or very strong coffee'. Empty if none."),
      originalText: z.string().describe("The whole ingredient line exactly as written."),
      uncertain: z
        .string()
        .nullable()
        .describe("If any part of this line was hard to read or ambiguous, say what in a few words. Otherwise null."),
    }),
  ),
  steps: z.array(
    z.object({
      text: z.string().describe("One action per step, in plain words. Split run-on paragraphs into separate steps."),
      usesIngredients: z
        .array(z.number().int())
        .describe("0-based indexes of the ingredients this step adds or works on."),
      usesSteps: z
        .array(z.number().int())
        .describe("0-based indexes of earlier steps whose result this step continues with. Usually the previous step."),
      uncertain: z.string().nullable(),
    }),
  ),
});

const INSTRUCTIONS = `You turn family recipes into structured data for a family recipe website.
The input is a photo of a recipe card or cookbook page (possibly handwritten, possibly several photos of one recipe), or a transcript of someone reading a recipe aloud.

Rules:
- Copy quantities and units exactly as written. Do not convert or round.
- Keep the family's wording for step text, but split long paragraphs into one action per step.
- Steps that only prepare equipment ("Preheat the oven", "Grease a pan") use no ingredients and no earlier steps.
- For every other step, list which ingredients it adds and which earlier step's result it continues with. This builds a diagram of the recipe, so be precise: an ingredient belongs to the step where it first goes in.
- If something is unreadable or ambiguous, make your best guess and explain briefly in "uncertain". Never invent ingredients that aren't there.
- If the photos are not a recipe, return a title of "Not a recipe" and empty lists.`;

export type ParsedRecipe = { draft: RecipeDraft; transcript?: string };

export async function parseRecipe(input: {
  images?: { data: Uint8Array; mediaType: string }[];
  transcript?: string;
  knownPeople: string[];
}): Promise<RecipeDraft> {
  const content: Extract<ModelMessage, { role: "user" }>["content"] = [];
  for (const img of input.images ?? []) {
    content.push({ type: "file", mediaType: img.mediaType, data: img.data });
  }
  content.push({
    type: "text",
    text:
      (input.transcript ? `Transcript:\n${input.transcript}\n\n` : "") +
      `People already in the family list (use the same spelling if the card names one of them): ${input.knownPeople.join(", ") || "none yet"}.`,
  });

  const { output } = await generateText({
    model: PARSE_MODEL,
    system: INSTRUCTIONS,
    messages: [{ role: "user", content }],
    output: Output.object({ schema: aiRecipeSchema }),
  });

  return toDraft(output);
}

export async function transcribeAudio(audio: Uint8Array): Promise<string> {
  const { text } = await transcribe({ model: TRANSCRIBE_MODEL, audio });
  return text;
}

function toDraft(ai: z.infer<typeof aiRecipeSchema>): RecipeDraft {
  const ingredients = ai.ingredients.map((i) => ({
    key: newKey(),
    section: i.section,
    quantity: i.quantity,
    unit: i.unit,
    name: i.name,
    note: i.note,
    originalText: i.originalText,
    uncertain: i.uncertain,
  }));
  const stepKeys = ai.steps.map(() => newKey());
  const steps = ai.steps.map((s, idx) => ({
    key: stepKeys[idx],
    text: s.text,
    uncertain: s.uncertain,
    uses: [
      ...s.usesIngredients.filter((n) => n >= 0 && n < ingredients.length).map((n) => ingredients[n].key),
      ...s.usesSteps.filter((n) => n >= 0 && n < idx).map((n) => stepKeys[n]),
    ],
  }));
  return {
    title: ai.title,
    ownerName: ai.ownerName ?? "",
    category: ai.category,
    tags: [],
    makes: ai.makes,
    prepTime: ai.prepTime,
    cookTime: ai.cookTime,
    source: ai.source,
    ingredients,
    steps,
    originalImagePaths: [],
  };
}
