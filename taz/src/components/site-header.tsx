import Link from "next/link";
import { LayoutDashboard, LogOut, Shield, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCurrentProfile } from "@/lib/auth";

export async function SiteHeader() {
  const profile = await getCurrentProfile();

  return (
    <header className="bg-background/80 sticky top-0 z-40 border-b backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" className="text-xl font-black tracking-tight">
          TAZ<span className="text-primary">.</span>
        </Link>

        <nav className="flex items-center gap-1">
          {profile ? (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/tickets">
                  <Ticket />
                  <span className="hidden sm:inline">Mes billets</span>
                </Link>
              </Button>
              {(profile.role === "organizer" || profile.role === "admin") && (
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/dashboard">
                    <LayoutDashboard />
                    <span className="hidden sm:inline">Dashboard</span>
                  </Link>
                </Button>
              )}
              {profile.role === "admin" && (
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/admin">
                    <Shield />
                    <span className="hidden sm:inline">Admin</span>
                  </Link>
                </Button>
              )}
              <form action="/auth/signout" method="post">
                <Button variant="ghost" size="sm" type="submit" aria-label="Se déconnecter">
                  <LogOut />
                </Button>
              </form>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">Connexion</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/signup">Créer un compte</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
