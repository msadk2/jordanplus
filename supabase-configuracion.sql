-- SPINNINGTV · CONFIGURACIÓN DE SUPABASE
-- Antes de ejecutar este archivo:
-- 1. Crea en Authentication > Users el usuario administrador.
-- 2. Sustituye TU_CORREO_ADMIN por el mismo correo en las DOS apariciones.

create table if not exists public.admin_config (
  id smallint primary key default 1 check (id = 1),
  username text not null unique check (username ~ '^[A-Za-z0-9._-]{3,32}$'),
  admin_user_id uuid not null references auth.users(id) on delete restrict,
  updated_at timestamptz not null default now()
);

create table if not exists public.cartelera (
  id smallint primary key default 1 check (id = 1),
  content text not null default '' check (char_length(content) <= 50000),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

alter table public.admin_config enable row level security;
alter table public.cartelera enable row level security;

revoke all on table public.admin_config from anon, authenticated;
revoke all on table public.cartelera from anon, authenticated;

grant select on table public.admin_config to anon, authenticated;
grant update (username, updated_at) on table public.admin_config to authenticated;
grant select on table public.cartelera to anon, authenticated;
grant update (content, updated_at) on table public.cartelera to authenticated;

drop policy if exists "Configuracion visible" on public.admin_config;
create policy "Configuracion visible"
on public.admin_config for select
to anon, authenticated
using (true);

drop policy if exists "Solo admin cambia usuario" on public.admin_config;
create policy "Solo admin cambia usuario"
on public.admin_config for update
to authenticated
using ((select auth.uid()) = admin_user_id)
with check ((select auth.uid()) = admin_user_id);

drop policy if exists "Cartelera visible" on public.cartelera;
create policy "Cartelera visible"
on public.cartelera for select
to anon, authenticated
using (true);

drop policy if exists "Solo admin publica" on public.cartelera;
create policy "Solo admin publica"
on public.cartelera for update
to authenticated
using (
  exists (
    select 1 from public.admin_config
    where admin_config.admin_user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1 from public.admin_config
    where admin_config.admin_user_id = (select auth.uid())
  )
);

insert into public.admin_config (id, username, admin_user_id)
select 1, 'admin', id
from auth.users
where lower(email) = lower('djmantex2013@gmail.com')
on conflict (id) do update
set admin_user_id = excluded.admin_user_id;

do $$
begin
  if not exists (select 1 from public.admin_config where id = 1) then
    raise exception 'No se encontró el usuario. Revisa djmantex2013@gmail.com y vuelve a ejecutar el script.';
  end if;
end $$;

insert into public.cartelera (id, content)
values (1, '')
on conflict (id) do nothing;
