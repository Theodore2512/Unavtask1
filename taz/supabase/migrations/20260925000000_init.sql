-- =============================================================================
-- TAZ — V1 schema
-- Billetterie & organisation d'événements pour associations étudiantes / BDE.
--
-- Principes :
--   * RLS activé sur TOUTES les tables du schéma public.
--   * Aucune écriture directe sur orders / tickets : tout passe par des fonctions
--     SECURITY DEFINER qui verrouillent l'événement (anti-survente).
--   * Les montants sont stockés en centimes (integer).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------
create type public.user_role      as enum ('student', 'organizer', 'admin');
create type public.member_role    as enum ('owner', 'admin', 'staff');
create type public.event_status   as enum ('draft', 'published', 'cancelled');
create type public.access_mode    as enum ('school_only', 'inter_school');
create type public.ticket_kind    as enum ('standard', 'member', 'free');
create type public.order_status   as enum ('pending', 'paid', 'free', 'cancelled', 'expired');
create type public.ticket_status  as enum ('valid', 'used', 'cancelled');

-- ---------------------------------------------------------------------------
-- Référentiel : villes & écoles (campus)
-- ---------------------------------------------------------------------------
create table public.cities (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  slug       text not null unique,
  created_at timestamptz not null default now()
);

create table public.schools (
  id            uuid primary key default gen_random_uuid(),
  city_id       uuid not null references public.cities (id) on delete restrict,
  name          text not null,              -- "IÉSEG"
  campus        text not null,              -- "Lille"
  -- Domaines email acceptés pour valider le statut étudiant (sans "@").
  -- Les sous-domaines sont acceptés : "ieseg.fr" valide aussi "x@etu.ieseg.fr".
  email_domains text[] not null default '{}',
  created_at    timestamptz not null default now(),
  unique (name, campus)
);
create index schools_city_id_idx on public.schools (city_id);

-- ---------------------------------------------------------------------------
-- Profils (1-1 avec auth.users)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id               uuid primary key references auth.users (id) on delete cascade,
  email            text not null,
  first_name       text not null,
  last_name        text not null,
  school_id        uuid references public.schools (id) on delete set null,
  role             public.user_role not null default 'student',
  student_verified boolean not null default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index profiles_school_id_idx on public.profiles (school_id);

