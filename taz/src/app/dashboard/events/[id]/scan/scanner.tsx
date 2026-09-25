"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import QrScanner from "qr-scanner";
import { CameraOff, CheckCircle2, Loader2, RotateCcw, XCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { checkInTicket, type CheckInOutcome } from "./actions";

const RESULT_DISPLAY_MS = 2500;

const TIME = new Intl.DateTimeFormat("fr-FR", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Paris",
});

const STYLES: Record<CheckInOutcome["result"], { title: string; className: string; Icon: typeof CheckCircle2 }> = {
  ok: { title: "Entrée validée", className: "bg-emerald-600 text-white", Icon: CheckCircle2 },
  already_used: { title: "Déjà scanné", className: "bg-amber-500 text-black", Icon: AlertTriangle },
  cancelled: { title: "Billet annulé", className: "bg-destructive text-white", Icon: XCircle },
  not_found: { title: "Billet invalide", className: "bg-destructive text-white", Icon: XCircle },
  error: { title: "Erreur", className: "bg-destructive text-white", Icon: XCircle },
};

export function Scanner({
  eventId,
  initialCount,
  total,
}: {
  eventId: string;
  initialCount: number;
  total: number;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const busyRef = useRef(false);
  const lastCodeRef = useRef<{ code: string; at: number } | null>(null);
  const [outcome, setOutcome] = useState<CheckInOutcome | null>(null);
  const [count, setCount] = useState(initialCount);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState("");
  const [pending, startTransition] = useTransition();

  const submit = useCallback(
    (code: string) => {
      const now = Date.now();
      // Ignore la même image lue plusieurs fois d'affilée par la caméra.
      if (busyRef.current) return;
      if (lastCodeRef.current?.code === code && now - lastCodeRef.current.at < RESULT_DISPLAY_MS + 1000) return;
      busyRef.current = true;
      lastCodeRef.current = { code, at: now };

      startTransition(async () => {
        const res = await checkInTicket(eventId, code);
        setOutcome(res);
        if (res.checkedInCount !== null) setCount(res.checkedInCount);
        navigator.vibrate?.(res.result === "ok" ? 80 : [120, 80, 120]);
        setTimeout(() => {
          busyRef.current = false;
          setOutcome(null);
        }, RESULT_DISPLAY_MS);
      });
    },
    [eventId],
  );

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const scanner = new QrScanner(video, (r) => submit(r.data.trim()), {
      returnDetailedScanResult: true,
      preferredCamera: "environment",
      highlightScanRegion: true,
      maxScansPerSecond: 8,
    });
    scanner.start().catch(() => setCameraError("Caméra indisponible : autorise l'accès ou saisis le code."));
    return () => scanner.destroy();
  }, [submit]);

  const style = outcome ? STYLES[outcome.result] : null;

  return (
    <div className="grid gap-4">
      <div className="flex items-baseline justify-between">
        <span className="text-muted-foreground text-sm">Entrées validées</span>
        <span className="text-2xl font-bold tabular-nums">
          {count} <span className="text-muted-foreground text-base">/ {total}</span>
        </span>
      </div>

      <div className="relative aspect-square overflow-hidden rounded-2xl bg-black">
        <video ref={videoRef} className="size-full object-cover" muted playsInline />
        {cameraError && (
          <div className="absolute inset-0 grid place-items-center p-6 text-center text-sm text-white">
            <div className="grid justify-items-center gap-2">
              <CameraOff className="size-8" />
              {cameraError}
            </div>
          </div>
        )}
        {pending && !outcome && (
          <div className="absolute inset-0 grid place-items-center bg-black/40">
            <Loader2 className="size-10 animate-spin text-white" />
          </div>
        )}
        {outcome && style && (
          <div
            role="status"
            className={cn("absolute inset-0 grid place-items-center p-6 text-center", style.className)}
          >
            <div className="grid justify-items-center gap-2">
              <style.Icon className="size-16" />
              <p className="text-2xl font-black">{style.title}</p>
              {outcome.name && <p className="text-xl font-semibold">{outcome.name}</p>}
              {outcome.detail && <p className="text-sm opacity-90">{outcome.detail}</p>}
              {outcome.result === "already_used" && outcome.checkedInAt && (
                <p className="text-sm font-medium">Entré·e à {TIME.format(new Date(outcome.checkedInAt))}</p>
              )}
            </div>
          </div>
        )}
      </div>

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (manualCode.trim()) {
            lastCodeRef.current = null;
            submit(manualCode.trim());
            setManualCode("");
          }
        }}
      >
        <Input
          value={manualCode}
          onChange={(e) => setManualCode(e.target.value)}
          placeholder="Code billet (ex. 39851BA4)"
          autoCapitalize="characters"
          autoComplete="off"
          maxLength={64}
          aria-label="Saisie manuelle du code billet"
        />
        <Button type="submit" disabled={pending}>
          Valider
        </Button>
      </form>
      {outcome && (
        <Button variant="ghost" size="sm" onClick={() => { busyRef.current = false; setOutcome(null); }}>
          <RotateCcw /> Scanner le suivant
        </Button>
      )}
    </div>
  );
}
