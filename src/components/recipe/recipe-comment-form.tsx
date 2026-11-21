"use client";

import { addRecipeComment } from "@/app/actions/recipes";
import { CommentForm } from "@/components/comment-form";

export function RecipeCommentForm({ recipeId }: { recipeId: string }) {
  return <CommentForm onSubmit={(body) => addRecipeComment(recipeId, body)} placeholder="Add a comment…" showButton />;
}
