import Link from "next/link";
import { LayoutDashboard, LogOut, Shield, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeaderShell } from "@/components/motion/header-shell";
import { Magnetic } from "@/components/motion/magnetic";
import { getCurrentProfile } from "@/lib/auth";

export async function SiteHeader() {
  const profile = await getCurrentProfile();

  return (
    <HeaderShell>
      <Link href="/" className="text-xl font-black tracking-tight">
        <span data-header-logo="">
          TAZ<span className="text-primary">.</span>
        </span>
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
            <Magnetic>
              <Button size="sm" asChild>
                <Link href="/signup">Créer un compte</Link>
              </Button>
            </Magnetic>
          </>
        )}
      </nav>
    </HeaderShell>
  );
}
