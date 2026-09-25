import type { Metadata } from "next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { SignupForm } from "./signup-form";

export const metadata: Metadata = { title: "Créer un compte" };

export default async function SignupPage() {
  const supabase = await createClient();
  const [{ data: cities }, { data: schools }] = await Promise.all([
    supabase.from("cities").select("id, name").order("name"),
    supabase.from("schools").select("id, city_id, name, campus, email_domains"),
  ]);

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Rejoins TAZ</CardTitle>
          <CardDescription>
            Réservé aux étudiants : inscris-toi avec l&apos;email de ton école.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SignupForm cities={cities ?? []} schools={schools ?? []} />
        </CardContent>
      </Card>
    </div>
  );
}
