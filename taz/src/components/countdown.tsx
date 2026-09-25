"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

function split(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };
}

/**
 * Compte à rebours jusqu'à `target`. À zéro, rafraîchit la page (le serveur
 * reste la source de vérité : c'est lui qui déverrouille le shotgun).
 */
export function Countdown({ target, onDoneRefresh = true }: { target: string; onDoneRefresh?: boolean }) {
  const router = useRouter();
  const targetMs = new Date(target).getTime();
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => {
      const t = Date.now();
      setNow(t);
      if (t >= targetMs) {
        clearInterval(id);
        if (onDoneRefresh) router.refresh();
      }
    };
    const id = setInterval(tick, 250);
    tick();
    return () => clearInterval(id);
  }, [targetMs, onDoneRefresh, router]);

  // Rendu serveur : évite une différence d'hydratation.
  const { days, hours, minutes, seconds } = split(now === null ? 0 : targetMs - now);
  const units = [
    { label: "jours", value: days },
    { label: "h", value: hours },
    { label: "min", value: minutes },
    { label: "s", value: seconds },
  ];

  return (
    <div className="flex gap-2" aria-live="polite">
      {units.map((u) => (
        <div key={u.label} className="bg-muted min-w-16 rounded-lg px-3 py-2 text-center">
          <div className="font-mono text-2xl font-bold tabular-nums">
            {now === null ? "--" : String(u.value).padStart(2, "0")}
          </div>
          <div className="text-muted-foreground text-xs">{u.label}</div>
        </div>
      ))}
    </div>
  );
}
