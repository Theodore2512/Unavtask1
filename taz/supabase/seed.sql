-- =============================================================================
-- TAZ — données de référence : villes & écoles (campus)
-- ⚠️ Vérifier les domaines email étudiants de chaque école avant la mise en prod.
-- =============================================================================
insert into public.cities (name, slug) values
  ('Lille', 'lille'),
  ('Paris', 'paris'),
  ('Lyon', 'lyon'),
  ('Nice', 'nice'),
  ('Bordeaux', 'bordeaux')
on conflict (slug) do nothing;

insert into public.schools (city_id, name, campus, email_domains)
select c.id, v.name, v.campus, v.domains
from (values
  ('lille',    'IÉSEG',                'Lille',           array['ieseg.fr']),
  ('lille',    'EDHEC',                'Lille',           array['edhec.com']),
  ('lille',    'SKEMA',                'Lille',           array['skema.edu']),
  ('lille',    'Sciences Po Lille',    'Lille',           array['sciencespo-lille.eu']),
  ('lille',    'Université de Lille',  'Cité Scientifique', array['univ-lille.fr']),
  ('paris',    'IÉSEG',                'Paris La Défense', array['ieseg.fr']),
  ('paris',    'ESSEC',                'Cergy',           array['essec.edu']),
  ('paris',    'ESCP',                 'Paris',           array['edu.escp.eu']),
  ('paris',    'HEC Paris',            'Jouy-en-Josas',   array['hec.edu']),
  ('paris',    'Université Paris Dauphine-PSL', 'Paris', array['dauphine.eu']),
  ('lyon',     'emlyon business school', 'Écully',        array['edu.em-lyon.com']),
  ('lyon',     'INSA Lyon',            'Villeurbanne',    array['insa-lyon.fr']),
  ('nice',     'EDHEC',                'Nice',            array['edhec.com']),
  ('nice',     'SKEMA',                'Sophia Antipolis', array['skema.edu']),
  ('bordeaux', 'KEDGE',                'Bordeaux',        array['kedgebs.com'])
) as v(city_slug, name, campus, domains)
join public.cities c on c.slug = v.city_slug
on conflict (name, campus) do nothing;