-- ---------------------------------------------------------------------------
-- Associations / BDE / listes
-- ---------------------------------------------------------------------------
create table public.associations (
  id                uuid primary key default gen_random_uuid(),
  school_id         uuid not null references public.schools (id) on delete restrict,
  name              text not null,
  slug              text not null unique,
  description       text not null default '',
  logo_url          text,
  instagram_url     text,
  tiktok_url        text,
  linkedin_url      text,
  website_url       text,
  -- Compte Stripe Connect (Express) de l'asso — destination des virements.
  stripe_account_id text,
  verified          boolean not null default false,  -- validé par un admin TAZ
  created_by        uuid not null references public.profiles (id) on delete restrict,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index associations_school_id_idx on public.associations (school_id);

create table public.association_members (
  association_id uuid not null references public.associations (id) on delete cascade,
  user_id        uuid not null references public.profiles (id) on delete cascade,
  role           public.member_role not null default 'staff',
  created_at     timestamptz not null default now(),
  primary key (association_id, user_id)
);
create index association_members_user_id_idx on public.association_members (user_id);

-- ---------------------------------------------------------------------------
-- Événements
-- ---------------------------------------------------------------------------
create table public.events (
  id               uuid primary key default gen_random_uuid(),
  association_id   uuid not null references public.associations (id) on delete cascade,
  title            text not null check (char_length(title) between 3 and 120),
  slug             text not null unique,
  description      text not null default '',
  cover_url        text,
  venue            text not null,
  address          text,
  starts_at        timestamptz not null,
  ends_at          timestamptz,
  shotgun_opens_at timestamptz not null,
  capacity         integer not null check (capacity > 0),
  access_mode      public.access_mode not null default 'school_only',
  status           public.event_status not null default 'draft',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  check (ends_at is null or ends_at > starts_at),
  check (shotgun_opens_at <= starts_at)
);
create index events_association_id_idx on public.events (association_id);
create index events_status_starts_at_idx on public.events (status, starts_at);

-- Code adhérent : table séparée car `events` est lisible publiquement.
create table public.event_secrets (
  event_id    uuid primary key references public.events (id) on delete cascade,
  member_code text not null check (char_length(member_code) >= 4)
);

-- Quotas par école (mode inter-écoles). Si un événement inter-écoles possède au
-- moins une ligne ici, seules les écoles listées peuvent réserver.
create table public.event_school_quotas (
  event_id  uuid not null references public.events (id) on delete cascade,
  school_id uuid not null references public.schools (id) on delete cascade,
  quota     integer not null check (quota > 0),
  primary key (event_id, school_id)
);

create table public.ticket_types (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid not null references public.events (id) on delete cascade,
  name        text not null,                        -- "Standard", "Adhérent", "Gratuit"
  kind        public.ticket_kind not null,
  price_cents integer not null default 0 check (price_cents >= 0),
  quota       integer check (quota is null or quota > 0),  -- null = limité par la capacité
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  check ((kind = 'free') = (price_cents = 0))
);
create index ticket_types_event_id_idx on public.ticket_types (event_id);

-- ---------------------------------------------------------------------------
-- Commandes (réservation / hold / paiement) & billets
-- ---------------------------------------------------------------------------
create table public.orders (
  id                uuid primary key default gen_random_uuid(),
  event_id          uuid not null references public.events (id) on delete cascade,
  ticket_type_id    uuid not null references public.ticket_types (id) on delete restrict,
  user_id           uuid not null references public.profiles (id) on delete cascade,
  school_id         uuid references public.schools (id) on delete set null, -- snapshot pour quotas
  status            public.order_status not null default 'pending',
  amount_cents      integer not null check (amount_cents >= 0),   -- payé par l'étudiant
  fee_cents         integer not null default 0 check (fee_cents >= 0), -- commission TAZ (3 %)
  hold_expires_at   timestamptz,                                  -- fin du panier (5 min)
  stripe_session_id text unique,
  paid_at           timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index orders_event_status_idx on public.orders (event_id, status);
create index orders_user_id_idx on public.orders (user_id);
-- Un seul billet actif par étudiant et par événement.
create unique index orders_one_active_per_user_event
  on public.orders (event_id, user_id)
  where status in ('pending', 'paid', 'free');

create table public.tickets (
  id             uuid primary key default gen_random_uuid(),
  order_id       uuid not null unique references public.orders (id) on delete cascade,
  event_id       uuid not null references public.events (id) on delete cascade,
  user_id        uuid not null references public.profiles (id) on delete cascade,
  ticket_type_id uuid not null references public.ticket_types (id) on delete restrict,
  -- Jeton opaque encodé dans le QR code (64 caractères hex, non devinable).
  qr_token       text not null unique
                 default replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''),
  status         public.ticket_status not null default 'valid',
  checked_in_at  timestamptz,
  created_at     timestamptz not null default now()
);
create index tickets_event_id_idx on public.tickets (event_id);
create index tickets_user_id_idx on public.tickets (user_id);

-- ---------------------------------------------------------------------------
-- updated_at automatique
-- ---------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

create trigger profiles_touch     before update on public.profiles     for each row execute function public.touch_updated_at();
create trigger associations_touch before update on public.associations for each row execute function public.touch_updated_at();
create trigger events_touch       before update on public.events       for each row execute function public.touch_updated_at();
create trigger orders_touch       before update on public.orders       for each row execute function public.touch_updated_at();

-- =============================================================================
-- Helpers de sécurité (SECURITY DEFINER pour éviter la récursion RLS)
-- =============================================================================
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.is_association_member(p_association_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.association_members
    where association_id = p_association_id and user_id = auth.uid()
  ) or public.is_admin();
$$;

create or replace function public.is_association_owner(p_association_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.association_members
    where association_id = p_association_id and user_id = auth.uid() and role = 'owner'
  ) or public.is_admin();
$$;

create or replace function public.is_association_manager(p_association_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.association_members
    where association_id = p_association_id and user_id = auth.uid() and role in ('owner', 'admin')
  ) or public.is_admin();
$$;

create or replace function public.is_event_organizer(p_event_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from public.events e
    join public.association_members m on m.association_id = e.association_id
    where e.id = p_event_id and m.user_id = auth.uid()
  ) or public.is_admin();
$$;

-- Vrai si l'email appartient à l'un des domaines (ou sous-domaines) de l'école.
create or replace function public.email_matches_school(p_email text, p_school_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from public.schools s, unnest(s.email_domains) as d
    where s.id = p_school_id
      and (
        lower(split_part(p_email, '@', 2)) = lower(d)
        or lower(split_part(p_email, '@', 2)) like '%.' || lower(d)
      )
  );
$$;

-- =============================================================================
-- Création automatique du profil à l'inscription
-- Les métadonnées viennent de supabase.auth.signUp({ options: { data } }).
-- =============================================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_school_id uuid := nullif(new.raw_user_meta_data ->> 'school_id', '')::uuid;
begin
  insert into public.profiles (id, email, first_name, last_name, school_id, student_verified)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'first_name', ''),
    coalesce(new.raw_user_meta_data ->> 'last_name', ''),
    v_school_id,
    v_school_id is not null and public.email_matches_school(new.email, v_school_id)
  );
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Les utilisateurs ne peuvent pas s'auto-promouvoir : une mise à jour directe
-- (rôle authenticated/anon) ne peut pas toucher rôle/statut/école/email, sauf admin.
-- Les fonctions SECURITY DEFINER (create_association...) tournent sous le rôle
-- propriétaire et ne sont donc pas bloquées. Ce trigger doit rester SECURITY INVOKER.
create or replace function public.protect_profile_columns()
returns trigger language plpgsql set search_path = '' as $$
begin
  if current_user in ('authenticated', 'anon') and not public.is_admin() then
    if new.role is distinct from old.role
       or new.student_verified is distinct from old.student_verified
       or new.school_id is distinct from old.school_id
       or new.email is distinct from old.email then
      raise exception 'Modification non autorisée de ce champ' using errcode = '42501';
    end if;
  end if;
  return new;
