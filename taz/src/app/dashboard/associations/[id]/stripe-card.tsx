import { CheckCircle2, CreditCard } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PLATFORM_FEE_RATE } from "@/lib/pricing";
import { startStripeOnboarding } from "../actions";

export function StripeCard({
  associationId,
  accountId,
  chargesEnabled,
  canManage,
  paymentProvider,
  returnStatus,
}: {
  associationId: string;
  accountId: string | null;
  chargesEnabled: boolean;
  canManage: boolean;
  paymentProvider: "mock" | "stripe";
  returnStatus: string | null;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            <CreditCard className="size-5" /> Encaissements
          </span>
          {chargesEnabled ? (
            <Badge variant="success">Stripe actif</Badge>
          ) : accountId ? (
            <Badge variant="warning">À finaliser</Badge>
          ) : (
            <Badge variant="outline">Non connecté</Badge>
          )}
        </CardTitle>
        <CardDescription>
          Les ventes sont versées sur le compte Stripe de l&apos;asso, moins la commission TAZ de{" "}
          {PLATFORM_FEE_RATE * 100} %.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        {returnStatus === "required" && !chargesEnabled && (
          <Alert variant="destructive">
            <AlertDescription>
              Connecte Stripe pour publier un événement payant.
            </AlertDescription>
          </Alert>
        )}
        {returnStatus === "incomplete" && (
          <Alert>
            <AlertDescription>
              Stripe attend encore des informations (IBAN, pièce d&apos;identité…). Reprends
              l&apos;inscription pour activer les paiements.
            </AlertDescription>
          </Alert>
        )}
        {paymentProvider === "mock" ? (
          <p className="text-muted-foreground text-sm">
            Mode paiement simulé : aucun compte Stripe n&apos;est nécessaire pour tester.
          </p>
        ) : chargesEnabled ? (
          <p className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="size-4 text-emerald-600" /> Prêt à vendre des billets payants.
          </p>
        ) : canManage ? (
          <form action={startStripeOnboarding}>
            <input type="hidden" name="id" value={associationId} />
            <Button type="submit" className="w-full">
              {accountId ? "Finaliser mon compte Stripe" : "Connecter Stripe"}
            </Button>
          </form>
        ) : (
          <p className="text-muted-foreground text-sm">
            Un responsable de l&apos;asso doit connecter Stripe.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
