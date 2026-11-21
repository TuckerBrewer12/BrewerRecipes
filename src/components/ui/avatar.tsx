import * as React from "react";

import { cn } from "@/lib/utils";

function Avatar({ className, children, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="avatar"
      aria-hidden="true"
      className={cn(
        "inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-foreground select-none",
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}

export { Avatar };
