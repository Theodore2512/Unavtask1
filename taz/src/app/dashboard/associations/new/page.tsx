import type { Metadata } from "next";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireProfile } from "@/lib/auth";
import { createAssociation } from "../actions";
import { AssociationForm } from "../association-form";

export const metadata: Metadata = { title: "Créer une association" };

export default async function NewAssociationPage() {
  const profile = await requireProfile("/dashboard/associations/new");

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Créer mon asso</CardTitle>
          <CardDescription>
            L&apos;association sera rattachée à ton école. Tu en deviens propriétaire.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {profile.student_verified ? (
            <AssociationForm action={createAssociation} submitLabel="Créer l'association" />
          ) : (
            <Alert variant="destructive">
              <AlertDescription>
                Ton statut étudiant doit être vérifié (email d&apos;école) pour créer une asso.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
