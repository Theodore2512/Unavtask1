-- =============================================================================
-- TAZ — contrôle d'entrée (scan QR) + durcissement associations / Stripe
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Associations : `verified` réservé aux admins, `stripe_account_id` réservé
--    au serveur (onboarding Stripe Connect via la clé service_role).
--    Sans ce garde-fou, un gestionnaire d'asso pouvait s'auto-vérifier ou
--    rediriger les paiements vers un autre compte Stripe.
-- ---------------------------------------------------------------------------
alter table public.associations
  add column stripe_charges_enabled boolean not null default false;

create or replace function public.protect_association_columns()
returns trigger language plpgsql set search_path = '' as $$
begin
  if current_user in ('authenticated', 'anon') then
    if new.stripe_account_id is distinct from old.stripe_account_id
       or new.stripe_charges_enabled is distinct from old.stripe_charges_enabled
       or new.school_id is distinct from old.school_id
       or new.created_by is distinct from old.created_by then
      raise exception 'Modification non autorisée de ce champ' using errcode = '42501';
    end if;
    if new.verified is distinct from old.verified and not public.is_admin() then
      raise exception 'Seul un admin peut vérifier une association' using errcode = '42501';
    end if;
  end if;
  return new;
end $$;

create trigger associations_protect before update on public.associations
  for each row execute function public.protect_association_columns();

-- ---------------------------------------------------------------------------
-- 2. Scan d'entrée : le billet doit appartenir à l'événement scanné.
--    Accepte le jeton complet (QR) ou le code court à 8 caractères affiché
--    sous le QR (saisie manuelle). Ne lève pas d'erreur métier : renvoie un
--    résultat affichable par le scanner (nom du participant compris).
-- ---------------------------------------------------------------------------
drop function if exists public.check_in_ticket(text);

create type public.check_in_result as enum ('ok', 'already_used', 'cancelled', 'not_found');

create or replace function public.check_in_ticket(p_event_id uuid, p_code text)
returns table (
  result        public.check_in_result,
  ticket_id     uuid,
  first_name    text,
  last_name     text,
  school_name   text,
  ticket_type   text,
  checked_in_at timestamptz
)
language plpgsql security definer set search_path = '' as $$
declare
  v_code   text := lower(trim(coalesce(p_code, '')));
  v_ticket public.tickets;
  v_count  integer;
  v_result public.check_in_result;
begin
  if not public.is_event_organizer(p_event_id) then
    raise exception 'Accès refusé' using errcode = '42501';
  end if;

  if char_length(v_code) = 64 then
    select * into v_ticket from public.tickets
    where event_id = p_event_id and qr_token = v_code
    for update;
  elsif char_length(v_code) = 8 then
    select count(*) into v_count from public.tickets
    where event_id = p_event_id and left(qr_token, 8) = v_code;
    if v_count = 1 then
      select * into v_ticket from public.tickets
      where event_id = p_event_id and left(qr_token, 8) = v_code
      for update;
    end if;
  end if;

  if v_ticket.id is null then
    return query select 'not_found'::public.check_in_result,
      null::uuid, null::text, null::text, null::text, null::text, null::timestamptz;
    return;
  end if;

  if v_ticket.status = 'cancelled' then
    v_result := 'cancelled';
  elsif v_ticket.status = 'used' then
    v_result := 'already_used';
  else
    update public.tickets set status = 'used', checked_in_at = now()
     where id = v_ticket.id returning * into v_ticket;
    v_result := 'ok';
  end if;

  return query
  select
    v_result,
    v_ticket.id, p.first_name, p.last_name,
    case when s.id is null then null else s.name || ' ' || s.campus end,
    tt.name, v_ticket.checked_in_at
  from public.profiles p
  join public.ticket_types tt on tt.id = v_ticket.ticket_type_id
  left join public.orders o on o.id = v_ticket.order_id
  left join public.schools s on s.id = o.school_id
  where p.id = v_ticket.user_id;
end $$;

revoke execute on function public.check_in_ticket(uuid, text) from public, anon;
grant execute on function public.check_in_ticket(uuid, text) to authenticated;
revoke execute on function public.protect_association_columns() from public, anon, authenticated;
