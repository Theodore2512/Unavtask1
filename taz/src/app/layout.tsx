import type { Metadata, Viewport } from "next";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "TAZ — La billetterie des assos étudiantes",
    template: "%s · TAZ",
  },
  description:
    "Shotgun, billetterie et organisation d'événements pour les BDE, associations et listes de campagne.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fcfcff" },
    { media: "(prefers-color-scheme: dark)", color: "#16141f" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr">
      <body className="flex min-h-dvh flex-col">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <footer className="text-muted-foreground border-t py-6 text-center text-xs">
          TAZ · Billetterie réservée aux associations étudiantes
        </footer>
      </body>
    </html>
  );
}
