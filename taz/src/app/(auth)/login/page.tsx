import type { Metadata } from "next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Connexion" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next } = await searchParams;
  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Connexion</CardTitle>
          <CardDescription>Content de te revoir 👋</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm next={typeof next === "string" ? next : "/"} />
        </CardContent>
      </Card>
    </div>
  );
}
