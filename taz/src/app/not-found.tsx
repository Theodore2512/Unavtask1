import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto grid max-w-md justify-items-center gap-4 px-4 py-24 text-center">
      <p className="text-primary text-6xl font-black">404</p>
      <h1 className="text-xl font-bold">Page introuvable</h1>
      <p className="text-muted-foreground text-sm">Cet événement a peut-être été retiré ou n&apos;est pas encore publié.</p>
      <Button asChild>
        <Link href="/">Retour à l&apos;accueil</Link>
      </Button>
    </div>
  );
}
