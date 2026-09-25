"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Timer } from "lucide-react";
import { cn } from "@/lib/utils";

export function HoldTimer({ expiresAt }: { expiresAt: string }) {
  const router = useRouter();
  const target = new Date(expiresAt).getTime();
  const [left, setLeft] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => {
      const ms = target - Date.now();
      setLeft(ms);
      if (ms <= 0) {
        clearInterval(id);
        router.refresh();
      }
    };
    const id = setInterval(tick, 500);
    tick();
    return () => clearInterval(id);
  }, [target, router]);

  const seconds = left === null ? 0 : Math.max(0, Math.ceil(left / 1000));
  const label =
    left === null ? "--:--" : `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

  return (
    <div
      className={cn(
        "flex items-center justify-center gap-2 rounded-lg p-3 font-mono text-lg font-bold tabular-nums",
        seconds <= 60 ? "bg-destructive/10 text-destructive" : "bg-muted",
      )}
      aria-live="polite"
    >
      <Timer className="size-5" /> {label}
    </div>
  );
}
