import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { toggleAssociationVerified } from "./actions";

export const metadata: Metadata = { title: "Admin" };

export default async function AdminPage() {
  await requireAdmin();
  const supabase = await createClient();
  const [{ data: associations }, { count: students }, { count: tickets }] = await Promise.all([
    supabase
      .from("associations")
      .select("id, name, slug, verified, created_at, school:schools!inner (name, campus)")
      .order("created_at", { ascending: false }),
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("tickets").select("*", { count: "exact", head: true }),
  ]);

  return (
    <div className="mx-auto grid max-w-5xl gap-6 px-4 py-8">
      <h1 className="text-2xl font-black">Administration TAZ</h1>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Card className="py-4">
          <CardContent className="px-4">
            <div className="text-muted-foreground text-sm">Étudiants</div>
            <div className="text-2xl font-bold">{students ?? 0}</div>
          </CardContent>
        </Card>
        <Card className="py-4">
          <CardContent className="px-4">
            <div className="text-muted-foreground text-sm">Associations</div>
            <div className="text-2xl font-bold">{associations?.length ?? 0}</div>
          </CardContent>
        </Card>
        <Card className="py-4">
          <CardContent className="px-4">
            <div className="text-muted-foreground text-sm">Billets émis</div>
            <div className="text-2xl font-bold">{tickets ?? 0}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Associations</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>École</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {associations?.map((a) => (
                <TableRow key={a.id}>
                  <TableCell>
                    <Link href={`/dashboard/associations/${a.id}`} className="font-medium hover:underline">
                      {a.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {a.school.name} {a.school.campus}
                  </TableCell>
                  <TableCell>
                    {a.verified ? <Badge variant="success">Vérifiée</Badge> : <Badge variant="outline">À vérifier</Badge>}
                  </TableCell>
                  <TableCell className="text-right">
                    <form action={toggleAssociationVerified}>
                      <input type="hidden" name="id" value={a.id} />
                      <input type="hidden" name="verified" value={String(!a.verified)} />
                      <Button size="sm" variant={a.verified ? "outline" : "default"} type="submit">
                        {a.verified ? "Retirer" : "Vérifier"}
                      </Button>
                    </form>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
