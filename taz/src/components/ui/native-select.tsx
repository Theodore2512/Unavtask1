import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/** Select natif stylé shadcn : fonctionne dans les <form> sans JS et sur mobile. */
function NativeSelect({ className, children, ...props }: React.ComponentProps<"select">) {
  return (
    <div className="relative">
      <select
        data-slot="native-select"
        className={cn(
          "border-input flex h-9 w-full appearance-none rounded-md border bg-transparent py-1 pr-9 pl-3 text-base shadow-xs outline-none transition-[color,box-shadow] md:text-sm",
          "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2" />
    </div>
  );
}

export { NativeSelect };
