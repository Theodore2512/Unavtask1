"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * S'abonne aux changements de `orders` pour cet événement (Supabase Realtime,
 * filtré par la RLS) et rafraîchit la liste côté serveur.
 */
export function LiveRefresh({ eventId }: { eventId: string }) {
  const router = useRouter();
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    let timer: ReturnType<typeof setTimeout> | undefined;

    const channel = supabase
      .channel(`orders:${eventId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders", filter: `event_id=eq.${eventId}` },
        () => {
          // Regroupe les rafales du shotgun en un seul rafraîchissement.
          clearTimeout(timer);
          timer = setTimeout(() => router.refresh(), 400);
        },
      )
      .subscribe((status) => setConnected(status === "SUBSCRIBED"));

    return () => {
      clearTimeout(timer);
      supabase.removeChannel(channel);
    };
  }, [eventId, router]);

  return (
    <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
      <span
        className={`size-2 rounded-full ${connected ? "animate-pulse bg-emerald-500" : "bg-muted-foreground"}`}
      />
      {connected ? "En direct" : "Connexion…"}
    </span>
  );
}
