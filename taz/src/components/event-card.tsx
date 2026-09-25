import Link from "next/link";
import { CalendarDays, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDateTime, formatPrice } from "@/lib/format";
import { requestTime } from "@/lib/time";

export type EventCardData = {
  slug: string;
  title: string;
  venue: string;
  starts_at: string;
  shotgun_opens_at: string;
  cover_url: string | null;
  status: string;
  association: { name: string; logo_url: string | null } | null;
  min_price_cents: number | null;
};

export function EventCard({ event }: { event: EventCardData }) {
  const shotgunOpen = new Date(event.shotgun_opens_at).getTime() <= requestTime();

  return (
    <Link
      href={`/events/${event.slug}`}
      className="group bg-card block h-full overflow-hidden rounded-xl border shadow-sm transition hover:shadow-md"
    >
      <div className="from-primary/80 to-primary/30 relative aspect-[16/9] bg-gradient-to-br">
        {event.cover_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={event.cover_url} alt="" className="absolute inset-0 size-full object-cover" />
        )}
        <div className="absolute top-3 left-3 flex gap-2">
          {event.status === "cancelled" ? (
            <Badge variant="destructive">Annulé</Badge>
          ) : shotgunOpen ? (
            <Badge variant="success">Shotgun ouvert</Badge>
          ) : (
            <Badge variant="secondary">Bientôt</Badge>
          )}
        </div>
      </div>
      <div className="grid gap-2 p-4">
        <p className="text-muted-foreground text-xs font-medium uppercase">
          {event.association?.name}
        </p>
        <h3 className="line-clamp-2 font-semibold group-hover:underline">{event.title}</h3>
        <div className="text-muted-foreground grid gap-1 text-sm">
          <span className="flex items-center gap-1.5">
            <CalendarDays className="size-4" /> {formatDateTime(event.starts_at)}
          </span>
          <span className="flex items-center gap-1.5">
            <MapPin className="size-4" /> {event.venue}
          </span>
        </div>
        {event.min_price_cents !== null && (
          <p className="font-semibold">
            {event.min_price_cents === 0 ? "Gratuit" : `Dès ${formatPrice(event.min_price_cents)}`}
          </p>
        )}
      </div>
    </Link>
  );
}
