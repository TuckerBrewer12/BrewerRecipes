"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  HeadingIcon,
  MoreHorizontalIcon,
  PlusIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react";

import { deleteRecipe, saveRecipe } from "@/app/actions/recipes";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import {
  CATEGORIES,
  newKey,
  type Category,
  type IngredientDraft,
  type RecipeDraft,
  type StepDraft,
} from "@/lib/recipe/draft";
import { cn } from "@/lib/utils";

type Props = {
  initial: RecipeDraft;
  recipeId?: string;
  people: string[];
  canDelete?: boolean;
  cancelHref: string;
  notice?: React.ReactNode;
};

function move<T>(list: T[], from: number, to: number) {
  if (to < 0 || to >= list.length) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

function Check({ reason }: { reason?: string | null }) {
  if (!reason) return null;
  return <p className="text-[0.8125rem] text-warning">Check: {reason}</p>;
}

function RowMenu({
  label,
  onUp,
  onDown,
  onSection,
  hasSection,
  onRemove,
}: {
  label: string;
  onUp: () => void;
  onDown: () => void;
  onSection: () => void;
  hasSection: boolean;
  onRemove: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="ghost" size="icon" aria-label={`${label} options`}>
          <MoreHorizontalIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={onUp}>
          <ArrowUpIcon />
          Move up
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onDown}>
          <ArrowDownIcon />
          Move down
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onSection}>
          <HeadingIcon />
          {hasSection ? "Remove section heading" : "Start a section here"}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={onRemove}>
          <Trash2Icon />
          Remove
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function RecipeEditor({ initial, recipeId, people, canDelete, cancelHref, notice }: Props) {
  const [draft, setDraft] = useState<RecipeDraft>(initial);
  const [tagsText, setTagsText] = useState(initial.tags.join(", "));
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pending, startTransition] = useTransition();

  const set = <K extends keyof RecipeDraft>(k: K, v: RecipeDraft[K]) => setDraft((d) => ({ ...d, [k]: v }));

  const setIngredient = (key: string, patch: Partial<IngredientDraft>) =>
    set(
      "ingredients",
      draft.ingredients.map((i) => (i.key === key ? { ...i, ...patch, uncertain: null } : i)),
    );
  const setStep = (key: string, patch: Partial<StepDraft>) =>
    set(
      "steps",
      draft.steps.map((s) => (s.key === key ? { ...s, ...patch, uncertain: null } : s)),
    );

  const removeIngredient = (key: string) =>
    setDraft((d) => ({
      ...d,
      ingredients: d.ingredients.filter((i) => i.key !== key),
      steps: d.steps.map((s) => ({ ...s, uses: s.uses.filter((u) => u !== key) })),
    }));
  const removeStep = (key: string) =>
    setDraft((d) => ({
      ...d,
      steps: d.steps.filter((s) => s.key !== key).map((s) => ({ ...s, uses: s.uses.filter((u) => u !== key) })),
    }));

  const labelFor = (key: string) => {
    const ing = draft.ingredients.find((i) => i.key === key);
    if (ing) return ing.name || "ingredient";
    const n = draft.steps.findIndex((s) => s.key === key);
    return n >= 0 ? `Step ${n + 1}` : null;
  };

  const submit = () => {
    setError(null);
    const tags = tagsText
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    startTransition(async () => {
      const result = await saveRecipe({ ...draft, tags }, recipeId);
      if (result?.error) setError(result.error);
    });
  };

  return (
    <form
      className="flex flex-col gap-10"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      {notice}

      <section className="flex flex-col gap-4">
        <h2 className="font-semibold">Details</h2>
        <div className="grid gap-2">
          <Label htmlFor="title">Title</Label>
          <Input id="title" value={draft.title} onChange={(e) => set("title", e.target.value)} required />
        </div>
        <div className="flex flex-wrap gap-4">
          <div className="grid min-w-0 flex-[1_1_14rem] gap-2">
            <Label htmlFor="owner">Whose recipe</Label>
            <Input
              id="owner"
              list="people-list"
              value={draft.ownerName}
              onChange={(e) => set("ownerName", e.target.value)}
              placeholder="Grandma Brewer"
              autoComplete="off"
            />
            <datalist id="people-list">
              {people.map((p) => (
                <option key={p} value={p} />
              ))}
            </datalist>
            <p className="text-[0.8125rem] text-muted-foreground">Pick someone or type a new name.</p>
          </div>
          <div className="grid min-w-0 flex-[1_1_12rem] content-start gap-2">
            <Label htmlFor="category">Category</Label>
            <NativeSelect id="category" value={draft.category} onChange={(e) => set("category", e.target.value as Category)}>
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </NativeSelect>
          </div>
        </div>
        <div className="flex flex-wrap gap-4">
          {(
            [
              ["prepTime", "Prep", "15 min"],
              ["cookTime", "Cook", "30–40 min"],
              ["makes", "Makes", "Serves 6"],
            ] as const
          ).map(([k, label, ph]) => (
            <div key={k} className="grid min-w-0 flex-[1_1_8rem] gap-2">
              <Label htmlFor={k}>{label}</Label>
              <Input id={k} value={draft[k]} onChange={(e) => set(k, e.target.value)} placeholder={ph} />
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-4">
          <div className="grid min-w-0 flex-[1_1_14rem] gap-2">
            <Label htmlFor="tags">Tags</Label>
            <Input id="tags" value={tagsText} onChange={(e) => setTagsText(e.target.value)} placeholder="chocolate, holidays" />
          </div>
          <div className="grid min-w-0 flex-[1_1_14rem] gap-2">
            <Label htmlFor="source">Source</Label>
            <Input id="source" value={draft.source} onChange={(e) => set("source", e.target.value)} placeholder="Joy of Cooking, p. 210" />
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-semibold">Ingredients</h2>
        <div className="hidden gap-2 pr-12 text-xs text-muted-foreground sm:flex">
          <span className="w-16">Amount</span>
          <span className="w-24">Unit</span>
          <span className="flex-1">Ingredient</span>
          <span className="flex-1">Note</span>
        </div>
        {draft.ingredients.map((ing, idx) => (
          <div key={ing.key} className="flex flex-col gap-1.5">
            {ing.section != null && (
              <Input
                aria-label="Section heading"
                value={ing.section}
                onChange={(e) => setIngredient(ing.key, { section: e.target.value })}
                placeholder="Section, e.g. For the crust"
                className="mt-2 font-semibold"
              />
            )}
            <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
              <Input
                aria-label="Amount"
                value={ing.quantity}
                onChange={(e) => setIngredient(ing.key, { quantity: e.target.value })}
                placeholder="1/2"
                className={cn("w-16 shrink-0", ing.uncertain && "border-warning")}
              />
              <Input
                aria-label="Unit"
                value={ing.unit}
                onChange={(e) => setIngredient(ing.key, { unit: e.target.value })}
                placeholder="cup"
                className={cn("w-24 shrink-0", ing.uncertain && "border-warning")}
              />
              <Input
                aria-label="Ingredient"
                value={ing.name}
                onChange={(e) => setIngredient(ing.key, { name: e.target.value })}
                placeholder="flour"
                className={cn("min-w-0 flex-[1_1_8rem]", ing.uncertain && "border-warning")}
              />
              <Input
                aria-label="Note"
                value={ing.note}
                onChange={(e) => setIngredient(ing.key, { note: e.target.value })}
                placeholder="Note"
                className="min-w-0 flex-[1_1_8rem]"
              />
              <RowMenu
                label={`Ingredient ${idx + 1}`}
                onUp={() => set("ingredients", move(draft.ingredients, idx, idx - 1))}
                onDown={() => set("ingredients", move(draft.ingredients, idx, idx + 1))}
                hasSection={ing.section != null}
                onSection={() => setIngredient(ing.key, { section: ing.section != null ? null : "" })}
                onRemove={() => removeIngredient(ing.key)}
              />
            </div>
            <Check reason={ing.uncertain} />
          </div>
        ))}
        <div className="mt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => set("ingredients", [...draft.ingredients, { key: newKey(), quantity: "", unit: "", name: "", note: "" }])}
          >
            <PlusIcon />
            Add ingredient
          </Button>
        </div>
      </section>

      <section className="flex flex-col">
        <div className="mb-2 flex flex-wrap items-baseline gap-x-3">
          <h2 className="font-semibold">Steps</h2>
          <span className="text-[0.8125rem] text-muted-foreground">“Uses” builds the grid view. Leave it empty for prep like preheating.</span>
        </div>
        {draft.steps.map((step, idx) => {
          const options = [
            ...draft.ingredients.filter((i) => i.name.trim()).map((i) => ({ key: i.key, label: i.name })),
            ...draft.steps.slice(0, idx).map((s, n) => ({ key: s.key, label: `Step ${n + 1}` })),
          ];
          return (
            <div key={step.key} className="flex flex-col gap-2 border-t py-3">
              {step.section != null && (
                <Input
                  aria-label="Section heading"
                  value={step.section}
                  onChange={(e) => setStep(step.key, { section: e.target.value })}
                  placeholder="Section, e.g. For the filling"
                  className="font-semibold"
                />
              )}
              <div className="flex gap-3">
                <span className="w-5 shrink-0 pt-2.5 text-sm text-muted-foreground tabular-nums">{idx + 1}</span>
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <Textarea
                    aria-label={`Step ${idx + 1}`}
                    value={step.text}
                    onChange={(e) => setStep(step.key, { text: e.target.value })}
                    className={cn("min-h-10", step.uncertain && "border-warning")}
                    rows={1}
                  />
                  <Check reason={step.uncertain} />
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="mr-1 text-xs text-muted-foreground">Uses</span>
                    {step.uses.map((key) => {
                      const label = labelFor(key);
                      if (!label) return null;
                      return (
                        <Badge key={key} className="gap-1 pr-1">
                          {label}
                          <button
                            type="button"
                            aria-label={`Remove ${label}`}
                            onClick={() => setStep(step.key, { uses: step.uses.filter((u) => u !== key) })}
                            className="cursor-pointer rounded-sm text-muted-foreground hover:text-foreground"
                          >
                            <XIcon className="size-3" />
                          </button>
                        </Badge>
                      );
                    })}
                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          className="inline-flex h-6 cursor-pointer items-center gap-1 rounded-md border border-dashed border-zinc-300 px-2 text-xs text-muted-foreground hover:text-foreground"
                        >
                          <PlusIcon className="size-3" />
                          Add
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="max-h-80 w-64 overflow-y-auto p-2">
                        {options.length === 0 ? (
                          <p className="p-2 text-sm text-muted-foreground">Add ingredients first.</p>
                        ) : (
                          options.map((o) => (
                            <Label key={o.key} className="cursor-pointer rounded-sm px-2 py-2 font-normal hover:bg-accent">
                              <Checkbox
                                checked={step.uses.includes(o.key)}
                                onCheckedChange={(on) =>
                                  setStep(step.key, {
                                    uses: on ? [...step.uses, o.key] : step.uses.filter((u) => u !== o.key),
                                  })
                                }
                              />
                              {o.label}
                            </Label>
                          ))
                        )}
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                <RowMenu
                  label={`Step ${idx + 1}`}
                  onUp={() => set("steps", move(draft.steps, idx, idx - 1))}
                  onDown={() => set("steps", move(draft.steps, idx, idx + 1))}
                  hasSection={step.section != null}
                  onSection={() => setStep(step.key, { section: step.section != null ? null : "" })}
                  onRemove={() => removeStep(step.key)}
                />
              </div>
            </div>
          );
        })}
        <div className="border-t pt-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              const prev = draft.steps[draft.steps.length - 1];
              set("steps", [...draft.steps, { key: newKey(), text: "", uses: prev ? [prev.key] : [] }]);
            }}
          >
            <PlusIcon />
            Add step
          </Button>
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-2 border-t pt-5">
        {canDelete && recipeId && (
          <Button type="button" variant="ghost" className="text-destructive" onClick={() => setConfirmDelete(true)}>
            <Trash2Icon />
            Delete recipe
          </Button>
        )}
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <div className="ml-auto flex gap-2">
          <Button asChild variant="ghost">
            <Link href={cancelHref}>Cancel</Link>
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : "Save recipe"}
          </Button>
        </div>
      </div>

      {recipeId && (
        <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete {draft.title || "this recipe"}?</DialogTitle>
              <DialogDescription>
                It disappears from the site. Tucker can bring it back from the admin page if you change your mind.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmDelete(false)}>
                Cancel
              </Button>
              <Button variant="destructive" disabled={pending} onClick={() => startTransition(() => deleteRecipe(recipeId))}>
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </form>
  );
}
