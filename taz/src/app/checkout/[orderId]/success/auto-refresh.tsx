"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Le webhook Stripe peut arriver quelques secondes après la redirection. */
export function AutoRefresh({ everyMs = 2000 }: { everyMs?: number }) {
  const router = useRouter();
  useEffect(() => {
    const id = setInterval(() => router.refresh(), everyMs);
    return () => clearInterval(id);
  }, [router, everyMs]);
  return null;
}