end $$;

create trigger profiles_protect before update on public.profiles
  for each row execute function public.protect_profile_columns();

-- =============================================================================
-- Associations : création (le créateur devient owner + organisateur)
-- =============================================================================
create or replace function public.create_association(
  p_name text,
  p_slug text,
  p_description text default '',
  p_logo_url text default null,
  p_instagram_url text default null,
  p_tiktok_url text default null,
  p_linkedin_url text default null,
  p_website_url text default null
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_profile public.profiles;
  v_id uuid;
begin
  select * into v_profile from public.profiles where id = auth.uid();
  if v_profile.id is null then
    raise exception 'Non authentifié' using errcode = '28000';
  end if;
  if not v_profile.student_verified and v_profile.role <> 'admin' then
    raise exception 'Statut étudiant non vérifié' using errcode = '42501';
  end if;
  if v_profile.school_id is null then
    raise exception 'Aucune école rattachée au profil' using errcode = '22023';
  end if;

  insert into public.associations (
    school_id, name, slug, description, logo_url,
    instagram_url, tiktok_url, linkedin_url, website_url, created_by
  ) values (
    v_profile.school_id, p_name, p_slug, coalesce(p_description, ''), p_logo_url,
    p_instagram_url, p_tiktok_url, p_linkedin_url, p_website_url, v_profile.id
  ) returning id into v_id;

  insert into public.association_members (association_id, user_id, role)
  values (v_id, v_profile.id, 'owner');

  if v_profile.role = 'student' then
    update public.profiles set role = 'organizer' where id = v_profile.id;
  end if;

  return v_id;
end $$;

-- =============================================================================
-- Shotgun : disponibilité publique
-- =============================================================================
-- Commandes qui consomment une place : payées, gratuites, ou panier non expiré.
create or replace function public.order_holds_seat(p_status public.order_status, p_hold_expires_at timestamptz)
returns boolean language sql stable as $$
  select p_status in ('paid', 'free')
      or (p_status = 'pending' and p_hold_expires_at > now());
$$;

create or replace function public.get_event_availability(p_event_id uuid)
returns table (
  ticket_type_id uuid,
  remaining      integer,
  event_remaining integer
)
language sql stable security definer set search_path = '' as $$
  with taken as (
    select o.ticket_type_id, count(*)::int as n
    from public.orders o
    where o.event_id = p_event_id
      and public.order_holds_seat(o.status, o.hold_expires_at)
    group by o.ticket_type_id
  ),
  ev as (
    select e.capacity - coalesce((select sum(n) from taken), 0)::int as left_total
    from public.events e
    where e.id = p_event_id and (e.status = 'published' or public.is_event_organizer(e.id))
  )
  select
    tt.id,
    greatest(0, least(
      ev.left_total,
      coalesce(tt.quota - coalesce(t.n, 0), ev.left_total)
    ))::int,
    greatest(0, ev.left_total)::int
  from public.ticket_types tt
  cross join ev
  left join taken t on t.ticket_type_id = tt.id
  where tt.event_id = p_event_id
  order by tt.sort_order;
$$;

-- =============================================================================
-- Shotgun : réservation atomique (hold de 5 minutes)
-- Le `for update` sur la ligne events sérialise les réservations d'un même
-- événement : impossible de dépasser capacité / quotas même sous forte charge.
-- =============================================================================
create or replace function public.reserve_ticket(
  p_event_id uuid,
  p_ticket_type_id uuid,
  p_member_code text default null
) returns public.orders
language plpgsql security definer set search_path = '' as $$
declare
  c_hold_minutes constant integer := 5;
  c_fee_rate     constant numeric := 0.03;
  v_uid          uuid := auth.uid();
  v_profile      public.profiles;
  v_event        public.events;
  v_asso_school  uuid;
  v_type         public.ticket_types;
  v_existing     public.orders;
  v_order        public.orders;
  v_taken_event  integer;
  v_taken_type   integer;
  v_taken_school integer;
  v_school_quota integer;
  v_has_quotas   boolean;
  v_code         text;
begin
  if v_uid is null then
    raise exception 'Connecte-toi pour réserver' using errcode = '28000';
  end if;

  select * into v_profile from public.profiles where id = v_uid;
  if not coalesce(v_profile.student_verified, false) then
    raise exception 'Ton statut étudiant doit être vérifié pour réserver' using errcode = '42501';
  end if;

  -- Verrou de l'événement (sérialisation du shotgun).
  select * into v_event from public.events where id = p_event_id for update;
  if v_event.id is null or v_event.status <> 'published' then
    raise exception 'Événement introuvable ou non publié' using errcode = 'P0002';
  end if;
  if now() < v_event.shotgun_opens_at then
    raise exception 'Le shotgun n''est pas encore ouvert' using errcode = '55000';
  end if;
  if now() >= v_event.starts_at then
    raise exception 'La billetterie est fermée' using errcode = '55000';
  end if;

  select * into v_type from public.ticket_types
  where id = p_ticket_type_id and event_id = p_event_id;
  if v_type.id is null then
    raise exception 'Tarif introuvable' using errcode = 'P0002';
  end if;

  -- Libère les paniers expirés de cet événement.
  update public.orders
     set status = 'expired'
   where event_id = p_event_id and status = 'pending' and hold_expires_at <= now();

  -- Idempotence : un étudiant qui recharge la page retrouve sa commande.
  select * into v_existing from public.orders
  where event_id = p_event_id and user_id = v_uid and status in ('pending', 'paid', 'free');
  if v_existing.id is not null then
    return v_existing;
  end if;

  -- Contrôle d'accès par école.
  select school_id into v_asso_school from public.associations where id = v_event.association_id;
  if v_event.access_mode = 'school_only' then
    if v_profile.school_id is distinct from v_asso_school then
      raise exception 'Événement réservé aux étudiants de l''école organisatrice' using errcode = '42501';
    end if;
  else
    select exists (select 1 from public.event_school_quotas where event_id = p_event_id)
      into v_has_quotas;
    if v_has_quotas then
      select quota into v_school_quota from public.event_school_quotas
      where event_id = p_event_id and school_id = v_profile.school_id;
      if v_school_quota is null then
        raise exception 'Ton école ne fait pas partie des écoles invitées' using errcode = '42501';
      end if;
      select count(*) into v_taken_school from public.orders
      where event_id = p_event_id and school_id = v_profile.school_id
        and public.order_holds_seat(status, hold_expires_at);
      if v_taken_school >= v_school_quota then
        raise exception 'Plus de places pour ton école' using errcode = '53400';
      end if;
    end if;
  end if;

  -- Tarif adhérent : vérification du code.
  if v_type.kind = 'member' then
    select member_code into v_code from public.event_secrets where event_id = p_event_id;
    if v_code is null or p_member_code is null
       or lower(trim(p_member_code)) <> lower(trim(v_code)) then
      raise exception 'Code adhérent invalide' using errcode = '42501';
    end if;
  end if;

  -- Capacité globale et quota du tarif.
  select count(*) into v_taken_event from public.orders
  where event_id = p_event_id and public.order_holds_seat(status, hold_expires_at);
  if v_taken_event >= v_event.capacity then
    raise exception 'Complet !' using errcode = '53400';
  end if;

  if v_type.quota is not null then
    select count(*) into v_taken_type from public.orders
    where ticket_type_id = v_type.id and public.order_holds_seat(status, hold_expires_at);
    if v_taken_type >= v_type.quota then
      raise exception 'Plus de places à ce tarif' using errcode = '53400';
    end if;
  end if;

  -- Création de la commande. Gratuit => billet immédiat.
  if v_type.price_cents = 0 then
    insert into public.orders (event_id, ticket_type_id, user_id, school_id, status, amount_cents, fee_cents)
    values (p_event_id, v_type.id, v_uid, v_profile.school_id, 'free', 0, 0)
    returning * into v_order;

    insert into public.tickets (order_id, event_id, user_id, ticket_type_id)
    values (v_order.id, p_event_id, v_uid, v_type.id);
  else
    insert into public.orders (
      event_id, ticket_type_id, user_id, school_id, status,
      amount_cents, fee_cents, hold_expires_at
    ) values (
      p_event_id, v_type.id, v_uid, v_profile.school_id, 'pending',
      v_type.price_cents,
      round(v_type.price_cents * c_fee_rate)::int,
      now() + make_interval(mins => c_hold_minutes)
    ) returning * into v_order;
  end if;

  return v_order;
end $$;

-- L'étudiant peut libérer son panier.
create or replace function public.cancel_pending_order(p_order_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  update public.orders
     set status = 'cancelled'
   where id = p_order_id and user_id = auth.uid() and status = 'pending';
end $$;

-- =============================================================================
-- Paiement confirmé (appelé UNIQUEMENT côté serveur avec la clé service_role :
-- webhook Stripe ou mode mock). Idempotent.
-- =============================================================================
create or replace function public.confirm_order_payment(
  p_order_id uuid,
  p_stripe_session_id text default null
) returns public.tickets
language plpgsql security definer set search_path = '' as $$
declare
  v_order  public.orders;
  v_ticket public.tickets;
  v_event  public.events;
  v_type   public.ticket_types;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if v_order.id is null then
    raise exception 'Commande introuvable' using errcode = 'P0002';
  end if;

  if v_order.status = 'paid' then
    select * into v_ticket from public.tickets where order_id = v_order.id;
    return v_ticket;
  end if;

  if v_order.status not in ('pending', 'expired') then
    raise exception 'Commande non payable (statut %)', v_order.status using errcode = '55000';
  end if;

  -- Paiement arrivé après la fin du panier (ex. session Stripe de 30 min) :
  -- on ne l'accepte que s'il reste de la place, sinon l'appelant rembourse.
  if v_order.status = 'expired' or v_order.hold_expires_at <= now() then
    select * into v_event from public.events where id = v_order.event_id for update;
    select * into v_type from public.ticket_types where id = v_order.ticket_type_id;
    if (select count(*) from public.orders o
        where o.event_id = v_order.event_id and o.id <> v_order.id
          and public.order_holds_seat(o.status, o.hold_expires_at)) >= v_event.capacity
       or (v_type.quota is not null and (select count(*) from public.orders o
        where o.ticket_type_id = v_type.id and o.id <> v_order.id
          and public.order_holds_seat(o.status, o.hold_expires_at)) >= v_type.quota)
       or exists (select 1 from public.orders o
        where o.event_id = v_order.event_id and o.user_id = v_order.user_id
          and o.id <> v_order.id and public.order_holds_seat(o.status, o.hold_expires_at)) then
      raise exception 'Complet : paiement à rembourser' using errcode = '53400';
    end if;
  end if;

  update public.orders
     set status = 'paid',
         paid_at = now(),
         hold_expires_at = null,
         stripe_session_id = coalesce(p_stripe_session_id, stripe_session_id)
   where id = v_order.id;

  insert into public.tickets (order_id, event_id, user_id, ticket_type_id)
  values (v_order.id, v_order.event_id, v_order.user_id, v_order.ticket_type_id)
  on conflict (order_id) do nothing
  returning * into v_ticket;

  if v_ticket.id is null then
    select * into v_ticket from public.tickets where order_id = v_order.id;
  end if;
  return v_ticket;
end $$;

-- Annulation par l'organisateur (remboursement à gérer côté Stripe).
create or replace function public.organizer_cancel_order(p_order_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_event_id uuid;
begin
  select event_id into v_event_id from public.orders where id = p_order_id;
  if v_event_id is null or not public.is_event_organizer(v_event_id) then
    raise exception 'Accès refusé' using errcode = '42501';
  end if;
  update public.orders set status = 'cancelled' where id = p_order_id;
  update public.tickets set status = 'cancelled' where order_id = p_order_id;
end $$;

-- =============================================================================
-- Organisateur : liste des participants (émargement)
-- =============================================================================
create or replace function public.get_event_attendees(p_event_id uuid)
returns table (
  order_id       uuid,
  ticket_id      uuid,
  first_name     text,
  last_name      text,
  email          text,
  school_name    text,
  ticket_type    text,
  amount_cents   integer,
  order_status   public.order_status,
  ticket_status  public.ticket_status,
  qr_token       text,
  checked_in_at  timestamptz,
  created_at     timestamptz
)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_event_organizer(p_event_id) then
    raise exception 'Accès refusé' using errcode = '42501';
  end if;

  return query
  select
    o.id, t.id, p.first_name, p.last_name, p.email,
    case when s.id is null then null else s.name || ' ' || s.campus end,
    tt.name, o.amount_cents, o.status, t.status, t.qr_token, t.checked_in_at, o.created_at
  from public.orders o
  join public.profiles p      on p.id = o.user_id
  join public.ticket_types tt on tt.id = o.ticket_type_id
  left join public.schools s  on s.id = o.school_id
  left join public.tickets t  on t.order_id = o.id
  where o.event_id = p_event_id
    and o.status in ('paid', 'free', 'cancelled', 'pending')
    and not (o.status = 'pending' and o.hold_expires_at <= now())
  order by p.last_name, p.first_name;
end $$;

-- Contrôle d'entrée : scan du QR code le jour J.
create or replace function public.check_in_ticket(p_qr_token text)
returns public.tickets
language plpgsql security definer set search_path = '' as $$
declare
  v_ticket public.tickets;
begin
  select * into v_ticket from public.tickets where qr_token = p_qr_token for update;
  if v_ticket.id is null or not public.is_event_organizer(v_ticket.event_id) then
    raise exception 'Billet introuvable' using errcode = 'P0002';
  end if;
  if v_ticket.status = 'cancelled' then
    raise exception 'Billet annulé' using errcode = '55000';
  end if;
  if v_ticket.status = 'used' then
    raise exception 'Billet déjà scanné à %', v_ticket.checked_in_at using errcode = '55000';
  end if;
  update public.tickets set status = 'used', checked_in_at = now()
   where id = v_ticket.id returning * into v_ticket;
  return v_ticket;
end $$;

-- =============================================================================
-- Row Level Security
-- =============================================================================
alter table public.cities              enable row level security;
alter table public.schools             enable row level security;
alter table public.profiles            enable row level security;
alter table public.associations        enable row level security;
alter table public.association_members enable row level security;
alter table public.events              enable row level security;
alter table public.event_secrets       enable row level security;
alter table public.event_school_quotas enable row level security;
alter table public.ticket_types        enable row level security;
alter table public.orders              enable row level security;
alter table public.tickets             enable row level security;

-- Référentiel : lecture publique, écriture admin.
create policy "cities: public read"  on public.cities  for select using (true);
create policy "cities: admin write"  on public.cities  for all using (public.is_admin()) with check (public.is_admin());
create policy "schools: public read" on public.schools for select using (true);
create policy "schools: admin write" on public.schools for all using (public.is_admin()) with check (public.is_admin());

-- Profils : chacun voit / modifie le sien ; les admins voient tout.
create policy "profiles: read own"   on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy "profiles: update own" on public.profiles for update using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

-- Associations : lecture publique ; création via create_association() ;
-- modification par les membres owner/admin.
create policy "associations: public read" on public.associations for select using (true);
create policy "associations: managers update" on public.associations for update
  using (public.is_association_manager(id))
  with check (public.is_association_manager(id));
create policy "associations: admin delete" on public.associations for delete using (public.is_admin());

-- Membres d'asso : visibles par les membres de la même asso.
create policy "association_members: members read" on public.association_members for select
  using (user_id = auth.uid() or public.is_association_member(association_id));
create policy "association_members: owners insert" on public.association_members for insert
  with check (public.is_association_owner(association_id));
create policy "association_members: owners update" on public.association_members for update
  using (public.is_association_owner(association_id))
  with check (public.is_association_owner(association_id));
create policy "association_members: owners delete" on public.association_members for delete
  using (public.is_association_owner(association_id));

-- Événements : publiés visibles par tous ; brouillons par l'asso.
create policy "events: read published or own" on public.events for select
  using (status in ('published', 'cancelled') or public.is_association_member(association_id));
create policy "events: members insert" on public.events for insert
  with check (public.is_association_member(association_id));
create policy "events: members update" on public.events for update
  using (public.is_association_member(association_id))
  with check (public.is_association_member(association_id));
create policy "events: members delete draft" on public.events for delete
  using (status = 'draft' and public.is_association_member(association_id));

create policy "event_secrets: organizers" on public.event_secrets for all
  using (public.is_event_organizer(event_id)) with check (public.is_event_organizer(event_id));

create policy "event_school_quotas: read" on public.event_school_quotas for select
  using (exists (select 1 from public.events e where e.id = event_id));  -- hérite de la RLS events
create policy "event_school_quotas: organizers write" on public.event_school_quotas for all
  using (public.is_event_organizer(event_id)) with check (public.is_event_organizer(event_id));

create policy "ticket_types: read" on public.ticket_types for select
  using (exists (select 1 from public.events e where e.id = event_id));
create policy "ticket_types: organizers write" on public.ticket_types for all
  using (public.is_event_organizer(event_id)) with check (public.is_event_organizer(event_id));

-- Commandes & billets : lecture seule (propriétaire ou organisateur).
-- Toute écriture passe par les fonctions ci-dessus.
create policy "orders: read own or organizer" on public.orders for select
  using (user_id = auth.uid() or public.is_event_organizer(event_id));
create policy "tickets: read own or organizer" on public.tickets for select
  using (user_id = auth.uid() or public.is_event_organizer(event_id));

-- =============================================================================
-- Droits d'exécution des fonctions
-- =============================================================================
revoke execute on all functions in schema public from public, anon, authenticated;

grant execute on function public.is_admin()                                to anon, authenticated;
grant execute on function public.is_association_member(uuid)               to anon, authenticated;
grant execute on function public.is_association_owner(uuid)                to anon, authenticated;
grant execute on function public.is_association_manager(uuid)              to anon, authenticated;
grant execute on function public.is_event_organizer(uuid)                  to anon, authenticated;
grant execute on function public.order_holds_seat(public.order_status, timestamptz) to anon, authenticated;
grant execute on function public.get_event_availability(uuid)              to anon, authenticated;
grant execute on function public.create_association(text, text, text, text, text, text, text, text) to authenticated;
grant execute on function public.reserve_ticket(uuid, uuid, text)          to authenticated;
grant execute on function public.cancel_pending_order(uuid)                to authenticated;
grant execute on function public.organizer_cancel_order(uuid)              to authenticated;
grant execute on function public.get_event_attendees(uuid)                 to authenticated;
grant execute on function public.check_in_ticket(text)                     to authenticated;
-- confirm_order_payment : service_role uniquement (webhook / serveur).
grant execute on function public.confirm_order_payment(uuid, text)         to service_role;

-- =============================================================================
-- Realtime : le dashboard organisateur écoute les nouvelles commandes.
-- =============================================================================
alter publication supabase_realtime add table public.orders;

-- =============================================================================
-- Storage : logos d'assos & visuels d'événements
-- Chemin attendu : "<association_id>/<fichier>"
-- =============================================================================
insert into storage.buckets (id, name, public)
values ('public-assets', 'public-assets', true)
on conflict (id) do nothing;

create policy "public-assets: public read" on storage.objects for select
  using (bucket_id = 'public-assets');
create policy "public-assets: asso members upload" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'public-assets'
    and public.is_association_member(((storage.foldername(name))[1])::uuid)
  );
create policy "public-assets: asso members update" on storage.objects for update to authenticated
  using (
    bucket_id = 'public-assets'
    and public.is_association_member(((storage.foldername(name))[1])::uuid)
  );
create policy "public-assets: asso members delete" on storage.objects for delete to authenticated
  using (
    bucket_id = 'public-assets'
    and public.is_association_member(((storage.foldername(name))[1])::uuid)
  );
